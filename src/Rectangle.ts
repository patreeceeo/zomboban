export class Rectangle {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
  ) {}

  includes(x: number, y: number): boolean {
    return x >= this.x1 && x <= this.x2 && y >= this.y1 && y <= this.y2;
  }
}
