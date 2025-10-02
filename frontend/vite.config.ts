import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to handle malformed URLs
const malformedUrlHandler: Plugin = {
  name: 'malformed-url-handler',
  configureServer(server) {
    server.middlewares.use((req: any, res: any, next: any) => {
      try {
        // Validate URL before processing
        if (req.url) {
          decodeURI(req.url);
        }
        next();
      } catch (e) {
        if (e instanceof URIError) {
          res.writeHead(302, { Location: '/' });
          res.end();
          return;
        }
        next(e);
      }
    });
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), malformedUrlHandler],
})
