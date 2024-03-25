export class Rectangle {
  constructor(
    public xMin: number,
    public yMin: number,
    public xMax: number,
    public yMax: number
  ) {}

  static fromCenterAndSize(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) {
    return new Rectangle(
      centerX - width / 2,
      centerY - height / 2,
      centerX + width / 2,
      centerY + height / 2
    );
  }

  intersectsPoint(x: number, y: number) {
    return x >= this.xMin && x <= this.xMax && y >= this.yMin && y <= this.yMax;
  }
}
