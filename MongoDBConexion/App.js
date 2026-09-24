import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AuthModal from './components/AuthModal';
import MovieDetailsModal from './components/MovieDetailsModal';
import { getApiBase, loadMovies } from './moviesApi';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [session, setSession] = useState(null);
  const { width } = useWindowDimensions();
  const tileWidth = (width - 52) / 2;
  const host = Platform.OS === 'web' ? window.location.hostname : Constants.expoConfig?.hostUri;
  const apiBase = useMemo(
    () => getApiBase(host, process.env.EXPO_PUBLIC_API_URL, Platform.OS),
    [host]
  );

  const refresh = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    setError('');
    try {
      setMovies(await loadMovies(`${apiBase}/movies`, session.token));
    } catch (cause) {
      setError(cause.message || 'No se pudieron cargar las películas.');
    } finally {
      setLoading(false);
    }
  }, [apiBase, session?.token]);

  useEffect(() => {
    if (!session?.token) return undefined;
    let active = true;
    Promise.resolve()
      .then(() => loadMovies(`${apiBase}/movies`, session.token))
      .then((data) => { if (active) setMovies(data); })
      .catch((cause) => { if (active) setError(cause.message || 'No se pudieron cargar las películas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apiBase, session?.token]);

  const handleLogout = () => {
    setSession(null);
    setSelectedMovie(null);
    setMovies([]);
    setError('');
    setLoading(true);
  };

  const renderMovie = ({ item }) => (
    <MovieTile movie={item} width={tileWidth} onPress={() => setSelectedMovie(item)} />
  );

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#11110F" />
      {session ? (loading && movies.length === 0 ? (
        <View style={styles.loadingScreen}>
          <Text style={styles.wordmark}>CINE <Text style={styles.accent}>/</Text> ARCHIVO</Text>
          <ActivityIndicator color="#E8AC56" size="large" />
          <Text style={styles.muted}>Abriendo la filmoteca…</Text>
        </View>
      ) : error && movies.length === 0 ? (
        <View style={styles.errorScreen}>
          <Text style={styles.wordmark}>CINE <Text style={styles.accent}>/</Text> ARCHIVO</Text>
          <Text style={styles.errorTitle}>No se pudo abrir el catálogo</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable onPress={refresh} style={styles.retryButton} accessibilityRole="button">
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovie}
          keyExtractor={(movie) => String(movie._id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.catalogContent}
          ListHeaderComponent={(
            <View style={styles.header}>
              <View style={styles.topbar}>
                <Text style={styles.wordmark}>CINE <Text style={styles.accent}>/</Text> ARCHIVO</Text>
                <Pressable onPress={handleLogout} style={styles.accountButton} accessibilityRole="button">
                  <Text style={styles.accountText}>{session.user.name} · Salir</Text>
                </Pressable>
              </View>
              <Text style={styles.heading}>Explora las películas</Text>
              <Text style={styles.subheading}>Una filmoteca para volver a mirar.</Text>
              <View style={styles.collectionLine}>
                <Text style={styles.collectionLabel}>SELECCIÓN</Text>
                <Text style={styles.collectionCount}>{movies.length} títulos</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no hay películas disponibles.</Text>}
          ListFooterComponent={loading ? <ActivityIndicator color="#E8AC56" style={styles.refreshing} /> : null}
          onRefresh={refresh}
          refreshing={loading && movies.length > 0}
        />
      )) : null}

      <MovieDetailsModal
        movie={session ? selectedMovie : null}
        apiBase={apiBase}
        token={session?.token}
        onClose={() => setSelectedMovie(null)}
      />
      <AuthModal
        visible={!session}
        apiBase={apiBase}
        onAuthenticated={setSession}
      />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

function MovieTile({ movie, width, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);
  const genres = Array.isArray(movie.genres) ? movie.genres.slice(0, 2).join(' · ') : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.tilePressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ver información de ${movie.title}`}
    >
      <View style={[styles.posterFrame, { height: width * 1.43 }]}>
        {movie.poster && !imageFailed ? (
          <Image
            source={{ uri: movie.poster }}
            style={styles.poster}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.posterFallback}>
            <Text style={styles.fallbackMark}>C / A</Text>
            <Text style={styles.fallbackTitle} numberOfLines={3}>{movie.title}</Text>
          </View>
        )}
      </View>
      <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
      <Text style={styles.movieMeta} numberOfLines={1}>
        {[movie.year, genres].filter(Boolean).join('  ·  ') || 'Ficha disponible'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#11110F' },
  catalogContent: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { paddingTop: 24, paddingBottom: 22 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 39 },
  wordmark: { color: '#F2EFE7', fontSize: 13, fontWeight: '800', letterSpacing: 1.6 },
  accent: { color: '#E8AC56' },
  accountButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: '#555044', borderRadius: 22 },
  accountText: { color: '#E8AC56', fontSize: 12, fontWeight: '700' },
  heading: { color: '#F2EFE7', fontSize: 31, fontWeight: '800', letterSpacing: -0.6 },
  subheading: { color: '#AAA69C', fontSize: 15, marginTop: 8 },
  collectionLine: { marginTop: 25, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#373630', flexDirection: 'row', justifyContent: 'space-between' },
  collectionLabel: { color: '#E8AC56', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  collectionCount: { color: '#AAA69C', fontSize: 12 },
  gridRow: { justifyContent: 'space-between', marginBottom: 23 },
  tile: { paddingBottom: 5 },
  tilePressed: { opacity: 0.78 },
  posterFrame: { width: '100%', overflow: 'hidden', backgroundColor: '#25241F' },
  poster: { width: '100%', height: '100%' },
  posterFallback: { flex: 1, padding: 15, justifyContent: 'flex-end', backgroundColor: '#29271F' },
  fallbackMark: { color: '#E8AC56', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  fallbackTitle: { color: '#F2EFE7', fontSize: 18, fontWeight: '700' },
  movieTitle: { color: '#F2EFE7', fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: 10 },
  movieMeta: { color: '#AAA69C', fontSize: 12, marginTop: 4 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  muted: { color: '#AAA69C', fontSize: 14 },
  errorScreen: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { color: '#F2EFE7', fontSize: 22, fontWeight: '700', marginTop: 34, textAlign: 'center' },
  errorMessage: { color: '#AAA69C', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  retryButton: { marginTop: 23, borderRadius: 10, backgroundColor: '#E8AC56', paddingHorizontal: 22, paddingVertical: 13 },
  retryText: { color: '#171714', fontSize: 14, fontWeight: '800' },
  empty: { color: '#AAA69C', fontSize: 14, paddingVertical: 30, textAlign: 'center' },
  refreshing: { paddingVertical: 16 },
});
