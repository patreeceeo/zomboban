import { NineSlicePlane } from "@pixi/mesh-extras";
import { Text } from "@pixi/text";
import { Texture, ITextStyle } from "pixi.js";
import { ButtonContainer } from "@pixi/ui";

interface ButtonStyleSettings {
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
  label: string;
  labelStyle: Partial<ITextStyle>;
}

const defaultStyle: ButtonStyleSettings = {
  width: 128,
  height: 48,
  paddingX: 22,
  paddingY: 12,
  label: "Button",
  labelStyle: {
    fontSize: "32px",
    fill: "#ffffff",
    stroke: "#3d003d",
    strokeThickness: 2,
  },
};

export class Button extends ButtonContainer {
  constructor(public style: ButtonStyle) {
    super(style);
  }
}

export class ButtonStyle extends NineSlicePlane {
  settings = defaultStyle;
  label: Text;

  constructor(inputSettings?: Partial<ButtonStyleSettings>) {
    super(Texture.EMPTY, 0, 0, 0, 0);

    const label = (this.label = new Text(""));
    label.anchor.set(0.5);
    this.addChild(label);

    this.update(inputSettings);
  }

  update(inputSettings?: Partial<ButtonStyleSettings>) {
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
      settings: { width, height, paddingX, paddingY },
    } = this;

    this.width = width;
    this.height = height;

    label.x = width * 0.5;
    label.y = height * 0.4;

    this.width = width;
    this.height = height;
    this.leftWidth = this.rightWidth = paddingX;
    this.topHeight = this.bottomHeight = paddingY;

    this.pivot.set(width * 0.5, height * 0.5);
  }
}
