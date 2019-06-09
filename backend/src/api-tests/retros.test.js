import request from 'superwstest';
import testConfig from './testConfig';
import testServerRunner from './testServerRunner';
import appFactory from '../app';

function getUserToken({ userAuthService }, userId) {
  return userAuthService.grantToken({
    aud: 'user',
    provider: 'test',
    sub: userId,
  });
}

describe('API retros', () => {
  let hooks;

  const server = testServerRunner(async () => {
    const app = await appFactory(testConfig());

    hooks = app.testHooks;

    await hooks.retroService.createRetro(
      'nobody',
      'my-retro',
      'My Retro',
      'mood',
    );

    await hooks.retroService.createRetro(
      'me',
      'my-second-retro',
      'My Second Retro',
      'mood',
    );

    await hooks.retroService.createRetro(
      'nobody',
      'unknown-retro',
      'An Unknown Retro Format',
      'nope',
    );

    return app.createServer();
  });

  describe('/api/retros', () => {
    it('responds with retros for the user in JSON format', async () => {
      const userToken = await getUserToken(hooks, 'me');

      const response = await request(server)
        .get('/api/retros')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body.retros.length).toEqual(1);
      expect(response.body.retros[0].slug).toEqual('my-second-retro');
    });

    it('responds HTTP Unauthorized if no credentials are given', async () => {
      await request(server)
        .get('/api/retros')
        .expect(401);
    });

    it('responds HTTP Unauthorized if credentials are incorrect', async () => {
      await request(server)
        .get('/api/retros')
        .set('Authorization', 'Bearer Foo')
        .expect(401);
    });
  });

  describe('POST /api/retros', () => {
    it('creates a new retro', async () => {
      const slug = 'new-retro';
      const userToken = await getUserToken(hooks, 'me');

      const response = await request(server)
        .post('/api/retros')
        .send({ slug, name: 'Meh', password: 'password' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const returnedId = response.body.id;
      const storedId = await hooks.retroService.getRetroIdForSlug(slug);

      expect(returnedId).toEqual(storedId);
    });

    it('responds HTTP Bad Request if data is missing', async () => {
      const userToken = await getUserToken(hooks, 'me');

      const response = await request(server)
        .post('/api/retros')
        .send({ slug: 'new-retro', name: 'Meh' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.error).toEqual('No password given');
    });

    it('responds HTTP Conflict if slug is unavailable', async () => {
      const userToken = await getUserToken(hooks, 'me');

      const response = await request(server)
        .post('/api/retros')
        .send({ slug: 'my-retro', name: 'Meh', password: 'password' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(409);

      expect(response.body.error).toEqual('URL is already taken');
    });

    it('responds HTTP Unauthorized if no credentials are given', async () => {
      await request(server)
        .post('/api/retros')
        .expect(401);
    });

    it('responds HTTP Unauthorized if credentials are incorrect', async () => {
      await request(server)
        .post('/api/retros')
        .set('Authorization', 'Bearer Foo')
        .expect(401);
    });
  });
});
