"use client";
import React, { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../dashboard/components/Toast";

const tipoToLabel = {
  "consumidor-final": "Consumidor Final",
  "credito": "Crédito Fiscal",
  "exportacion": "Exportación",
  "sujeto-excluido": "Sujeto Excluido",
  "liquidacion": "Liquidación",
};

const DescargaMasiva = () => {
  const [loading, setLoading] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const descargarPDFMasivo = async (tipo) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        addToast("No estás autenticado", "error");
        return;
      }

      const params = new URLSearchParams();
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      const qs = params.toString() ? `?${params.toString()}` : "";

      setLoading(tipo);

      const response = await fetch(
        `${API_BASE_URL}/pdf-masivo/${tipo}${qs}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let mensaje = "Error al descargar";
        try {
          const error = await response.json();
          mensaje = error.mensaje || error.error || mensaje;
        } catch (_) {}
        console.error("Error backend:", mensaje);
        addToast(mensaje, "error");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facturas_${tipo}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      addToast(`Descarga de ${tipoToLabel[tipo] || tipo} iniciada`, "success");
    } catch (error) {
      console.error("Error:", error);
      addToast("Error en la descarga: " + (error?.message || "desconocido"), "error");
    } finally {
      setLoading(null);
    }
  };

  const tipos = [
    { key: "consumidor-final", label: "Consumidor Final" },
    { key: "credito", label: "Crédito Fiscal" },
    { key: "exportacion", label: "Exportación" },
    { key: "sujeto-excluido", label: "Sujeto Excluido" },
    { key: "liquidacion", label: "Liquidación" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Descarga Masiva de PDFs</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          Fecha inicio
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            style={{ padding: 6 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          Fecha fin
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            style={{ padding: 6 }}
          />
        </label>
        <button
          onClick={() => { setFechaInicio(""); setFechaFin(""); }}
          style={{ padding: "6px 12px", height: 32 }}
        >
          Limpiar
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
        {tipos.map((t) => (
          <button
            key={t.key}
            onClick={() => descargarPDFMasivo(t.key)}
            disabled={loading !== null}
            style={{ padding: "10px 12px" }}
          >
            {loading === t.key ? `Generando ${t.label}...` : t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DescargaMasiva;