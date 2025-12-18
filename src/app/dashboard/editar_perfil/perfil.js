"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaEye,
  FaEyeSlash,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaCalendarAlt,
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { API_BASE_URL } from "@/lib/api";

// Configuración
const API_BASE = API_BASE_URL;
const DOC_OPTIONS = [
  { label: "DUI", value: 13 },
  { label: "NIT", value: 36 },
  { label: "Pasaporte", value: 3 },
  { label: "Carnet de Residente", value: 2 },
  { label: "Otro", value: 37 },
];

// Componente principal de la página
export default function PerfilPage({ user, hasHaciendaToken, haciendaStatus }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Determinar si el usuario puede editar basado en el rol
  const canEdit = useMemo(() => {
    return data?.rol !== "vendedor";
  }, [data?.rol]);

  // Cargar datos del perfil
  useEffect(() => {
    let cancel = false;
    
    const loadPerfil = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/perfil`, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Error al cargar perfil");
        if (!cancel) setData(body);
      } catch (err) {
        if (!cancel) setError(err.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    
    loadPerfil();
    return () => { cancel = true; };
  }, [router]);

  // Responsive sidebar
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed md:relative z-20 h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : "w-64"}`}
      >
        <Sidebar />
      </div>

      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-w-0">  
        {/* Navbar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-gray-600 mt-1">
                  {!canEdit ? "Solo lectura (rol vendedor)" : "Gestiona tu información personal"}
                </p>
              </div>

              {/* Contenido */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario de perfil */}
                <div className="lg:col-span-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <PerfilForm
                      data={data}
                      canEdit={canEdit}
                      saving={saving}
                      error={error}
                      okMsg={okMsg}
                      onError={setError}
                      onSuccess={(nuevosDatos) => {
                        setData(nuevosDatos);
                        setOkMsg("Perfil actualizado con éxito.");
                        setTimeout(() => setOkMsg(""), 5000);
                      }}
                      onSavingChange={setSaving}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

// Componente para mostrar información en tarjetas
function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        <p className="text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ estado }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
      estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}>
      {estado ? "Activo" : "Inactivo"}
    </span>
  );
}

function SuccessMessage({ message }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
      <FaCheckCircle className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
      <FaExclamationTriangle className="h-4 w-4 flex-shrink-0" />
      <div>
        <span className="font-medium">Error:</span>
        <span className="ml-1">{message}</span>
      </div>
    </div>
  );
}

