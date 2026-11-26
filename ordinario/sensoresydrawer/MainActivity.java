package com.example.sensoresynavdrawer;

import android.content.Intent;
import android.os.Bundle;
import android.os.SystemClock;

import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BaseDemoActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        long splashStartedAt = SystemClock.uptimeMillis();
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() ->
                SystemClock.uptimeMillis() - splashStartedAt < 1000L);
        super.onCreate(savedInstanceState);
        setupHomeScreen("Sensores Android", "Elige una actividad para explorar sus lecturas en tiempo real.");

        addActionButton("Demo de acelerómetro", view -> open(AccelerometerActivity.class));
        addActionButton("Demo de giroscopio", view -> open(GyroscopeActivity.class));
        addActionButton("Demo de magnetómetro", view -> open(MagnetometerActivity.class));
        addActionButton("Demo de GPS", view -> open(GpsActivity.class));
    }

    private void open(Class<?> activityClass) {
        startActivity(new Intent(this, activityClass));
    }
}