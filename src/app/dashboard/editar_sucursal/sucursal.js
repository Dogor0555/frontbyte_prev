"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaEnvelope,
  FaUser,
  FaIdCard,
  FaStore,
  FaBars
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

const API_BASE = "http://localhost:3000";

// Expresiones regulares para validación
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-\.\,]+$/;
const PHONE_REGEX = /^[0-9\-\+\(\)\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Límites de caracteres
const LIMITES = {
  NOMBRE: 100,
  TELEFONO: 20,
  COMPLEMENTO: 255,
  ACTIVIDAD: 100,
  DEPARTAMENTO: 2,
  MUNICIPIO: 4
};

export default function Sucursal({ sucursal, user, hasHaciendaToken, haciendaStatus }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(!sucursal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [form, setForm] = useState({
    nombre: sucursal?.nombre ?? "",
    telefono: sucursal?.telefono ?? "",
    complemento: sucursal?.complemento ?? "",
    codactividad: sucursal?.codactividad ?? "",
    desactividad: sucursal?.desactividad ?? "",
    tipoestablecimiento: sucursal?.tipoestablecimiento ?? "",
    codestablemh: sucursal?.codestablemh ?? "",
    codpuntoventamh: sucursal?.codpuntoventamh ?? "",
    codpuntoventa: sucursal?.codpuntoventa ?? "",
    departamento: sucursal?.departamento ?? "",
    municipio: sucursal?.municipio ?? ""
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

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (sucursal) return;
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/sucursal/getById/${user.idsucursal}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error ?? body?.message ?? "No se pudo cargar la sucursal.");
        }
        if (!cancel) {
          const sucursalData = body.data || body;
          setForm({
            nombre: sucursalData.nombre ?? "",
            telefono: sucursalData.telefono ?? "",
            complemento: sucursalData.complemento ?? "",
            codactividad: sucursalData.codactividad ?? "",
            desactividad: sucursalData.desactividad ?? "",
            tipoestablecimiento: sucursalData.tipoestablecimiento ?? "",
            codestablemh: sucursalData.codestablemh ?? "",
            codpuntoventamh: sucursalData.codpuntoventamh ?? "",
            codpuntoventa: sucursalData.codpuntoventa ?? "",
            departamento: sucursalData.departamento ?? "",
            municipio: sucursalData.municipio ?? ""
          });
        }
      } catch (e) {
        if (!cancel) setError(e.message || "Error al cargar la sucursal.");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [sucursal, user.idsucursal, router]);

  useEffect(() => {
    if (sucursal) {
      setForm({
        nombre: sucursal.nombre ?? "",
        telefono: sucursal.telefono ?? "",
        complemento: sucursal.complemento ?? "",
        codactividad: sucursal.codactividad ?? "",
        desactividad: sucursal.desactividad ?? "",
        tipoestablecimiento: sucursal.tipoestablecimiento ?? "",
        codestablemh: sucursal.codestablemh ?? "",
        codpuntoventamh: sucursal.codpuntoventamh ?? "",
        codpuntoventa: sucursal.codpuntoventa ?? "",
        departamento: sucursal.departamento ?? "",
        municipio: sucursal.municipio ?? ""
      });
    }
  }, [sucursal]);

  const hasChanges = useMemo(() => {
    if (!sucursal) return false;
    return (
      form.nombre.trim() !== (sucursal.nombre ?? "").trim() ||
      form.telefono.trim() !== (sucursal.telefono ?? "").trim() ||
      form.complemento.trim() !== (sucursal.complemento ?? "").trim() ||
      form.codactividad.trim() !== (sucursal.codactividad ?? "").trim() ||
      form.desactividad.trim() !== (sucursal.desactividad ?? "").trim() ||
      form.tipoestablecimiento.trim() !== (sucursal.tipoestablecimiento ?? "").trim() ||
      form.codestablemh.trim() !== (sucursal.codestablemh ?? "").trim() ||
      form.codpuntoventamh.trim() !== (sucursal.codpuntoventamh ?? "").trim() ||
      form.codpuntoventa.trim() !== (sucursal.codpuntoventa ?? "").trim() ||
      form.departamento.trim() !== (sucursal.departamento ?? "").trim() ||
      form.municipio.trim() !== (sucursal.municipio ?? "").trim()
    );
  }, [form, sucursal]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (hasChanges) return true;
    return false;
  }, [saving, hasChanges]);

  function validate() {
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre de la sucursal es obligatorio.");
      return false;
    }
    if (form.nombre.trim().length > LIMITES.NOMBRE) {
      setError(`El nombre no puede exceder ${LIMITES.NOMBRE} caracteres.`);
      return false;
    }
    if (!NAME_REGEX.test(form.nombre.trim())) {
      setError("El nombre contiene caracteres no válidos.");
      return false;
    }
    
    if (form.telefono && !PHONE_REGEX.test(form.telefono)) {
      setError("El formato del teléfono no es válido.");
      return false;
    }
    if (form.telefono.trim().length > LIMITES.TELEFONO) {
      setError(`El teléfono no puede exceder ${LIMITES.TELEFONO} caracteres.`);
      return false;
    }
    
    if (form.complemento.trim().length > LIMITES.COMPLEMENTO) {
      setError(`El complemento no puede exceder ${LIMITES.COMPLEMENTO} caracteres.`);
      return false;
    }
    
    if (form.codestablemh && form.codestablemh.length !== 4) {
      setError("El código de establecimiento MH debe tener 4 caracteres.");
      return false;
    }
    
    if (form.codpuntoventamh && form.codpuntoventamh.length !== 4) {
      setError("El código de punto de venta MH debe tener 4 caracteres.");
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
      
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        complemento: form.complemento.trim(),
        codactividad: form.codactividad.trim(),
        desactividad: form.desactividad.trim(),
        tipoestablecimiento: form.tipoestablecimiento.trim(),
        codestablemh: form.codestablemh.trim(),
        codpuntoventamh: form.codpuntoventamh.trim(),
        codpuntoveta: form.codpuntoventa.trim(),
        departamento: form.departamento.trim(),
        municipio: form.municipio.trim()
      };
      
      Object.keys(payload).forEach(key => {
        if (sucursal && payload[key] === (sucursal[key] || "")) {
          delete payload[key];
        }
      });

      if (Object.keys(payload).length === 0) {
        setOkMsg("No se detectaron cambios para guardar.");
        setSaving(false);
        return;
      }
      
      const res = await fetch(`${API_BASE}/sucursal/update/${sucursal.idsucursal}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? body?.message ?? "No se pudo actualizar la sucursal.");
        return;
      }
      
      setOkMsg("Sucursal actualizada con éxito.");
      
      if (body.data) {
        setForm({
          nombre: body.data.nombre ?? "",
          telefono: body.data.telefono ?? "",
          complemento: body.data.complemento ?? "",
          codactividad: body.data.codactividad ?? "",
          desactividad: body.data.desactividad ?? "",
          tipoestablecimiento: body.data.tipoestablecimiento ?? "",
          codestablemh: body.data.codestablemh ?? "",
          codpuntoventamh: body.data.codpuntoventamh ?? "",
          codpuntoventa: body.data.codpuntoventa ?? "",
          departamento: body.data.departamento ?? "",
          municipio: body.data.municipio ?? ""
        });
      }
      
    } catch (err) {
      console.error("[sucursal] PUT /sucursales/update:", err);
      setError("Error de red al actualizar la sucursal.");
    } finally {
      setSaving(false);
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
            className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                  Información de Sucursal
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                {user.rol === "admin" ? "Puedes editar los datos de la sucursal." : "Solo lectura."}
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

            {/* Formulario de Sucursal */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-x-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBuilding className="text-blue-500" /> Datos de la Sucursal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="min-w-0">
                  <Label>ID Sucursal</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={sucursal?.idsucursal || ""}
                      disabled
                      className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-500 bg-gray-100"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <Label>Nombre de la Sucursal *</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm({...form, nombre: e.target.value})}
                      maxLength={LIMITES.NOMBRE}
                      required
                      disabled={user.rol !== "admin"}
                      className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Help>{form.nombre.length}/{LIMITES.NOMBRE} caracteres</Help>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="min-w-0">
                  <Label>Teléfono</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={(e) => setForm({...form, telefono: e.target.value})}
                      maxLength={LIMITES.TELEFONO}
                      disabled={user.rol !== "admin"}
                      className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Help>{form.telefono.length}/{LIMITES.TELEFONO} caracteres</Help>
                </div>

                <div className="min-w-0">
                  <Label>Complemento/Dirección</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.complemento}
                      onChange={(e) => setForm({...form, complemento: e.target.value})}
                      maxLength={LIMITES.COMPLEMENTO}
                      disabled={user.rol !== "admin"}
                      className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Help>{form.complemento.length}/{LIMITES.COMPLEMENTO} caracteres</Help>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="min-w-0">
                  <Label>Código de Actividad</Label>
                  <input
                    type="text"
                    value={form.codactividad}
                    onChange={(e) => setForm({...form, codactividad: e.target.value})}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="min-w-0">
                  <Label>Descripción de Actividad</Label>
                  <input
                    type="text"
                    value={form.desactividad}
                    onChange={(e) => setForm({...form, desactividad: e.target.value})}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="min-w-0">
                  <Label>Tipo de Establecimiento</Label>
                  <input
                    type="text"
                    value={form.tipoestablecimiento}
                    onChange={(e) => setForm({...form, tipoestablecimiento: e.target.value})}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="min-w-0">
                  <Label>Código Establecimiento MH</Label>
                  <input
                    type="text"
                    value={form.codestablemh}
                    onChange={(e) => setForm({...form, codestablemh: e.target.value})}
                    maxLength={4}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="min-w-0">
                  <Label>Código Punto Venta MH</Label>
                  <input
                    type="text"
                    value={form.codpuntoventamh}
                    onChange={(e) => setForm({...form, codpuntoventamh: e.target.value})}
                    maxLength={4}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="min-w-0">
                  <Label>Código Punto Venta</Label>
                  <input
                    type="text"
                    value={form.codpuntoventa}
                    onChange={(e) => setForm({...form, codpuntoventa: e.target.value})}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="min-w-0">
                  <Label>Departamento</Label>
                  <input
                    type="text"
                    value={form.departamento}
                    onChange={(e) => setForm({...form, departamento: e.target.value})}
                    maxLength={LIMITES.DEPARTAMENTO}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="min-w-0">
                  <Label>Municipio</Label>
                  <input
                    type="text"
                    value={form.municipio}
                    onChange={(e) => setForm({...form, municipio: e.target.value})}
                    maxLength={LIMITES.MUNICIPIO}
                    disabled={user.rol !== "admin"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer acciones */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 order-2 sm:order-1"
                >
                  Volver al Dashboard
                </button>
                {user.rol === "admin" && (
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white order-1 sm:order-2 ${
                      canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
                    }`}
                  >
                    <FaSave /> {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                )}
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
  return <label className="mb-1 block text-sm font-medium text-gray-700">{children}</label>;
}

function Help({ children }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
      <div className="mt-1">{icon}</div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
        <div className="mt-0.5 text-sm text-gray-900">{value ?? "-"}</div>
      </div>
    </div>
  );
}