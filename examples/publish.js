const W3CWebSocket = require('websocket').w3cwebsocket;
global.WebSocket = W3CWebSocket;
const yargs = require('yargs');

const kwargs = yargs
    .usage('Usage: $0 [OPTIONS]')
    .command('Publish a message on the simplemp message bus.')
    .alias('u', 'url')
    .nargs('u', 1)
    .describe('url of the Simple MP server.')
    .alias('t', 'topic')
    .nargs('t', 1)
    .describe('topic to publish to.')
    .demandOption(['u', 't'])
    .help('h')
    .alias('h', '--help')
    .argv;

main(kwargs);

async function main(kwargs) {
  const {
    url,
    topic,
  } = kwargs;
  const {default: SimpleMPClient} = await import('../src/client.mjs');
  const client = new SimpleMPClient(url);
  try {
    await client.publish(topic, {test: 'payload'});
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
