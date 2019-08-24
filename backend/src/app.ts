import WebSocketExpress from 'websocket-express';
import CollectionStorage from 'collection-storage';
import Hasher from 'pwd-hasher';
import ApiConfigRouter from './routers/ApiConfigRouter';
import ApiAuthRouter from './routers/ApiAuthRouter';
import ApiSlugsRouter from './routers/ApiSlugsRouter';
import ApiSsoRouter from './routers/ApiSsoRouter';
import ApiRetrosRouter from './routers/ApiRetrosRouter';
import StaticRouter from './routers/StaticRouter';
import TokenManager from './tokens/TokenManager';
import SsoService from './services/SsoService';
import RetroService, { TopicMessage } from './services/RetroService';
import RetroArchiveService from './services/RetroArchiveService';
import RetroAuthService from './services/RetroAuthService';
import UserAuthService from './services/UserAuthService';
import InMemoryTopic from './queue/InMemoryTopic';
import Topic from './queue/Topic';
import TrackingTopicMap from './queue/TrackingTopicMap';
import { ConfigT } from './config';

export interface TestHooks {
  retroService: RetroService;
  retroArchiveService: RetroArchiveService;
  retroAuthService: RetroAuthService;
  userAuthService: UserAuthService;
}

interface TestHookWebSocketExpress extends WebSocketExpress {
  testHooks: TestHooks;
}

const CSP = [
  'base-uri \'self\'',
  'default-src \'self\'',
  'object-src \'none\'',
  'script-src \'self\' \'unsafe-eval\'',
  'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
  'font-src \'self\' https://fonts.gstatic.com',
  'connect-src \'self\' https://api.pwnedpasswords.com',
  'img-src \'self\'',
  'form-action \'none\'',
].join('; ');

export default async (config: ConfigT): Promise<TestHookWebSocketExpress> => {
  const db = await CollectionStorage.connect(config.db.url);

  const hasher = new Hasher(config.password);
  const tokenManager = new TokenManager(config.token);

  const retroChangeSubs = new TrackingTopicMap(
    (): Topic<TopicMessage> => new InMemoryTopic<TopicMessage>(),
  );

  const ssoService = new SsoService(config.sso);
  const retroService = new RetroService(db, retroChangeSubs);
  const retroArchiveService = new RetroArchiveService(db);
  const retroAuthService = new RetroAuthService(db, hasher, tokenManager);
  const userAuthService = new UserAuthService(tokenManager);
  await userAuthService.initialise(db);

  const app = new WebSocketExpress();

  app.disable('x-powered-by');
  app.enable('case sensitive routing');
  app.use(WebSocketExpress.json({ limit: 5 * 1024 }));

  app.useHTTP((req, res, next) => {
    res.header('x-frame-options', 'DENY');
    res.header('x-xss-protection', '1; mode=block');
    res.header('x-content-type-options', 'nosniff');
    res.header('content-security-policy', CSP);
    next();
  });

  app.useHTTP('/api', (req, res, next) => {
    res.header('cache-control', 'no-cache, no-store');
    res.header('expires', '0');
    res.header('pragma', 'no-cache');
    res.removeHeader('content-security-policy');
    next();
  });

  app.use('/api/auth', new ApiAuthRouter(retroAuthService));
  app.use('/api/slugs', new ApiSlugsRouter(retroService));
  app.use('/api/config', new ApiConfigRouter(config));
  app.use('/api/sso', new ApiSsoRouter(userAuthService, ssoService));
  app.use('/api/retros', new ApiRetrosRouter(
    userAuthService,
    retroAuthService,
    retroService,
    retroArchiveService,
  ));
  app.use(new StaticRouter(config.forwardHost));

  const testHookApp = app as TestHookWebSocketExpress;
  testHookApp.testHooks = {
    retroService,
    retroArchiveService,
    retroAuthService,
    userAuthService,
  };

  return testHookApp;
};
