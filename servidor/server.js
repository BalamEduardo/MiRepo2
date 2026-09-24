require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { timingSafeEqual } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { MONGODB_URI, MONGODB_USERNAME, MONGODB_PASSWORD, JWT_SECRET } = process.env;
if (!MONGODB_URI || !JWT_SECRET) {
  throw new Error('Configura MONGODB_URI y JWT_SECRET en servidor/.env.');
}

const client = new MongoClient(MONGODB_URI);
const uriCredentials = client.options.credentials || {};
const mongoUsername = MONGODB_USERNAME || uriCredentials.username;
const mongoPassword = MONGODB_PASSWORD || uriCredentials.password;
if (
  !mongoUsername
  || !mongoPassword
  || (uriCredentials.username && mongoUsername !== uriCredentials.username)
  || (uriCredentials.password && mongoPassword !== uriCredentials.password)
) {
  throw new Error('Configura el usuario y la contraseña de MongoDB en servidor/.env.');
}

const app = express();
const port = process.env.PORT || 4000;
let db;

app.use(cors());
app.use(express.json({ limit: '16kb' }));

function secureStringEqual(left, right) {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function createSession() {
  const user = { name: mongoUsername, username: mongoUsername };
  return {
    token: jwt.sign({ sub: mongoUsername, scope: 'filmoteca' }, JWT_SECRET, { expiresIn: '12h' }),
    user,
  };
}

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

app.post('/auth/login', async (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return res.status(400).json({ message: 'Escribe el usuario y la contraseña de MongoDB.' });
  }

  const usernameMatches = secureStringEqual(username, mongoUsername);
  const passwordMatches = secureStringEqual(password, mongoPassword);
  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ message: 'Usuario o contraseña de MongoDB incorrectos.' });
  }

  return res.json(createSession());
});

function requireUser(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ message: 'Inicia sesión para ver la filmoteca.' });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Tu sesión venció. Inicia sesión de nuevo.' });
  }

  if (payload.sub !== mongoUsername || payload.scope !== 'filmoteca') {
    return res.status(401).json({ message: 'Tu sesión no es válida. Inicia sesión de nuevo.' });
  }

  return next();
}

app.get('/movies', requireUser, async (req, res) => {
  try {
    const movies = await db.collection('movies').find(
      {},
      { projection: { poster: 1, title: 1, year: 1, genres: 1, rated: 1, runtime: 1, imdb: 1 } }
    ).limit(50).toArray();
    return res.json(movies);
  } catch (error) {
    console.error('No se pudieron consultar las películas:', error.message);
    return res.status(500).json({ message: 'No se pudieron cargar las películas.' });
  }
});

app.get('/movies/:id', requireUser, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'El identificador de la película no es válido.' });
  }

  try {
    const movie = await db.collection('movies').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: {
        title: 1, poster: 1, year: 1, genres: 1, rated: 1, runtime: 1,
        plot: 1, fullplot: 1, cast: 1, directors: 1, writers: 1,
        languages: 1, countries: 1, awards: 1, imdb: 1, type: 1,
      } }
    );
    if (!movie) {
      return res.status(404).json({ message: 'No se encontró la película.' });
    }
    return res.json(movie);
  } catch (error) {
    console.error('No se pudo consultar la ficha de la película:', error.message);
    return res.status(500).json({ message: 'No se pudo cargar la ficha de la película.' });
  }
});

async function start() {
  await client.connect();
  db = client.db('sample_mflix');
  app.listen(port, () => {
    console.log(`Servidor en http://localhost:${port}`);
  });
}

start().catch(async (error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  await client.close();
  process.exit(1);
});
