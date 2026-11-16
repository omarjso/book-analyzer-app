import appConfig from '../../frontend/vite.config.js';

// Keep cloud-only routing separate from the app's local and production config.
export default {
  ...appConfig,
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 5173),
    strictPort: true,
    allowedHosts: process.env.NITESHIFT_PORT_5173_URL
      ? [new URL(process.env.NITESHIFT_PORT_5173_URL).hostname]
      : [],
    proxy: {
      '/api': 'http://127.0.0.1:5001',
    },
  },
};
