export class ExtendedArray extends Array {
  at(offset: number) {
    const len = this.length;
    const index = offset < 0 && offset > -len ? len + offset : offset;
    return this[index];
  }
}

Array.prototype.at ??= ExtendedArray.prototype.at;
(Array.prototype as any).at2 = ExtendedArray.prototype.at;
