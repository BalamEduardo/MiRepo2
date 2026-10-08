package com.example.calculadora_sumas;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        EditText firstNumber = findViewById(R.id.firstNumber);
        EditText secondNumber = findViewById(R.id.secondNumber);
        Button addButton = findViewById(R.id.addButton);
        TextView result = findViewById(R.id.result);

        addButton.setOnClickListener(view -> {
            try {
                int first = Integer.parseInt(firstNumber.getText().toString());
                int second = Integer.parseInt(secondNumber.getText().toString());
                int sum = first + second;

                result.setText("Resultado: " + sum);
            } catch (NumberFormatException exception) {
                result.setText("Escribe dos números válidos");
            }
        });
    }
}
