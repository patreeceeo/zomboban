import type { StorybookConfig } from '@storybook/html-vite';

import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-docs')
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/html-vite'),
    "options": {}
  },
  "viteFinal": async (config) => {
    // Add Marko plugin to Vite configuration for Storybook
    const marko = (await import('@marko/vite')).default;
    config.plugins = config.plugins || [];
    config.plugins.push(marko());
    return config;
  }
};
export default config;