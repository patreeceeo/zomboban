const indexes = [] as number[];
const iterations = 1000000;
const range = 100000;
for (let i = 0; i < iterations; i++) {
  indexes.push(Math.floor(Math.random() * range));
}

const map = new Map<number, number>();
const set = new Set<number>();
const array = [] as number[];

console.time("Map.set");
for (let i = 0; i < iterations; i++) {
  map.set(indexes[i], i);
}
console.timeEnd("Map.set");

console.time("Array set");
for (let i = 0; i < iterations; i++) {
  array[indexes[i]] = i;
}
console.timeEnd("Array set");

console.time("Set.add");
for (let i = 0; i < iterations; i++) {
  set.add(indexes[i]);
}
console.timeEnd("Set.add");

console.time("Map.has");
for (let i = 0; i < iterations; i++) {
  map.has(indexes[i]);
}
console.timeEnd("Map.has");

console.time("in Array");
for (let i = 0; i < iterations; i++) {
  indexes[i] in array;
}
console.timeEnd("in Array");

console.time("Set.has");
for (let i = 0; i < iterations; i++) {
  set.has(indexes[i]);
}
console.timeEnd("Set.has");

console.time("Map.get");
for (let i = 0; i < iterations; i++) {
  map.get(indexes[i]);
}
console.timeEnd("Map.get");

console.time("Array get");
for (let i = 0; i < iterations; i++) {
  array[indexes[i]];
}
console.timeEnd("Array get");

console.time("Map.delete");
for (let i = 0; i < iterations; i++) {
  map.delete(indexes[i]);
}
console.timeEnd("Map.delete");

console.time("Array delete");
for (let i = 0; i < iterations; i++) {
  delete array[indexes[i]];
}
console.timeEnd("Array delete");
