import fs from "node:fs/promises";

const jsonString = await fs.readFile("data/default", "utf8");
const serialized = JSON.parse(jsonString);

const byXYZ = [] as any[][][];

const newSerialized = [] as any[];

for (const entityData of serialized) {
  delete entityData.isAdded;
  entityData.levelId = 0;

  const pos = entityData.transform.position;
  const byYZ = (byXYZ[pos.x] ??= []);
  const byZ = (byYZ[pos.y] ??= []);
  if (byZ[pos.z] === undefined) {
    byZ[pos.z] = entityData;
    newSerialized.push(entityData);
  }
}

console.log("removed", serialized.length - newSerialized.length, "duplicates");

const newJsonString = JSON.stringify(newSerialized, null, 2);
await fs.writeFile("data/default", newJsonString, "utf8");
