import {Meta, StoryObj} from "@storybook/html-vite"
import {setupCanvas} from "../Zomboban";
import {State} from "../state";

export default {
  title: "Gameplay/EnterTileJustBeforeNPC",
  render: (_args) => {
    const canvas = document.createElement('canvas')
    const state = new State();
    state.canvas = canvas;
    setupCanvas(state);
    return canvas;
  },
} satisfies Meta;


type Story = StoryObj<any>;

export const EnterTileJustBeforeNPC: Story = {
  args: {}
}

