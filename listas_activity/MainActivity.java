package com.example.listas;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.Arrays;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            int spacing = (int) (16 * getResources().getDisplayMetrics().density);
            v.setPadding(systemBars.left + spacing, systemBars.top + spacing,
                    systemBars.right + spacing, systemBars.bottom + spacing);
            return insets;
        });

        RecyclerView recyclerView = findViewById(R.id.recycler_view);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(new ListaAdapter(crearElementos()));
    }

    private List<ElementoLista> crearElementos() {
        return Arrays.asList(
                new ElementoLista("LinearLayout", "Organiza las vistas en una fila o columna."),
                new ElementoLista("RelativeLayout", "Posiciona las vistas respecto al contenedor o a otras vistas."),
                new ElementoLista("FrameLayout", "Apila vistas en una misma área."),
                new ElementoLista("TableLayout", "Organiza las vistas en filas y columnas."),
                new ElementoLista("ConstraintLayout", "Ubica las vistas mediante restricciones."),
                new ElementoLista("RecyclerView", "Muestra listas reutilizando las vistas que salen de pantalla."),
                new ElementoLista("ViewHolder", "Conserva las referencias a las vistas de cada elemento."),
                new ElementoLista("Adapter", "Conecta los datos con las vistas de la lista."),
                new ElementoLista("LayoutManager", "Decide la posición de cada elemento."),
                new ElementoLista("LinearLayoutManager", "Muestra los elementos como una lista vertical."),
                new ElementoLista("GridLayoutManager", "Muestra los elementos en una cuadrícula."),
                new ElementoLista("StaggeredGridLayoutManager", "Organiza elementos en una cuadrícula escalonada.")
        );
    }
}
