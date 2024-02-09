import { sync } from "glob";
import _ from "lodash";

const files = _.shuffle(sync("./src/**/*.test.ts"));
for (const file of files) {
  await import(`./${file}`);
}
