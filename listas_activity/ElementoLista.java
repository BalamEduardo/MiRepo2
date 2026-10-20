package com.example.listas;

public class ElementoLista {
    private final String titulo;
    private final String descripcion;

    public ElementoLista(String titulo, String descripcion) {
        this.titulo = titulo;
        this.descripcion = descripcion;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
