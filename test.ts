import { sync } from "glob";

const files = sync("./src/**/*.test.ts");
for (const file of files) {
  console.log(`Running ${file}`);
  await import(`./${file}`);
}
