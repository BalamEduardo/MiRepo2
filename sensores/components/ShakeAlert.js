import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.5;
const SHAKE_COOLDOWN = 1000;

export default function ShakeAlert() {
  const previousMeasurement = useRef(null);
  const lastShakeAt = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((measurement) => {
      if (!previousMeasurement.current) {
        previousMeasurement.current = measurement;
        return;
      }

      const delta =
        Math.abs(measurement.x - previousMeasurement.current.x) +
        Math.abs(measurement.y - previousMeasurement.current.y) +
        Math.abs(measurement.z - previousMeasurement.current.z);

      const now = Date.now();
      if (delta > SHAKE_THRESHOLD && now - lastShakeAt.current > SHAKE_COOLDOWN) {
        lastShakeAt.current = now;
        Alert.alert('Sacudida detectada', '¡Agitaste el teléfono!');
      }

      previousMeasurement.current = measurement;
    });

    return () => subscription.remove();
  }, []);

  return null;
}
