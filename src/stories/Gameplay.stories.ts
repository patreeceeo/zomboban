import {Meta, StoryObj} from "@storybook/html-vite"
import {createGameplay} from "./Gameplay";

const meta = {
  title: "Gameplay/EnterTileJustBeforeNPC",
  render: (_args) => {
    return createGameplay();
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<any>;

export const EnterTileJustBeforeNPC: Story = {
  args: {}
}

