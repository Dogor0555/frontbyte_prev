"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Error de aplicación:", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
      padding: "2rem",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "1.5rem", color: "#dc2626", marginBottom: "1rem" }}>
        Algo salió mal
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: "400px" }}>
        Ha ocurrido un error inesperado. Por favor intenta de nuevo.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontSize: "1rem"
        }}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
