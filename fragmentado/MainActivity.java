    package com.example.myapplication;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

public class MainActivity extends AppCompatActivity {

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

        findViewById(R.id.btn_fragmento_uno).setOnClickListener(view ->
                mostrarFragmento(new FragmentoUno()));
        findViewById(R.id.btn_fragmento_dos).setOnClickListener(view ->
                mostrarFragmento(new FragmentoDos()));
        findViewById(R.id.btn_fragmento_tres).setOnClickListener(view ->
                mostrarFragmento(new FragmentoTres()));

        if (savedInstanceState == null) {
            mostrarFragmento(new FragmentoUno());
        }
    }

    private void mostrarFragmento(Fragment fragmento) {
        getSupportFragmentManager()
                .beginTransaction()
                .setReorderingAllowed(true)
                .replace(R.id.contenedor_fragmentos, fragmento)
                .commit();
    }
}