// Componente del formulario
function PerfilForm({ data, canEdit, saving, error, okMsg, onError, onSuccess, onSavingChange }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: data?.nombre ?? "",
    tipodocumento: data?.tipodocumento != null ? String(data.tipodocumento) : "",
    numerodocumento: data?.numerodocumento ?? "",
    correo: data?.correo ?? "",
    contrasenaActual: "",
    nuevaContrasena: "",
  });
  
  const [showPwd, setShowPwd] = useState(false);

  const hasChanges = useMemo(() => {
    if (!data) return false;
    return (
      form.nombre.trim() !== (data.nombre ?? "").trim() ||
      String(form.tipodocumento) !== String(data.tipodocumento) ||
      form.numerodocumento.trim() !== (data.numerodocumento ?? "").trim() ||
      form.correo.trim() !== (data.correo ?? "").trim() ||
      (!!form.nuevaContrasena && !!form.contrasenaActual)
    );
  }, [form, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit || !hasChanges) return;

    if (!form.nombre.trim() || !form.tipodocumento || !form.numerodocumento.trim() || !form.correo.trim()) {
      onError("Todos los campos son obligatorios");
      return;
    }

    if (form.nuevaContrasena && form.nuevaContrasena.length < 6) {
      onError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      onError("");
      onSavingChange(true);
      
      const payload = {
        nombre: form.nombre.trim(),
        tipodocumento: parseInt(form.tipodocumento),
        numerodocumento: form.numerodocumento.replace(/\D/g, ""),
        correo: form.correo.trim().toLowerCase(),
      };

      if (form.nuevaContrasena) {
        payload.contrasenaActual = form.contrasenaActual;
        payload.nuevaContrasena = form.nuevaContrasena;
      }

      const res = await fetch(`${API_BASE}/perfil`, {
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
      if (!res.ok) throw new Error(body?.error || "Error al actualizar");

      onSuccess(body?.perfil || body);
      setForm(f => ({ ...f, contrasenaActual: "", nuevaContrasena: "" }));
    } catch (err) {
      onError(err.message || "Error de red");
    } finally {
      onSavingChange(false);
    }
  };

  const soloLectura = !canEdit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensajes */}
      {okMsg && <SuccessMessage message={okMsg} />}
      {error && <ErrorState message={error} />}

      {/* Campos principales */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          label="Nombre"
          type="text"
          value={form.nombre}
          onChange={(value) => setForm(f => ({ ...f, nombre: value }))}
          maxLength={70}
          required
          disabled={soloLectura}
          currentLength={form.nombre.length}
          icon={<FaUser className="text-gray-400" />}
        />

        <FormField
          label="Correo"
          type="email"
          value={form.correo}
          onChange={(value) => setForm(f => ({ ...f, correo: value }))}
          maxLength={255}
          required
          disabled={soloLectura}
          currentLength={form.correo.length}
          icon={<FaEnvelope className="text-gray-400" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DocumentTypeSelect
          value={form.tipodocumento}
          onChange={(value) => setForm(f => ({ ...f, tipodocumento: value }))}
          disabled={soloLectura}
        />
        
        <DocumentNumberField
          value={form.numerodocumento}
          tipoDocumento={parseInt(form.tipodocumento)}
          onChange={(value) => setForm(f => ({ ...f, numerodocumento: value }))}
          disabled={soloLectura}
        />
      </div>

      {/* Cambio de contraseña */}
      {!soloLectura && (
        <PasswordSection
          showPwd={showPwd}
          setShowPwd={setShowPwd}
          contrasenaActual={form.contrasenaActual}
          nuevaContrasena={form.nuevaContrasena}
          onContrasenaActualChange={(value) => setForm(f => ({ ...f, contrasenaActual: value }))}
          onNuevaContrasenaChange={(value) => setForm(f => ({ ...f, nuevaContrasena: value }))}
        />
      )}

      {/* Acciones */}
      <FormActions
        onClose={() => router.back()}
        canSubmit={canEdit && hasChanges && !saving}
        saving={saving}
        showSave={!soloLectura}
      />
    </form>
  );
}

// Componentes de formulario
function FormField({ label, type, value, onChange, maxLength, required, disabled, currentLength, icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          className={`w-full rounded-lg border px-3 py-2 text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled 
              ? "border-gray-200 bg-gray-50 text-gray-500" 
              : "border-gray-300"
          } ${icon ? 'pl-10' : ''}`}
        />
      </div>
      {maxLength && (
        <p className="mt-1 text-xs text-gray-500">{currentLength}/{maxLength} caracteres</p>
      )}
    </div>
  );
}

function DocumentTypeSelect({ value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de documento</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FaIdCard className="text-gray-400" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          className={`w-full appearance-none rounded-lg border px-3 py-2 pl-10 text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? "border-gray-200 bg-gray-50 text-gray-500" : "border-gray-300"
          }`}
        >
          <option value="">Seleccionar</option>
          {DOC_OPTIONS.map(opt => (
            <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function DocumentNumberField({ value, tipoDocumento, onChange, disabled }) {
  const formatDocumentNumber = (rawValue, tipo) => {
    const digits = rawValue.replace(/\D/g, "");
    if (tipo === 13) {
      if (digits.length <= 8) return digits;
      return `${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
    }
    if (tipo === 36) {
      if (digits.length <= 4) return digits;
      if (digits.length <= 10) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
      if (digits.length <= 13) return `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10)}`;
      return `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 13)}-${digits.slice(13, 14)}`;
    }
    return digits;
  };

  const maxLength = tipoDocumento === 13 ? 10 : tipoDocumento === 36 ? 17 : 20;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Número de documento</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FaIdCard className="text-gray-400" />
        </div>
        <input
          type="text"
          value={formatDocumentNumber(value, tipoDocumento)}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required
          disabled={disabled}
          className={`w-full rounded-lg border px-3 py-2 pl-10 text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? "border-gray-200 bg-gray-50 text-gray-500" : "border-gray-300"
          }`}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">{value.replace(/\D/g, "").length}/{maxLength} dígitos</p>
    </div>
  );
}

function PasswordSection({ showPwd, setShowPwd, contrasenaActual, nuevaContrasena, onContrasenaActualChange, onNuevaContrasenaChange }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Cambio de contraseña (opcional)</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PasswordField
          label="Contraseña actual"
          value={contrasenaActual}
          onChange={onContrasenaActualChange}
          showPwd={showPwd}
          setShowPwd={setShowPwd}
          placeholder="••••••••"
        />
        <PasswordField
          label="Nueva contraseña"
          value={nuevaContrasena}
          onChange={onNuevaContrasenaChange}
          showPwd={showPwd}
          setShowPwd={setShowPwd}
          placeholder="Mínimo 6 caracteres"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, showPwd, setShowPwd, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FaLock className="text-gray-400" />
        </div>
        <input
          type={showPwd ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 pr-10 text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPwd(s => !s)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPwd ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function FormActions({ onClose, canSubmit, saving, showSave }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Cancelar
      </button>
      {showSave && (
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            canSubmit 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "bg-blue-300 cursor-not-allowed"
          }`}
        >
          <FaSave className="h-3 w-3" /> 
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      )}
    </div>
  );
}