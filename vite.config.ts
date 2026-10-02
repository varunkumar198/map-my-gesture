import { readFileSync } from 'node:fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { tomorrowProxyPlugin } from './examples/server/tomorrow-proxy.ts';

const root = fileURLToPath(new URL('.', import.meta.url));

/** @mediapipe/tasks-vision references vision_bundle_mjs.js.map but only ships vision_bundle.mjs.map */
function mediapipeBrokenSourcemapWorkaround(): Plugin {
  return {
    name: 'mediapipe-broken-sourcemap-url',
    enforce: 'pre',
    load(id) {
      const path = id.split('?')[0];
      if (
        path.includes('@mediapipe/tasks-vision') &&
        path.endsWith('vision_bundle.mjs')
      ) {
        const code = readFileSync(path, 'utf-8').replace(
          /\n\/\/# sourceMappingURL=[^\n]+/,
          '',
        );
        return { code, map: null };
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  if (env.TOMORROW_API_KEY && !process.env.TOMORROW_API_KEY) {
    process.env.TOMORROW_API_KEY = env.TOMORROW_API_KEY;
  }
  if (env.VITE_TOMORROW_API_KEY && !process.env.VITE_TOMORROW_API_KEY) {
    process.env.VITE_TOMORROW_API_KEY = env.VITE_TOMORROW_API_KEY;
  }
  if (!process.env.VITE_MAPPLS_API_KEY) {
    process.env.VITE_MAPPLS_API_KEY =
      env.VITE_MAPPLS_API_KEY || env.MAPPLS_API_KEY || '';
  }

  return {
    root: 'examples',
    envDir: root,
    envPrefix: ['VITE_', 'GFW_', 'CARTO_', 'MAPPLS_', 'TOMORROW_'],
    base: '/map-gesture-controls/',
    plugins: [mediapipeBrokenSourcemapWorkaround(), tomorrowProxyPlugin()],
    resolve: {
      alias: {
        '@map-gesture-controls/core': resolve(
          root,
          'packages/map-gesture-core/src/index.ts',
        ),
        '@map-gesture-controls/ol': resolve(
          root,
          'packages/ol-gesture-controls/src/index.ts',
        ),
        '@map-gesture-controls/google-maps': resolve(
          root,
          'packages/google-maps-gesture-controls/src/index.ts',
        ),
        '@map-gesture-controls/leaflet': resolve(
          root,
          'packages/leaflet-gesture-controls/src/index.ts',
        ),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        input: {
          index: resolve(root, 'examples/index.html'),
          examples: resolve(root, 'examples/examples.html'),
          tactical: resolve(root, 'examples/demo-tactical.html'),
        },
      },
    },
    optimizeDeps: {
      exclude: ['@mediapipe/tasks-vision'],
    },
  };
});
