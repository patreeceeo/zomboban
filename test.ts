import { setMaxListeners } from "events";
import { sync } from "glob";
import _ from "lodash";
import { argv } from "process";

const glob = argv[2] || "src/**/*.test.ts";

setMaxListeners(55); // very scientific number /s

const files = _.shuffle(sync(glob));
for (const file of files) {
  console.log("running", file);
  await import(`./${file}`);
}
