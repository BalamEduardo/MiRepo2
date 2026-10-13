package com.example.demointent;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    public static final String EXTRA_TITULO = "com.example.demointent.EXTRA_TITULO";
    public static final String EXTRA_NUMERO = "com.example.demointent.EXTRA_NUMERO";



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        Button actividadUno = findViewById(R.id.buttonActividadUno);
        Button actividadDos = findViewById(R.id.buttonActividadDos);
        Button actividadTres = findViewById(R.id.buttonActividadTres);

        actividadUno.setOnClickListener(view -> abrirActividad(
                ActividadUnoActivity.class, getString(R.string.actividad_uno), 1));
        actividadDos.setOnClickListener(view -> abrirActividad(
                ActividadDosActivity.class, getString(R.string.actividad_dos), 2));
        actividadTres.setOnClickListener(view -> abrirActividad(
                ActividadTresActivity.class, getString(R.string.actividad_tres), 3));
    }

    private void abrirActividad(Class<?> actividad, String titulo, int numero) {
        Intent intent = new Intent(this, actividad);
        intent.putExtra(EXTRA_TITULO, titulo);
        intent.putExtra(EXTRA_NUMERO, numero);
        intent.putExtra("mensaje", "Mensaje en cadena sin el static");
        startActivity(intent);
    }
}