import React from "react";

const DescargaMasiva = () => {

  const descargarPDFMasivo = async (tipo) => {
    try {
      const token = localStorage.getItem("token");

      console.log("TOKEN:", token);

      if (!token) {
        alert("No estás autenticado");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/pdf-masivo/${tipo}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Error backend:", error);
        alert(error.mensaje || "Error al descargar");
        return;
      }

      // 📦 convertir a blob (ZIP)
      const blob = await response.blob();

      // 📥 descargar automáticamente
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tipo}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (error) {
      console.error("Error:", error);
      alert("Error en la descarga");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Descarga Masiva de PDFs</h2>

      <button onClick={() => descargarPDFMasivo("consumidor-final")}>
        Consumidor Final
      </button>

      <br /><br />

      <button onClick={() => descargarPDFMasivo("credito")}>
        Crédito
      </button>

      <br /><br />

      <button onClick={() => descargarPDFMasivo("exportacion")}>
        Exportación
      </button>

      <br /><br />

      <button onClick={() => descargarPDFMasivo("sujeto-excluido")}>
        Sujeto Excluido
      </button>

      <br /><br />

      <button onClick={() => descargarPDFMasivo("liquidacion")}>
        Liquidación
      </button>
    </div>
  );
};

export default DescargaMasiva;