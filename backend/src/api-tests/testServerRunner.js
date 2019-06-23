export default (serverFn) => {
  let server;

  beforeEach((done) => {
    server = null;
    Promise.resolve(serverFn())
      .then((rawServer) => {
        server = rawServer.listen(0, 'localhost', done);
      })
      .catch((e) => done.fail(e));
  });

  afterEach((done) => {
    if (server) {
      const tempServer = server;
      server = null;
      tempServer.close(done);
    } else {
      done();
    }
  });

  return new Proxy({}, {
    get: (o, prop) => server[prop],
  });
};
