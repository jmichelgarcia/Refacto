import WebSocketExpress from 'websocket-express';
import expressStaticGzip from 'express-static-gzip';
import path from 'path';
import basedir from '../basedir';

const VERSIONED_FILE = /\..{4,}\.(css|js|woff2?)(\.(br|gz))?$/;
const VERSIONED_MAX_AGE = 365 * 24 * 60 * 60;
const UNVERSIONED_MAX_AGE = 10 * 60;

export default class StaticRouter extends WebSocketExpress.Router {
  public constructor(forwardHost: string | null = null) {
    super();

    if (forwardHost) {
      // Dev mode: forward unknown requests to another service
      import('http-proxy-middleware')
        .then(({ createProxyMiddleware }) => {
          this.useHTTP(createProxyMiddleware({ target: forwardHost, logLevel: 'warn' }));
        })
        .catch((e) => {
          process.stderr.write((
            `Failed to apply frontend forwarding to ${forwardHost} ` +
            '(only API will be available)\n'
          ));
          process.stderr.write(`${e.message}\n`);
        });
    } else {
      const staticDir = path.join(basedir, 'static');

      // Production mode: all resources are copied into /static
      const staticRouter = expressStaticGzip(staticDir, {
        enableBrotli: true,
        orderPreference: ['br'],
        serveStatic: {
          maxAge: UNVERSIONED_MAX_AGE * 1000,
          redirect: false,
          setHeaders: (res, filePath): void => {
            if (VERSIONED_FILE.test(filePath)) {
              res.header(
                'cache-control',
                `public, max-age=${VERSIONED_MAX_AGE}, immutable`,
              );
            }
          },
        },
      });
      this.use(staticRouter);

      // Single page app: serve index.html for any unknown GET request
      this.get('*', (req, res, next) => {
        req.url = '/index.html';
        staticRouter(req, res, next);
      });
    }
  }
}
