import {Meta, StoryObj} from "@storybook/html-vite"
import {start} from "../Zomboban";
import {State} from "../state";
import {deserializeWorld} from "../functions/Networking";

export default {
  title: "Gameplay/Player",
  render: (_args) => {
    const canvas = document.createElement('canvas')
    const state = new State();
    state.canvas = canvas;

    const worldData = [
      {
        "levelId": state.currentLevelId,
        "transform": {
          "position": {
            "x": 0,
            "y": 64,
            "z": 0
          },
          "rotation": {
            "x": 0,
            "y": 0,
            "z": 0
          },
          "scale": {
            "x": 1,
            "y": 1,
            "z": 1
          },
          "visible": true
        },
        "tilePosition": {
          "x": 0,
          "y": 1,
          "z": 0
        },
        "modelId": "/assets/models/player.glb",
        "behaviorId": "player",
        "headingDirection": 1,
        "isGameEntity": true,
      },
    ]

    start(state);

    deserializeWorld(state.world, worldData)

    return canvas;
  },
} satisfies Meta;


type Story = StoryObj<any>;

export const Player: Story = {
  args: {}
}

