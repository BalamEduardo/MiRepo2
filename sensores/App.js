import { StatusBar } from 'expo-status-bar';
import PedometerSensor from './components/PedometerSensor';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <PedometerSensor />
    </>
  );
}
