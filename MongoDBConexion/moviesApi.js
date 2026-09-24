function getApiBase(hostUri, configuredUrl, platform) {
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (!hostUri) {
    throw new Error('No se encontró la dirección del servidor Expo. Configura EXPO_PUBLIC_API_URL con la URL del servidor.');
  }

  const expoUrl = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);
  const localHost = expoUrl.hostname === 'localhost' || expoUrl.hostname === '127.0.0.1';
  const hostname = localHost && platform === 'android' ? '10.0.2.2' : expoUrl.hostname;
  return `http://${hostname}:4000`;
}

function getMoviesUrl(hostUri, configuredUrl, platform) {
  return `${getApiBase(hostUri, configuredUrl, platform)}/movies`;
}

async function requestJson(url, options = {}, request = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await request(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...options.headers,
      },
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('La respuesta del servidor no tiene un formato válido.');
    }
    if (!response.ok) {
      throw new Error(data.message || `El servidor respondió ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadMovies(url, tokenOrRequest, maybeRequest = fetch) {
  const token = typeof tokenOrRequest === 'string' ? tokenOrRequest : null;
  const request = typeof tokenOrRequest === 'function' ? tokenOrRequest : maybeRequest;
  const options = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const movies = await requestJson(url, options, request);
  if (!Array.isArray(movies)) {
    throw new Error('La respuesta del servidor no es una lista de películas');
  }
  return movies;
}

function loadMovie(movieId, apiBase, tokenOrRequest, maybeRequest = fetch) {
  const token = typeof tokenOrRequest === 'string' ? tokenOrRequest : null;
  const request = typeof tokenOrRequest === 'function' ? tokenOrRequest : maybeRequest;
  const options = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return requestJson(`${apiBase}/movies/${encodeURIComponent(movieId)}`, options, request);
}

function authenticate(credentials, apiBase, request = fetch) {
  return requestJson(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }, request);
}

module.exports = { authenticate, getApiBase, getMoviesUrl, loadMovie, loadMovies };
