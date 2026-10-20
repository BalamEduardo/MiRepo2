package com.example.layouts;

import android.content.Intent;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            int spacing = (int) (24 * getResources().getDisplayMetrics().density);
            view.setPadding(
                    systemBars.left + spacing,
                    systemBars.top + spacing,
                    systemBars.right + spacing,
                    systemBars.bottom + spacing
            );
            return insets;
        });

        findViewById(R.id.btn_linear).setOnClickListener(view ->
                startActivity(new Intent(this, LinearLayoutActivity.class)));
        findViewById(R.id.btn_relative).setOnClickListener(view ->
                startActivity(new Intent(this, RelativeLayoutActivity.class)));
        findViewById(R.id.btn_frame).setOnClickListener(view ->
                startActivity(new Intent(this, FrameLayoutActivity.class)));
        findViewById(R.id.btn_table).setOnClickListener(view ->
                startActivity(new Intent(this, TableLayoutActivity.class)));
    }
}
