import { useEffect, useState } from 'react';
import { Gyroscope } from 'expo-sensors';
import { StyleSheet, Text, View } from 'react-native';

const AREA_WIDTH = 300;
const AREA_HEIGHT = 300;
const BALL_SIZE = 50;
const SENSITIVITY = 15;

const limitar = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(value, maximum));

export default function GyroscopeBall() {
  const [position, setPosition] = useState({
    x: (AREA_WIDTH - BALL_SIZE) / 2,
    y: (AREA_HEIGHT - BALL_SIZE) / 2,
  });

  useEffect(() => {
    Gyroscope.setUpdateInterval(100);

    const subscription = Gyroscope.addListener(({ x, y }) => {
      setPosition((currentPosition) => ({
        x: limitar(
          currentPosition.x + y * SENSITIVITY,
          0,
          AREA_WIDTH - BALL_SIZE
        ),
        y: limitar(
          currentPosition.y + x * SENSITIVITY,
          0,
          AREA_HEIGHT - BALL_SIZE
        ),
      }));
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pelota con giroscopio</Text>
      <View style={styles.area}>
        <View style={[styles.ball, { left: position.x, top: position.y }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#3a4a5a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  area: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderRadius: 12,
    borderWidth: 2,
    height: AREA_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    width: AREA_WIDTH,
  },
  ball: {
    backgroundColor: '#ef4444',
    borderColor: '#991b1b',
    borderRadius: BALL_SIZE / 2,
    borderWidth: 3,
    height: BALL_SIZE,
    position: 'absolute',
    width: BALL_SIZE,
  },
});
