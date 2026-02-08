import express from 'express';

let cachedHandler: express.Express | null = null;
let initPromise: Promise<express.Express> | null = null;

async function getHandler(): Promise<express.Express> {
  if (cachedHandler) return cachedHandler;

  // Prevent multiple concurrent initializations during cold start
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // Import from pre-built dist/ (NestJS decorators require tsc, not esbuild)
        const { configureApp } = await import('../dist/main');
        const expressApp = express();
        const { app } = await configureApp(expressApp);
        await app.init();
        cachedHandler = expressApp;
        return expressApp;
      } catch (err) {
        initPromise = null;
        throw err;
      }
    })();
  }

  return initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const expressApp = await getHandler();
    expressApp(req, res);
  } catch (err) {
    console.error('Failed to initialize NestJS app:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
