package com.example.myfirstandroidapp;

import android.app.Activity;
import android.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.widget.EditText;
import android.widget.TextView;

public final class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            View content = findViewById(R.id.screen);
            content.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets padding = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(padding.left, padding.top, padding.right, padding.bottom);
                return WindowInsets.CONSUMED;
            });
            content.requestApplyInsets();
        }

        EditText entrada = findViewById(R.id.entrada);
        TextView resultado = findViewById(R.id.resultado);
        findViewById(R.id.mostrar).setOnClickListener(view -> {
            String texto = entrada.getText().toString().trim();
            if (texto.isEmpty()) {
                entrada.requestFocus();
                entrada.setError(getString(R.string.texto_requerido));
                return;
            }

            entrada.setError(null);
            resultado.setText(texto);
        });
    }
}
