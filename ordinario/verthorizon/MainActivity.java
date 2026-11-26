package com.example.verthorizon;

import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "CicloVida";
    private static final String CLAVE_DATO = "dato_escrito";
    private static final String CLAVE_RESULTADO = "resultado";

    private EditText editTextDato;
    private TextView textoResultado;
    private TextView textoEvento;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (vista, insets) -> {
            Insets barrasSistema = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            vista.setPadding(
                    barrasSistema.left,
                    barrasSistema.top,
                    barrasSistema.right,
                    barrasSistema.bottom
            );
            return insets;
        });

        editTextDato = findViewById(R.id.editTextDato);
        textoResultado = findViewById(R.id.textoResultado);
        textoEvento = findViewById(R.id.textoEvento);

        if (savedInstanceState != null) {
            editTextDato.setText(savedInstanceState.getString(CLAVE_DATO, ""));
            textoResultado.setText(savedInstanceState.getString(
                    CLAVE_RESULTADO,
                    getString(R.string.resultado_vacio)
            ));
        }

        findViewById(R.id.botonMostrar).setOnClickListener(v -> {
            String dato = editTextDato.getText().toString().trim();
            if (dato.isEmpty()) {
                textoResultado.setText(R.string.mensaje_vacio);
            } else {
                textoResultado.setText(getString(R.string.mensaje_resultado, dato));
            }
        });

        registrarEvento("onCreate()");
    }

    @Override
    protected void onPause() {
        super.onPause();
        registrarEvento("onPause()");
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        outState.putString(CLAVE_DATO, editTextDato.getText().toString());
        outState.putString(CLAVE_RESULTADO, textoResultado.getText().toString());
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        registrarEvento("onDestroy()");
        super.onDestroy();
    }

    private void registrarEvento(String nombreEvento) {
        Log.d(TAG, nombreEvento);
        textoEvento.setText(getString(R.string.ultimo_evento, nombreEvento));
        Toast.makeText(this, nombreEvento, Toast.LENGTH_SHORT).show();
    }
}