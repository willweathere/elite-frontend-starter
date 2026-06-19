import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Reveal } from "./reveal";

const meta = {
  title: "Motion/Reveal",
  component: Reveal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="rounded-xl border border-white/15 px-10 py-8 text-2xl font-semibold">
        Scroll-reveal content
      </div>
    ),
  },
};

export const Delayed: Story = {
  args: {
    delay: 0.4,
    children: (
      <div className="rounded-xl border border-white/15 px-10 py-8 text-2xl font-semibold">
        Delayed by 0.4s
      </div>
    ),
  },
};
