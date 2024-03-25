export class Rectangle {
  constructor(
    public xMin: number,
    public yMin: number,
    public xMax: number,
    public yMax: number
  ) {}

  intersectsPoint(x: number, y: number) {
    return x >= this.xMin && x <= this.xMax && y >= this.yMin && y <= this.yMax;
  }

  setCenter(x: number, y: number) {
    const width = this.xMax - this.xMin;
    const height = this.yMax - this.yMin;
    this.xMin = x - width / 2;
    this.xMax = x + width / 2;
    this.yMin = y - height / 2;
    this.yMax = y + height / 2;
    return this;
  }

  toString() {
    return `Rectangle(${this.xMin}, ${this.yMin}, ${this.xMax}, ${this.yMax})`;
  }
}
