"use client";
import { useEffect, useState } from "react";
import { FaTimes, FaEnvelope, FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parsearCorreos = (texto) =>
  (texto || "")
    .split(/[,;\n]+/)
    .map((correo) => correo.trim())
    .filter((correo) => correo.length > 0);

export default function ReenviarCorreoModal({ credito, onClose }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [destinos, setDestinos] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const cargarInfo = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/email/buscar-dte/${encodeURIComponent(credito.ncontrol)}`,
          { credentials: "include" }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Error ${response.status}`);

        setInfo(data);
        const guardados = data.cliente?.correosValidos?.length
          ? data.cliente.correosValidos
          : data.correo_seleccionado
            ? [data.correo_seleccionado]
            : [];
        setDestinos(guardados.join(", "));
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };

    cargarInfo();
  }, [credito.ncontrol]);

  const correos = parsearCorreos(destinos);
  const invalidos = correos.filter((correo) => !EMAIL_REGEX.test(correo));
  const puedeEnviar = !enviando && !cargando && correos.length > 0 && invalidos.length === 0;

  const handleEnviar = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch(`${API_BASE_URL}/email/enviar-dte-correo`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroControl: credito.ncontrol,
          correosDestino: correos,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok && !data.resultados) {
        throw new Error(data.detalles || data.error || `Error ${response.status}`);
      }

      const exitosos = (data.resultados || []).filter((r) => r.success).length;
      const total = (data.resultados || []).length;

      setResultado({
        ok: exitosos > 0,
        mensaje: data.message || (exitosos > 0 ? "Correo enviado" : "No se pudo enviar el correo"),
        destinatarios: data.correosEncontrados || correos,
        exitosos,
        total,
        resultados: data.resultados || [],
      });

      addToast(
        exitosos === total
          ? `Correo reenviado a ${exitosos} destinatario(s)`
          : `Envío parcial: ${exitosos} de ${total} correos`,
        exitosos > 0 ? "success" : "error"
      );
    } catch (e) {
      setError(e.message);
      addToast("Error al reenviar el correo: " + e.message, "error");
    } finally {
      setEnviando(false);
    }
  };

  const fechaEmision = info?.fechaemision || credito.fechaemision;
  const total = info?.totalapagar ?? credito.totalpagar ?? credito.montototaloperacion;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border-t-4 border-blue-600">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FaEnvelope />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Reenviar correo de emisión</h3>
                <p className="text-xs text-gray-500">
                  Mismo correo de emisión • PDF y JSON adjuntos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={enviando}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {cargando && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}

          {!cargando && (
            <div className="space-y-4">
              {/* Datos del documento */}
              <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-semibold">Documento:</span>{" "}
                  {info?.tipo_dte_descripcion || "COMPROBANTE DE CRÉDITO FISCAL"}
                </p>
                <p>
                  <span className="font-semibold">N° Control:</span>{" "}
                  {info?.ncontrol || credito.ncontrol}
                </p>
                <p>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {info?.cliente?.nombre || credito.nombrecibe || "Cliente no especificado"}
                </p>
                <p>
                  <span className="font-semibold">Total:</span>{" "}
                  {new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(total || 0)}
                  {fechaEmision ? ` • ${new Date(fechaEmision).toLocaleDateString("es-SV")}` : ""}
                </p>
              </div>

              {/* Destinatarios guardados al emitir */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Destinatarios registrados al emitir
                </label>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-gray-700 space-y-1">
                  {info?.correo_seleccionado && (
                    <p className="flex items-start gap-2">
                      <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0" />
                      <span>
                        Correo guardado en el DTE:{" "}
                        <span className="font-mono break-all">{info.correo_seleccionado}</span>
                      </span>
                    </p>
                  )}
                  {(info?.cliente?.correosValidos || []).length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5">
                      {info.cliente.correosValidos.map((correo) => (
                        <li key={correo} className="font-mono break-all">{correo}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-amber-600">El cliente no tiene correos válidos registrados.</p>
                  )}
                </div>
              </div>

              {/* Destino editable */}
              <div>
                <label
                  htmlFor="destinos-reenvio"
                  className="block text-xs font-semibold text-gray-600 mb-1"
                >
                  Enviar hacia (puedes corregir el correo)
                </label>
                <textarea
                  id="destinos-reenvio"
                  rows={3}
                  value={destinos}
                  onChange={(e) => setDestinos(e.target.value)}
                  disabled={enviando}
                  placeholder="cliente@correo.com, otro@correo.com"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-y disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separa varios correos con comas. Se enviará exactamente el mismo correo de emisión
                  con los adjuntos PDF y JSON.
                </p>
                {correos.length > 0 && invalidos.length === 0 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <FaCheckCircle /> {correos.length} correo(s) válido(s)
                  </p>
                )}
                {invalidos.length > 0 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle /> Correo(s) inválido(s): {invalidos.join(", ")}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm flex items-start gap-2">
                  <FaExclamationTriangle className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Resultado del envío */}
              {resultado && (
                <div
                  className={`p-3 rounded-md text-sm border ${
                    resultado.ok
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <p className="font-semibold flex items-center gap-2">
                    {resultado.ok ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    {resultado.mensaje}
                  </p>
                  <p className="mt-1 break-all">
                    Destinatarios: {resultado.destinatarios.join(", ")}
                  </p>
                  {resultado.resultados.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {resultado.resultados.map((r) => (
                        <li key={r.email} className="flex items-start gap-2 break-all">
                          <span>{r.success ? "✓" : "✕"}</span>
                          <span>
                            {r.email}
                            {!r.success && r.error ? ` — ${r.error}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={enviando}
            className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50 text-sm"
          >
            {resultado ? "Cerrar" : "Cancelar"}
          </button>
          {!resultado && (
            <button
              onClick={handleEnviar}
              disabled={!puedeEnviar}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm text-white transition-colors ${
                puedeEnviar
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-400 cursor-not-allowed"
              }`}
            >
              {enviando ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Enviar correo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
