package com.example.sensoresynavdrawer;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;

import java.util.Locale;

public class GyroscopeActivity extends BaseDemoActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor gyroscope;
    private android.widget.TextView xValue;
    private android.widget.TextView yValue;
    private android.widget.TextView zValue;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupDemoScreen("Giroscopio", "Mide la velocidad angular alrededor de los ejes X, Y y Z. Gira el dispositivo para observar los cambios.");
        xValue = addMetric("Rotación X", "— rad/s");
        yValue = addMetric("Rotación Y", "— rad/s");
        zValue = addMetric("Rotación Z", "— rad/s");

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        if (gyroscope == null) {
            setStatus("Este dispositivo no tiene un giroscopio disponible.");
        } else {
            setStatus("Sensor disponible: " + gyroscope.getName() + ". Las lecturas se muestran en radianes por segundo.");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (gyroscope != null) {
            sensorManager.registerListener(this, gyroscope, SensorManager.SENSOR_DELAY_GAME);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(this);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        xValue.setText(String.format(Locale.getDefault(), "%.3f rad/s", event.values[0]));
        yValue.setText(String.format(Locale.getDefault(), "%.3f rad/s", event.values[1]));
        zValue.setText(String.format(Locale.getDefault(), "%.3f rad/s", event.values[2]));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            setStatus("La precisión del giroscopio es baja en este momento.");
        }
    }
}