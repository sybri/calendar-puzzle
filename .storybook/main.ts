import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|js)"],
  framework: "@storybook/web-components-vite",
};

export default config;
