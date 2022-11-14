import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
// import netlify from "@astrojs/netlify/functions";

// https://astro.build/config
export default defineConfig({
  site: 'https://www.donaldjewkes.com',
  integrations: [tailwind({
    config: {
      applyBaseStyles: true
    }
  }), image({
    serviceEntryPoint: '@astrojs/image/sharp',
    logLevel: 'debug'
  })],
  // output: 'server',
  // adapter: netlify({
  //   dist: new URL('./dist/', import.meta.url)
  // })
});