import {Parcel} from '@parcel/core';
import debounce from 'debounce';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';

let bundler = new Parcel({
  shouldBuildLazily: true,
  entries: 'src/index.html',
  defaultConfig: '@parcel/config-default',
  serveOptions: {
    port: 1234,
  },
  hmrOptions: {
    port: 1234
  }
});

bundler.watch((err, event) => {
  if (err) {
    // fatal error
    throw err;
  }

  if (event!.type === 'buildSuccess') {
    let bundles = event!.bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${event!.buildTime}ms!`);
  } else if (event!.type === 'buildFailure') {
    console.log(event!.diagnostics);
  }
});


const wss = new WebSocketServer({ port: 2345 });

wss.on('connection', handleConnection)
wss.on('error', console.error)
wss.on('close', console.log)

async function handleConnection(ws: WebSocket) {
  console.log("connected")
  const handler = debounce(handleFsEvent, 100)

  chokidar.watch('.').on('all', handler);

  function handleFsEvent(event: string, path: string) {
    console.log(event, path)
  }
}

