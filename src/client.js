import {PubSub, ReqResp} from '@lannuttia/telegram';

import {TYPE, FIELD} from './constants';

export default class SimpleMPClient {
  constructor(url) {
    this._connection = new WebSocket(url);
    this._onopenCallbacks = [];
    this._connection.onopen = () => {
      for (let idx=this._onopenCallbacks.length - 1; idx >= 0; idx--) {
        this._onopenCallbacks.pop()();
      }
    };
    this._pubsub = new PubSub();
    this._reqresp = new ReqResp();
    this._connection.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const topic = payload.topic;
      if ( 'sequence' in payload) {
      } else {
        this._pubsub.publish(topic, payload.content);
      }
    };
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
      this._send(message);
      return;
    } catch (error) {
      throw error;
    }
  }

  async subscribe(topic, callback) {
    const message = _createMessage(TYPE.SUBSCRIPTION, topic);
    try {
      await this.connection;
      this._send(message);
      this._pubsub.subscribe(topic, this, callback);
      return;
    } catch (error) {
      throw error;
    }
  }

  async unsubscribe(topic) {
    const message = _createMessage(TYPE.UNSUBSCRIPTION, topic);
    try {
      await this.connection;
      this._send(message);
      this._pubsub.unsubscribe(topic, this);
    } catch (error) {
      throw error;
    }
  }

  _send(data) {
    return this._connection.send(JSON.stringify(data));
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

  return message;
}
