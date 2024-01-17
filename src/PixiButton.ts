import { NineSlicePlane } from "@pixi/mesh-extras";
import { Text } from "@pixi/text";
import { Texture, ITextStyle } from "pixi.js";

interface PixiButtonSettings {
  width: number;
  height: number;
  padding: number;
  label: string;
  labelStyle: Partial<ITextStyle>;
}

const defaultSettings: PixiButtonSettings = {
  width: 200,
  height: 100,
  padding: 8,
  label: "Button",
  labelStyle: {
    fontSize: "32px",
    fill: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  },
};

export class PixiButton extends NineSlicePlane {
  settings = defaultSettings;
  label: Text;

  constructor(inputSettings?: Partial<PixiButtonSettings>) {
    super(Texture.EMPTY, 0, 0, 0, 0);

    const label = (this.label = new Text(""));
    label.anchor.set(0.5);
    this.addChild(label);

    this.update(inputSettings);
  }

  update(inputSettings?: Partial<PixiButtonSettings>) {
    // Creating new settings which include old ones and apply new ones over it
    if (inputSettings) {
      Object.assign(this.settings, inputSettings);
    }
    const {
      label,
      settings: { label: labelString, labelStyle },
    } = this;
    label.text = labelString;
    label.style = labelStyle;

    this.onResize();
  }

  onResize() {
    const {
      label,
      settings: { width, height, padding },
    } = this;

    this.width = width;
    this.height = height;

    label.x = width * 0.5;
    label.y = height * 0.5;

    this.width = width;
    this.height = height;
    this.leftWidth =
      this.rightWidth =
      this.topHeight =
      this.bottomHeight =
        padding;

    this.pivot.set(width * 0.5, height * 0.5);
  }
}
