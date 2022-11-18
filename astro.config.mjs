import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import partytown from "@astrojs/partytown"

import netlify from "@astrojs/netlify/functions"; // https://astro.build/config


// https://astro.build/config
export default defineConfig({
  site: 'https://www.donaldjewkes.com',
  integrations: [tailwind({
    config: {
      applyBaseStyles: true
    }
  }), 
  image({
    serviceEntryPoint: '@astrojs/image/sharp',
    logLevel: 'debug'
  }), 
  react(),
  partytown({
    config: {
      forward: ["dataLayer.push"],
    }
  })

  ],
  output: 'server',
  adapter: netlify({
    dist: new URL('./dist/', import.meta.url)
  })
});