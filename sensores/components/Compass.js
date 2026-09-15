import { useEffect, useState } from 'react';
import { Magnetometer } from 'expo-sensors';
import { StyleSheet, Text, View } from 'react-native';

const COMPASS_SIZE = 300;

const obtenerRumbo = (x, y) => {
  const grados = Math.atan2(y, x) * (180 / Math.PI);
  return (grados + 360) % 360;
};

const obtenerDireccion = (grados) => {
  const direcciones = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return direcciones[Math.round(grados / 45) % direcciones.length];
};

export default function Compass() {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);

    const subscription = Magnetometer.addListener(({ x, y }) => {
      setHeading(obtenerRumbo(x, y));
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brújula</Text>

      <View style={styles.compass}>
        <Text style={[styles.cardinal, styles.north]}>N</Text>
        <Text style={[styles.cardinal, styles.east]}>E</Text>
        <Text style={[styles.cardinal, styles.south]}>S</Text>
        <Text style={[styles.cardinal, styles.west]}>O</Text>

        <View
          style={[
            styles.needle,
            { transform: [{ rotate: `${-heading}deg` }] },
          ]}
        >
          <View style={styles.northNeedle} />
          <View style={styles.southNeedle} />
          <View style={styles.point} />
        </View>

        <View style={styles.center} />
      </View>

      <Text style={styles.direction}>{obtenerDireccion(heading)}</Text>
      <Text style={styles.degrees}>{Math.round(heading)}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#efefef',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#3a4a5a',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  compass: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#334155',
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 4,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    position: 'relative',
    width: COMPASS_SIZE,
  },
  cardinal: {
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
    zIndex: 2,
  },
  north: {
    color: '#dc2626',
    left: 0,
    right: 0,
    textAlign: 'center',
    top: 12,
  },
  east: {
    right: 18,
    top: 132,
  },
  south: {
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  west: {
    left: 18,
    top: 132,
  },
  needle: {
    alignItems: 'center',
    height: 210,
    justifyContent: 'center',
    position: 'absolute',
    width: 24,
  },
  northNeedle: {
    backgroundColor: '#dc2626',
    height: 85,
    width: 6,
  },
  southNeedle: {
    backgroundColor: '#94a3b8',
    height: 85,
    width: 6,
  },
  point: {
    borderBottomColor: '#dc2626',
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderLeftWidth: 10,
    borderRightColor: 'transparent',
    borderRightWidth: 10,
    borderStyle: 'solid',
    height: 0,
    position: 'absolute',
    top: 0,
    width: 0,
  },
  center: {
    backgroundColor: '#334155',
    borderColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    position: 'absolute',
    width: 20,
    zIndex: 3,
  },
  direction: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 22,
  },
  degrees: {
    color: '#64748b',
    fontSize: 20,
    marginTop: 4,
  },
});
