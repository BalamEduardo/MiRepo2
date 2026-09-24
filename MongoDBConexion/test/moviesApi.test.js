const test = require('node:test');
const assert = require('node:assert/strict');
const { getMoviesUrl, loadMovies } = require('../moviesApi');

test('uses the Expo LAN host so a physical device can reach the API', () => {
  assert.equal(getMoviesUrl('10.200.29.52:8081'), 'http://10.200.29.52:4000/movies');
});

test('allows an explicit API address for tunnel or hosted setups', () => {
  assert.equal(getMoviesUrl('example.exp.direct:80', 'https://api.example.com/'), 'https://api.example.com/movies');
});

test('uses the Android emulator host when Expo runs on localhost', () => {
  assert.equal(getMoviesUrl('localhost:8081', undefined, 'android'), 'http://10.0.2.2:4000/movies');
  assert.equal(getMoviesUrl('localhost:8081', undefined, 'web'), 'http://localhost:4000/movies');
});

test('reports a missing host instead of requesting localhost on a phone', () => {
  assert.throws(() => getMoviesUrl(undefined), /EXPO_PUBLIC_API_URL/);
});

test('reports HTTP failures instead of treating them as an empty list', async () => {
  await assert.rejects(
    loadMovies('http://example.test/movies', async () => ({ ok: false, status: 500 })),
    /500/
  );
});

test('returns movie data from a successful response', async () => {
  const movies = [{ _id: '1', title: 'Movie' }];
  assert.deepEqual(await loadMovies('http://example.test/movies', async () => ({
    ok: true,
    json: async () => movies,
  })), movies);
});
