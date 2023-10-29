import {Parcel} from '@parcel/core';
import {exit} from 'process';

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

const subscription = await bundler.watch((err, event) => {
  if (err) {
    // fatal error
    throw err;
  }

  if (event!.type === 'buildSuccess') {
    let bundles = event!.bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${event!.buildTime}ms!`);
  } else if (event!.type === 'buildFailure') {
    console.log(JSON.stringify(event!.diagnostics, null, 2));
  }
});

setTimeout(() => {
  subscription.unsubscribe();
  console.log("Automatically stopped bundler after 15 minutes. Go take a break!");
  exit();
}, 1000 * 60 * 15);
