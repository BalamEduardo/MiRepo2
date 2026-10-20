package com.example.layouts;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class FrameLayoutActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_frame_layout);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            int spacing = (int) (16 * getResources().getDisplayMetrics().density);
            view.setPadding(systemBars.left + spacing, systemBars.top + spacing,
                    systemBars.right + spacing, systemBars.bottom + spacing);
            return insets;
        });

        findViewById(R.id.btn_back).setOnClickListener(view -> finish());
    }
}
