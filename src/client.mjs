import {TYPE, FIELD} from './constants.mjs';

export default class SimpleMPClient {
  constructor(url) {
    this._connection = new WebSocket(url);
    this._onopenCallbacks = [];
    this._connection.onopen = () => {
      for (let idx=this._onopenCallbacks.length - 1; idx >= 0; idx--) {
        this._onopenCallbacks.pop()();
      }
    }
    this._subscriptions = new Map();
    this._requests = new Map();
    this._connection.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const topic = payload.topic;
      if (
        'sequence' in payload
        && this._requests.has(topic)
      ) {
      } else if (
        !('sequence' in payload)
        && this._subscriptions.has(topic)
      ) {
        this._subscriptions.get(topic).forEach((cb) => cb(payload.content));
      } else {
        console.warn('No recognized way to handle message:', payload);
      }
    }
  }

  get connection() {
    return new Promise((resolve) => {
      if (this._connection.readyState === 1) {
        resolve();
      } else {
        this._onopenCallbacks.push(resolve);
      }
    });
  }

  async publish(topic, content=null) {
    const message = _createMessage(TYPE.PUBLICATION, topic, {content});
    try {
      await this.connection;
      this._connection.send(JSON.stringify(message));
      return;
    } catch (error) {
      throw error;
    }
  }

  async subscribe(topic, callback) {
    const message = _createMessage(TYPE.SUBSCRIPTION, topic);
    try {
      await this.connection;
      this._connection.send(JSON.stringify(message));
      if (this._subscriptions.has(topic)) {
        this._subscriptions.get(topic).push(callback);
      } else {
        this._subscriptions.set(topic, [callback]);
      }
      return;
    } catch (error) {
      throw error;
    }
  }
}

function _createMessage(type, topic, kwargs={}) {
  const message = {
    [FIELD.TYPE]: type,
    [FIELD.TOPIC]: topic,
  };

  if ('sequence' in kwargs && kwargs.sequence !== null) {
    message[FIELD.SEQUENCE] = kwargs.sequence;
  }
  if ('content' in kwargs && kwargs.content !== null) {
    message[FIELD.CONTENT] = kwargs.content;
  }

  return message
}
