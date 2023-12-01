import * as chokidar from "chokidar";
const watchPath = process.argv[2];
if (!watchPath) {
  console.error("Please provide a path to watch");
  process.exit(1);
}
console.log("watching", watchPath);
var watcher = chokidar.watch(watchPath);
let n = 0;
let dispose = () => Promise.resolve();
watcher.on("ready", function () {
  watcher.on("all", async function () {
    await reload();
    console.log("reloaded", watchPath);
  });
});

async function reload() {
  await dispose();
  n++;
  const module = await import(`${watchPath}#${n}`);
  dispose = module.dispose;
}

reload();
