import { sync } from "glob";
import _ from "lodash";

const files = _.shuffle(sync("./src/**/*.test.ts")).filter(
  (file) => !file.endsWith("ComponentData.test.ts"),
);
// even with the await, the tests seem to run in parallel a bit. This seems to be the only test impacted by that so run it first.
files.unshift("./src/ComponentData.test.ts");
for (const file of files) {
  console.log(`Running ${file}`);
  await import(`./${file}`);
  console.log(`Finished ${file}`);
}
