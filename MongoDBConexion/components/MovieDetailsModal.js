import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { loadMovie } from '../moviesApi';

export default function MovieDetailsModal({ movie, apiBase, token, onClose }) {
  const [loadedDetail, setLoadedDetail] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [failedPosterId, setFailedPosterId] = useState(null);
  const [retry, setRetry] = useState(0);
  const movieId = movie?._id ? String(movie._id) : null;
  const detail = loadedDetail?.id === movieId ? loadedDetail.value : movie;
  const error = loadError?.id === movieId && loadError?.retry === retry ? loadError.message : null;
  const loading = Boolean(movieId && loadedDetail?.id !== movieId && !error);

  useEffect(() => {
    if (!movieId) return undefined;
    let active = true;
    Promise.resolve()
      .then(() => loadMovie(movieId, apiBase, token))
      .then((value) => {
        if (active) setLoadedDetail({ id: movieId, value });
      })
      .catch((cause) => {
        if (active) setLoadError({ id: movieId, retry, message: cause.message });
      });
    return () => { active = false; };
  }, [movieId, apiBase, retry, token]);

  const fields = [
    ['Clasificación', detail?.rated],
    ['Duración', detail?.runtime ? `${detail.runtime} min` : null],
    ['Dirección', join(detail?.directors)],
    ['Guion', join(detail?.writers)],
    ['Reparto', join(detail?.cast)],
    ['Países', join(detail?.countries)],
    ['Idiomas', join(detail?.languages)],
  ].filter(([, value]) => value);

  const awards = detail?.awards?.text
    || formatAwards(detail?.awards);
  const imdb = detail?.imdb?.rating ? `${detail.imdb.rating} / 10` : null;

  return (
    <Modal
      visible={Boolean(movie)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {detail?.poster && failedPosterId !== movieId ? (
            <Image
              source={{ uri: detail.poster }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setFailedPosterId(movieId)}
            />
          ) : (
            <View style={styles.noPoster}>
              <Text style={styles.noPosterText}>CINE / ARCHIVO</Text>
              <Text style={styles.noPosterTitle}>{detail?.title}</Text>
            </View>
          )}
          <View style={styles.heroShade} />
          <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar ficha">
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>FICHA DE PELÍCULA</Text>
            <Text style={styles.title}>{detail?.title || 'Película'}</Text>
            <Text style={styles.subtitle}>
              {[detail?.year, join(detail?.genres)].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.ratings}>
            {imdb ? <Rating label="IMDb" value={imdb} /> : null}
            {detail?.runtime ? <Rating label="DURACIÓN" value={`${detail.runtime} min`} /> : null}
            {detail?.rated ? <Rating label="CLASIFICACIÓN" value={detail.rated} /> : null}
          </View>

          <Section title="Sinopsis">
            <Text style={styles.plot}>{detail?.fullplot || detail?.plot || 'No hay sinopsis disponible.'}</Text>
          </Section>

          {fields.length > 0 && (
            <Section title="Ficha técnica">
              {fields.map(([label, value]) => (
                <View style={styles.fact} key={label}>
                  <Text style={styles.factLabel}>{label}</Text>
                  <Text style={styles.factValue}>{value}</Text>
                </View>
              ))}
            </Section>
          )}

          {awards ? (
            <Section title="Reconocimientos">
              <Text style={styles.plot}>{awards}</Text>
            </Section>
          ) : null}

          {loading && !error ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#E8AC56" size="small" />
              <Text style={styles.loadingText}>Cargando la ficha completa…</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.loadError}>
              <Text style={styles.loadErrorText}>No se pudieron cargar todos los datos.</Text>
              <Pressable onPress={() => setRetry((value) => value + 1)} accessibilityRole="button">
                <Text style={styles.retry}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Rating({ label, value }) {
  return (
    <View style={styles.rating}>
      <Text style={styles.ratingValue}>{value}</Text>
      <Text style={styles.ratingLabel}>{label}</Text>
    </View>
  );
}

function join(value) {
  return Array.isArray(value) ? value.join(' · ') : value || '';
}

function formatAwards(awards) {
  if (!awards) return '';
  return [awards.wins && `${awards.wins} premios`, awards.nominations && `${awards.nominations} nominaciones`]
    .filter(Boolean)
    .join(' · ');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#11110F' },
  scroll: { flex: 1, backgroundColor: '#11110F' },
  content: { paddingBottom: 40 },
  hero: { height: 410, justifyContent: 'flex-end', backgroundColor: '#23221E' },
  heroImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  noPoster: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27251F' },
  noPosterText: { color: '#E8AC56', fontSize: 13, letterSpacing: 2, fontWeight: '700' },
  noPosterTitle: { color: '#F2EFE7', fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center', paddingHorizontal: 24 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 8, 7, 0.46)' },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 22,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 17, 15, 0.84)',
  },
  closeText: { color: '#F2EFE7', fontSize: 13, fontWeight: '700' },
  heroCopy: { paddingHorizontal: 24, paddingBottom: 26 },
  eyebrow: { color: '#E8AC56', fontSize: 11, letterSpacing: 1.8, fontWeight: '800', marginBottom: 10 },
  title: { color: '#F2EFE7', fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#D0CBC0', fontSize: 14, marginTop: 10, lineHeight: 20 },
  body: { paddingHorizontal: 24 },
  ratings: { flexDirection: 'row', gap: 28, paddingVertical: 23, borderBottomWidth: 1, borderBottomColor: '#383731' },
  rating: { gap: 4 },
  ratingValue: { color: '#F2EFE7', fontSize: 15, fontWeight: '700' },
  ratingLabel: { color: '#A8A397', fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  section: { paddingTop: 24, paddingBottom: 21, borderBottomWidth: 1, borderBottomColor: '#383731' },
  sectionTitle: { color: '#F2EFE7', fontSize: 19, fontWeight: '700', marginBottom: 13 },
  plot: { color: '#C9C5BB', fontSize: 15, lineHeight: 24 },
  fact: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  factLabel: { width: 96, color: '#A8A397', fontSize: 13, lineHeight: 19 },
  factValue: { flex: 1, color: '#E5E1D8', fontSize: 14, lineHeight: 21 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 18 },
  loadingText: { color: '#A8A397', fontSize: 13 },
  loadError: { paddingTop: 18, gap: 8 },
  loadErrorText: { color: '#F1A596', fontSize: 14 },
  retry: { color: '#E8AC56', fontSize: 14, fontWeight: '700', paddingVertical: 8, alignSelf: 'flex-start' },
});
