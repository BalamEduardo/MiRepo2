package com.example.sensoresynavdrawer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Looper;
import android.provider.Settings;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import java.util.Locale;
import java.util.Map;

public class GpsActivity extends BaseDemoActivity {
    private LocationManager locationManager;
    private ActivityResultLauncher<String[]> permissionLauncher;
    private boolean trackingRequested;
    private boolean updatesRegistered;

    private android.widget.TextView latitudeValue;
    private android.widget.TextView longitudeValue;
    private android.widget.TextView accuracyValue;
    private android.widget.TextView altitudeValue;
    private android.widget.TextView speedValue;
    private android.widget.TextView bearingValue;

    private final LocationListener locationListener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            latitudeValue.setText(String.format(Locale.getDefault(), "%.6f°", location.getLatitude()));
            longitudeValue.setText(String.format(Locale.getDefault(), "%.6f°", location.getLongitude()));
            accuracyValue.setText(location.hasAccuracy()
                    ? String.format(Locale.getDefault(), "± %.1f m", location.getAccuracy()) : "No disponible");
            altitudeValue.setText(location.hasAltitude()
                    ? String.format(Locale.getDefault(), "%.1f m", location.getAltitude()) : "No disponible");
            speedValue.setText(location.hasSpeed()
                    ? String.format(Locale.getDefault(), "%.2f m/s", location.getSpeed()) : "No disponible");
            bearingValue.setText(location.hasBearing()
                    ? String.format(Locale.getDefault(), "%.1f°", location.getBearing()) : "No disponible");
            setStatus("Actualización GPS recibida. La precisión depende de la señal y el entorno.");
        }

        @Override
        public void onProviderEnabled(String provider) {
            setStatus("GPS activado. Esperando ubicación…");
            if (trackingRequested) startGpsUpdates();
        }

        @Override
        public void onProviderDisabled(String provider) {
            updatesRegistered = false;
            setStatus("El GPS está desactivado. Activa la ubicación para continuar.");
        }

        @Override
        @SuppressWarnings("deprecation")
        public void onStatusChanged(String provider, int status, Bundle extras) {
            // Compatibilidad con dispositivos anteriores a Android 10.
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        permissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestMultiplePermissions(), this::onPermissionResult);

        setupDemoScreen("GPS", "Solicita actualizaciones del proveedor GPS del dispositivo mientras esta actividad está visible.");
        latitudeValue = addMetric("Latitud", "—");
        longitudeValue = addMetric("Longitud", "—");
        accuracyValue = addMetric("Precisión", "—");
        altitudeValue = addMetric("Altitud", "—");
        speedValue = addMetric("Velocidad", "—");
        bearingValue = addMetric("Rumbo", "—");
        addActionButton("Iniciar GPS", view -> requestPermissionAndStart());
        addActionButton("Detener GPS", view -> stopTracking());
        addActionButton("Abrir ajustes de ubicación", view ->
                startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)));

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        setStatus("Pulsa «Iniciar GPS» y concede permiso de ubicación para ver las lecturas.");
    }

    private void onPermissionResult(Map<String, Boolean> result) {
        if (hasLocationPermission()) {
            startGpsUpdates();
        } else {
            trackingRequested = false;
            setStatus("Sin permiso de ubicación no se pueden mostrar coordenadas.");
        }
    }

    private void requestPermissionAndStart() {
        trackingRequested = true;
        if (!hasLocationPermission()) {
            permissionLauncher.launch(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            });
            return;
        }
        startGpsUpdates();
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void startGpsUpdates() {
        if (!trackingRequested || !hasLocationPermission() || updatesRegistered) return;

        if (locationManager == null || locationManager.getProvider(LocationManager.GPS_PROVIDER) == null) {
            setStatus("Este dispositivo no expone un proveedor GPS.");
            return;
        }

        try {
            if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                setStatus("El GPS está desactivado. Pulsa «Abrir ajustes de ubicación».");
                return;
            }

            setStatus("GPS activo. Esperando señal; en interiores puede tardar más.");
            locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    2000L,
                    1f,
                    locationListener,
                    Looper.getMainLooper());
            updatesRegistered = true;
        } catch (SecurityException exception) {
            updatesRegistered = false;
            setStatus("Android no concedió permiso para acceder a la ubicación.");
        }
    }

    private void stopTracking() {
        trackingRequested = false;
        removeLocationUpdates();
        setStatus("Seguimiento detenido.");
    }

    private void removeLocationUpdates() {
        if (locationManager != null && updatesRegistered) {
            locationManager.removeUpdates(locationListener);
        }
        updatesRegistered = false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (trackingRequested) startGpsUpdates();
    }

    @Override
    protected void onPause() {
        super.onPause();
        removeLocationUpdates();
    }
}