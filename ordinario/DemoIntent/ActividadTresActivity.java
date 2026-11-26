package com.example.demointent;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class ActividadTresActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_detalle);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        String titulo = getIntent().getStringExtra(MainActivity.EXTRA_TITULO);
        int numero = getIntent().getIntExtra(MainActivity.EXTRA_NUMERO, 0);

        TextView textoTitulo = findViewById(R.id.textTituloActividad);
        TextView textoNumero = findViewById(R.id.textNumeroRecibido);
        textoTitulo.setText(titulo != null ? titulo : getString(R.string.actividad_sin_nombre));
        textoNumero.setText(getString(R.string.numero_recibido, numero));

        findViewById(R.id.buttonVolver).setOnClickListener(view -> finish());
    }
}