package com.example.sensoresynavdrawer;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;

import java.util.Locale;

public class AccelerometerActivity extends BaseDemoActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private android.widget.TextView xValue;
    private android.widget.TextView yValue;
    private android.widget.TextView zValue;
    private android.widget.TextView magnitudeValue;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupDemoScreen("Acelerómetro", "Mide la aceleración del dispositivo en sus tres ejes. En reposo también se observa la gravedad.");
        xValue = addMetric("Eje X", "— m/s²");
        yValue = addMetric("Eje Y", "— m/s²");
        zValue = addMetric("Eje Z", "— m/s²");
        magnitudeValue = addMetric("Magnitud", "— m/s²");

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (accelerometer == null) {
            setStatus("Este dispositivo no tiene un acelerómetro disponible.");
        } else {
            setStatus("Sensor disponible: " + accelerometer.getName() + ". Mueve o inclina el dispositivo.");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(this);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];
        xValue.setText(String.format(Locale.getDefault(), "%.3f m/s²", x));
        yValue.setText(String.format(Locale.getDefault(), "%.3f m/s²", y));
        zValue.setText(String.format(Locale.getDefault(), "%.3f m/s²", z));
        magnitudeValue.setText(String.format(Locale.getDefault(), "%.3f m/s²",
                Math.sqrt(x * x + y * y + z * z)));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            setStatus("Lectura poco confiable. Verifica que el dispositivo no esté cerca de interferencias.");
        }
    }
}