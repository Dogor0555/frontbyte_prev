"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTicketAlt,
  FaQrcode,
  FaRuler,
  FaEye,
  FaEyeSlash,
  FaTextWidth,
  FaChevronDown,
  FaBars,
  FaCheck,
  FaTimes,
  FaPalette,
  FaPrint
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

const API_BASE = "http://localhost:3000";

// Límites de caracteres
const LIMITES = {
  TEXTO_PIE_PAGINA: 200
};

export default function ConfigurarTickets({ 
  configuracionTickets, 
  sucursal, 
  user, 
  hasHaciendaToken, 
  haciendaStatus 
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [form, setForm] = useState({
    ancho_mm: 80,
    margen_mm_horizontal: 3,
    margen_mm_vertical: 3,
    mostrar_qr: true,
    mostrar_lineas_separadoras: true,
    mostrar_datos_emisor: true,
    mostrar_datos_receptor: true,
    mostrar_detalle_productos: true,
    mostrar_resumen_pagos: true,
    mostrar_pie_pagina: true,
    texto_pie_pagina: "¡Gracias por su compra!",
    tamaño_qr_px: 70,
    calidad_qr: "M"
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Cargar configuración existente si existe
  useEffect(() => {
    if (configuracionTickets) {
      setForm({
        ancho_mm: configuracionTickets.ancho_mm || 80,
        margen_mm_horizontal: configuracionTickets.margen_mm_horizontal || 3,
        margen_mm_vertical: configuracionTickets.margen_mm_vertical || 3,
        mostrar_qr: configuracionTickets.mostrar_qr !== false,
        mostrar_lineas_separadoras: configuracionTickets.mostrar_lineas_separadoras !== false,
        mostrar_datos_emisor: configuracionTickets.mostrar_datos_emisor !== false,
        mostrar_datos_receptor: configuracionTickets.mostrar_datos_receptor !== false,
        mostrar_detalle_productos: configuracionTickets.mostrar_detalle_productos !== false,
        mostrar_resumen_pagos: configuracionTickets.mostrar_resumen_pagos !== false,
        mostrar_pie_pagina: configuracionTickets.mostrar_pie_pagina !== false,
        texto_pie_pagina: configuracionTickets.texto_pie_pagina || "¡Gracias por su compra!",
        tamaño_qr_px: configuracionTickets.tamaño_qr_px || 70,
        calidad_qr: configuracionTickets.calidad_qr || "M"
      });
    }
  }, [configuracionTickets]);

  const hasChanges = useMemo(() => {
    if (!configuracionTickets) return true;
    
    const configChanges = (
      form.ancho_mm !== configuracionTickets.ancho_mm ||
      form.margen_mm_horizontal !== configuracionTickets.margen_mm_horizontal ||
      form.margen_mm_vertical !== configuracionTickets.margen_mm_vertical ||
      form.mostrar_qr !== configuracionTickets.mostrar_qr ||
      form.mostrar_lineas_separadoras !== configuracionTickets.mostrar_lineas_separadoras ||
      form.mostrar_datos_emisor !== configuracionTickets.mostrar_datos_emisor ||
      form.mostrar_datos_receptor !== configuracionTickets.mostrar_datos_receptor ||
      form.mostrar_detalle_productos !== configuracionTickets.mostrar_detalle_productos ||
      form.mostrar_resumen_pagos !== configuracionTickets.mostrar_resumen_pagos ||
      form.mostrar_pie_pagina !== configuracionTickets.mostrar_pie_pagina ||
      form.texto_pie_pagina !== configuracionTickets.texto_pie_pagina ||
      form.tamaño_qr_px !== configuracionTickets.tamaño_qr_px ||
      form.calidad_qr !== configuracionTickets.calidad_qr
    );

    return configChanges;
  }, [form, configuracionTickets]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (hasChanges) return true;
    return false;
  }, [saving, hasChanges]);

  function validate() {
    setError("");

    if (form.ancho_mm < 50 || form.ancho_mm > 200) {
      setError("El ancho del ticket debe estar entre 50mm y 200mm.");
      return false;
    }

    if (form.margen_mm_horizontal < 0 || form.margen_mm_horizontal > 20) {
      setError("El margen horizontal debe estar entre 0mm y 20mm.");
      return false;
    }

    if (form.margen_mm_vertical < 0 || form.margen_mm_vertical > 20) {
      setError("El margen vertical debe estar entre 0mm y 20mm.");
      return false;
    }

    if (form.tamaño_qr_px < 50 || form.tamaño_qr_px > 150) {
      setError("El tamaño del QR debe estar entre 50px y 150px.");
      return false;
    }

    if (form.texto_pie_pagina.length > LIMITES.TEXTO_PIE_PAGINA) {
      setError(`El texto del pie de página no puede exceder ${LIMITES.TEXTO_PIE_PAGINA} caracteres.`);
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setSaving(true);
      setError("");
      setOkMsg("");
      
      const url = configuracionTickets 
        ? `${API_BASE}/configuracion-tickets/update/sucursal/${user.idsucursal}`
        : `${API_BASE}/configuracion-tickets/create`;

      const method = configuracionTickets ? 'PUT' : 'POST';

      const payload = configuracionTickets 
        ? form
        : { ...form, sucursalid: user.idsucursal };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || data?.message || "No se pudo guardar la configuración.");
        return;
      }

      setOkMsg(configuracionTickets 
        ? "Configuración de tickets actualizada correctamente" 
        : "Configuración de tickets creada correctamente"
      );
      
    } catch (err) {
      console.error("[configurar-tickets] Error al guardar:", err);
      setError("Error de red al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const resetToDefaults = () => {
    setForm({
      ancho_mm: 80,
      margen_mm_horizontal: 3,
      margen_mm_vertical: 3,
      mostrar_qr: true,
      mostrar_lineas_separadoras: true,
      mostrar_datos_emisor: true,
      mostrar_datos_receptor: true,
      mostrar_detalle_productos: true,
      mostrar_resumen_pagos: true,
      mostrar_pie_pagina: true,
      texto_pie_pagina: "¡Gracias por su compra!",
      tamaño_qr_px: 70,
      calidad_qr: "M"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <div className="flex flex-1 h-full">
          <div
            className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-0"
              } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
          >
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <Navbar 
              user={user}
              hasHaciendaToken={hasHaciendaToken}
              haciendaStatus={haciendaStatus}
              onToggleSidebar={toggleSidebar}
              sidebarOpen={sidebarOpen}
            />

            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex flex-1 h-full">
        <div
          className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
        >
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  Configurar Tickets
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                {sucursal ? `Sucursal: ${sucursal.nombre}` : 'Configuración de formato de tickets'}
              </p>
            </div>

            {/* Mensajes */}
            {okMsg && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800 mb-6">
                <FaCheckCircle className="h-4 w-4" />
                <span className="text-sm">{okMsg}</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 mb-6">
                <FaExclamationTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Formulario de Configuración de Tickets */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-x-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaTicketAlt className="text-blue-500" /> Configuración de Formato de Tickets
              </h2>

              {/* Sección Dimensiones */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaRuler className="text-purple-500" /> Dimensiones del Ticket
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <Label>Ancho del Ticket (mm) *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaRuler className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="ancho_mm"
                        value={form.ancho_mm}
                        onChange={handleInputChange}
                        min="50"
                        max="200"
                        required
                        className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <Help>Valores comunes: 57mm, 80mm</Help>
                  </div>

                  <div className="min-w-0">
                    <Label>Margen Horizontal (mm) *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaRuler className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="margen_mm_horizontal"
                        value={form.margen_mm_horizontal}
                        onChange={handleInputChange}
                        min="0"
                        max="20"
                        required
                        className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <Help>Recomendado: 3mm</Help>
                  </div>

                  <div className="min-w-0">
                    <Label>Margen Vertical (mm) *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaRuler className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="margen_mm_vertical"
                        value={form.margen_mm_vertical}
                        onChange={handleInputChange}
                        min="0"
                        max="20"
                        required
                        className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <Help>Recomendado: 3mm</Help>
                  </div>
                </div>
              </div>

              {/* Sección QR */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaQrcode className="text-green-500" /> Configuración de Código QR
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="mostrar_qr"
                        checked={form.mostrar_qr}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900 font-medium">
                        Mostrar código QR
                      </label>
                    </div>
                    <Help>Incluir código QR para consulta</Help>
                  </div>

                  <div className="min-w-0">
                    <Label>Tamaño QR (px)</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaQrcode className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="tamaño_qr_px"
                        value={form.tamaño_qr_px}
                        onChange={handleInputChange}
                        min="50"
                        max="150"
                        className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <Help>Recomendado: 70px</Help>
                  </div>

                  <div className="min-w-0">
                    <Label>Calidad QR</Label>
                    <div className="relative">
                      <select
                        name="calidad_qr"
                        value={form.calidad_qr}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        <option value="L">Baja (L)</option>
                        <option value="M">Media (M)</option>
                        <option value="Q">Alta (Q)</option>
                        <option value="H">Máxima (H)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <Help>Recomendado: Media (M)</Help>
                  </div>
                </div>
              </div>

              {/* Sección Elementos Visibles */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaEye className="text-orange-500" /> Elementos Visibles en el Ticket
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mostrar_lineas_separadoras"
                      checked={form.mostrar_lineas_separadoras}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mostrar líneas separadoras
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mostrar_datos_emisor"
                      checked={form.mostrar_datos_emisor}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mostrar datos del emisor
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mostrar_datos_receptor"
                      checked={form.mostrar_datos_receptor}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mostrar datos del receptor
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mostrar_detalle_productos"
                      checked={form.mostrar_detalle_productos}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mostrar detalle de productos
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mostrar_resumen_pagos"
                      checked={form.mostrar_resumen_pagos}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mostrar resumen de pagos
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mostrar_pie_pagina"
                      checked={form.mostrar_pie_pagina}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mostrar pie de página
                    </label>
                  </div>
                </div>
              </div>

              {/* Texto del pie de página */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaTextWidth className="text-indigo-500" /> Texto del Pie de Página
                </h3>

                <div className="min-w-0">
                  <Label>Mensaje del Pie de Página</Label>
                  <div className="relative">
                    <textarea
                      name="texto_pie_pagina"
                      value={form.texto_pie_pagina}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={LIMITES.TEXTO_PIE_PAGINA}
                      className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Help>{form.texto_pie_pagina.length}/{LIMITES.TEXTO_PIE_PAGINA} caracteres</Help>
                </div>
              </div>

              {/* Resumen de Configuración */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <FaPalette className="text-blue-600" /> Resumen de Configuración
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
                  <div><span className="font-medium">Ancho:</span> {form.ancho_mm}mm</div>
                  <div><span className="font-medium">Márgenes:</span> {form.margen_mm_horizontal}mm (H) x {form.margen_mm_vertical}mm (V)</div>
                  <div><span className="font-medium">QR:</span> {form.mostrar_qr ? 'Sí' : 'No'} {form.mostrar_qr && `(${form.tamaño_qr_px}px, ${form.calidad_qr})`}</div>
                  <div><span className="font-medium">Elementos visibles:</span> {
                    [form.mostrar_datos_emisor, form.mostrar_datos_receptor, form.mostrar_detalle_productos, form.mostrar_resumen_pagos]
                      .filter(Boolean).length
                  }/4</div>
                </div>
              </div>

              {/* Footer acciones */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Volver al Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="rounded-md bg-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-300"
                  >
                    Restablecer Valores
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`inline-flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-white ${
                    canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
                  }`}
                >
                  <FaSave /> {saving ? "Guardando..." : (configuracionTickets ? "Actualizar Configuración" : "Guardar Configuración")}
                </button>
              </div>
            </form>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

function Help({ children }) {
  return <p className="text-xs text-gray-500 mt-1">{children}</p>;
}