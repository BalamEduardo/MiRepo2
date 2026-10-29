package com.example.sensoresynavdrawer;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;

import java.util.Arrays;
import java.util.Locale;

public class MagnetometerActivity extends BaseDemoActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor magnetometer;
    private Sensor gravitySensor;
    private android.widget.TextView xValue;
    private android.widget.TextView yValue;
    private android.widget.TextView zValue;
    private android.widget.TextView headingValue;
    private float[] gravityValues;
    private float[] magneticValues;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupDemoScreen("Magnetómetro", "Lee el campo magnético en microteslas y calcula una orientación aproximada respecto al norte magnético.");
        xValue = addMetric("Campo X", "— μT");
        yValue = addMetric("Campo Y", "— μT");
        zValue = addMetric("Campo Z", "— μT");
        headingValue = addMetric("Rumbo magnético", "—°");

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        gravitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY);
        if (gravitySensor == null) {
            gravitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }

        if (magnetometer == null) {
            setStatus("Este dispositivo no tiene un magnetómetro disponible.");
        } else if (gravitySensor == null) {
            setStatus("Hay magnetómetro, pero no hay sensor de gravedad o acelerómetro para calcular el rumbo.");
        } else {
            setStatus("Sensor disponible: " + magnetometer.getName() + ". Aleja el dispositivo de imanes y objetos metálicos.");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (magnetometer != null) {
            sensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_UI);
        }
        if (gravitySensor != null) {
            sensorManager.registerListener(this, gravitySensor, SensorManager.SENSOR_DELAY_UI);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(this);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            magneticValues = Arrays.copyOf(event.values, 3);
            xValue.setText(String.format(Locale.getDefault(), "%.2f μT", event.values[0]));
            yValue.setText(String.format(Locale.getDefault(), "%.2f μT", event.values[1]));
            zValue.setText(String.format(Locale.getDefault(), "%.2f μT", event.values[2]));
        } else if (event.sensor.getType() == Sensor.TYPE_GRAVITY
                || event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            gravityValues = Arrays.copyOf(event.values, 3);
        }

        updateHeading();
    }

    private void updateHeading() {
        if (gravityValues == null || magneticValues == null) return;

        float[] rotationMatrix = new float[9];
        float[] inclinationMatrix = new float[9];
        float[] orientation = new float[3];
        boolean success = SensorManager.getRotationMatrix(
                rotationMatrix, inclinationMatrix, gravityValues, magneticValues);
        if (!success) {
            headingValue.setText("—°");
            return;
        }

        SensorManager.getOrientation(rotationMatrix, orientation);
        double degrees = Math.toDegrees(orientation[0]);
        degrees = (degrees + 360.0) % 360.0;
        headingValue.setText(String.format(Locale.getDefault(), "%.1f°", degrees));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD
                && accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            setStatus("Lectura magnética poco confiable. Aleja imanes y mueve el teléfono en forma de ocho para recalibrar.");
        }
    }
}