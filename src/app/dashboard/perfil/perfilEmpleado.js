// src/app/dashboard/perfil/perfilEmpleado.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

/**
 * Config
 */
const API_BASE = "http://localhost:3000";
const TIPOS_DOCUMENTO = [
  { codigo: "01", nombre: "DUI" },
  { codigo: "02", nombre: "NIT" },
  { codigo: "03", nombre: "Pasaporte" },
  { codigo: "04", nombre: "Carnet de Residente" },
  { codigo: "13", nombre: "DUI (El Salvador)" },
  { codigo: "99", nombre: "Otro" },
];
const LIMITES = {
  NOMBRE: 255,
  NUMERODOCUMENTO: 20,
  CORREO: 255,
};
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getTipoDocumentoNombre(codigo) {
  const t = TIPOS_DOCUMENTO.find((x) => x.codigo === String(codigo));
  return t ? t.nombre : "Desconocido";
}

export default function PerfilEmpleado({ perfil, canEdit }) {
  const router = useRouter();

  // Abrimos modal de inmediato
  const [showModal, setShowModal] = useState(true);

  // Estado principal
  const [data, setData] = useState(perfil ?? null);
  const [form, setForm] = useState({
    nombre: perfil?.nombre ?? "",
    tipodocumento: perfil?.tipodocumento ?? "",
    numerodocumento: perfil?.numerodocumento ?? "",
    correo: perfil?.correo ?? "",
    contrasenaActual: "",
    nuevaContrasena: "",
  });

  // UI
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Si cambia el perfil prop (SSR), sincroniza
  useEffect(() => {
    if (perfil) {
      setData(perfil);
      setForm((f) => ({
        ...f,
        nombre: perfil.nombre ?? "",
        tipodocumento: perfil.tipodocumento ?? "",
        numerodocumento: perfil.numerodocumento ?? "",
        correo: perfil.correo ?? "",
        contrasenaActual: "",
        nuevaContrasena: "",
      }));
    }
  }, [perfil]);

  // Cambios relevantes para habilitar Guardar
  const hasCoreChanges = useMemo(() => {
    if (!data) return false;
    return (
      form.nombre.trim() !== (data.nombre ?? "").trim() ||
      String(form.tipodocumento) !== String(data.tipodocumento) ||
      form.numerodocumento.trim() !== (data.numerodocumento ?? "").trim() ||
      form.correo.trim() !== (data.correo ?? "").trim()
    );
  }, [form, data]);

  const hasPwdChange = useMemo(
    () => !!form.nuevaContrasena && !!form.contrasenaActual,
    [form.nuevaContrasena, form.contrasenaActual]
  );

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (hasCoreChanges) return true;
    if (hasPwdChange) return true;
    return false;
  }, [saving, hasCoreChanges, hasPwdChange]);

  function validate() {
    setError("");
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return false;
    }
    if (form.nombre.length > LIMITES.NOMBRE) {
      setError(`El nombre no puede exceder ${LIMITES.NOMBRE} caracteres.`);
      return false;
    }
    if (!form.tipodocumento) {
      setError("El tipo de documento es obligatorio.");
      return false;
    }
    if (!form.numerodocumento.trim()) {
      setError("El número de documento es obligatorio.");
      return false;
    }
    if (form.numerodocumento.length > LIMITES.NUMERODOCUMENTO) {
      setError(
        `El número de documento no puede exceder ${LIMITES.NUMERODOCUMENTO} caracteres.`
      );
      return false;
    }
    if (!form.correo.trim()) {
      setError("El correo es obligatorio.");
      return false;
    }
    if (form.correo.length > LIMITES.CORREO || !emailRegex.test(form.correo)) {
      setError("El formato del correo no es válido.");
      return false;
    }
    if (hasPwdChange) {
      if (!form.contrasenaActual) {
        setError("Debes proporcionar la contraseña actual para cambiarla.");
        return false;
      }
      if (!form.nuevaContrasena || form.nuevaContrasena.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres.");
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!canEdit) return; // vendedor no guarda
    if (!validate()) return;

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {};
      if (hasCoreChanges) {
        payload.nombre = form.nombre.trim();
        payload.tipodocumento = String(form.tipodocumento).trim();
        payload.numerodocumento = form.numerodocumento.trim();
        payload.correo = form.correo.trim().toLowerCase();
      }
      if (hasPwdChange) {
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
        // sesión caducada
        router.push("/auth/login");
        return;
      }

      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? body?.message ?? "No se pudo actualizar el perfil.");
        return;
      }

      const nuevo = body?.perfil;
      if (nuevo) {
        setData(nuevo);
        setForm((f) => ({
          ...f,
          nombre: nuevo.nombre ?? "",
          tipodocumento: nuevo.tipodocumento ?? "",
          numerodocumento: nuevo.numerodocumento ?? "",
          correo: nuevo.correo ?? "",
          contrasenaActual: "",
          nuevaContrasena: "",
        }));
      }
      setOkMsg("Perfil actualizado con éxito.");
      // No cerramos automáticamente, queda a preferencia:
      // setShowModal(false);
    } catch (err) {
      console.error("[perfilEmpleado] PUT /perfil:", err);
      setError("Error de red al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  function cerrarModal() {
    setShowModal(false);
    // Volver a la pantalla previa; si no hay historial, ir al dashboard
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  // Cerrar con Escape
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") cerrarModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  if (!showModal || !data) {
    // No renderizamos página "debajo": este route es solo un modal.
    return null;
  }

  const soloLectura = !canEdit;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        // click fuera cierra
        if (e.target === e.currentTarget) cerrarModal();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Modal de perfil"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Mi Perfil</h3>
            <p className="text-xs text-gray-500">
              {soloLectura ? "Solo lectura (rol vendedor)." : "Puedes editar tus datos."}
            </p>
          </div>
          <button
            onClick={cerrarModal}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Mensajes */}
          {okMsg && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
              <FaCheckCircle className="h-4 w-4" />
              <span className="text-sm">{okMsg}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <FaExclamationTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Campos editables/lectura */}
          <div>
            <Label>Nombre</Label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
              maxLength={LIMITES.NOMBRE}
              required
              disabled={soloLectura}
              className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                soloLectura
                  ? "border-gray-200 bg-gray-50 text-gray-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            <Help>{form.nombre.length}/{LIMITES.NOMBRE} caracteres</Help>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de documento</Label>
              <select
                value={form.tipodocumento}
                onChange={(e) => setForm((s) => ({ ...s, tipodocumento: e.target.value }))}
                required
                disabled={soloLectura}
                className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                  soloLectura
                    ? "border-gray-200 bg-gray-50 text-gray-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Seleccionar</option>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.codigo} value={t.codigo}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Número de documento</Label>
              <input
                type="text"
                value={form.numerodocumento}
                onChange={(e) =>
                  setForm((s) => ({ ...s, numerodocumento: e.target.value }))
                }
                maxLength={LIMITES.NUMERODOCUMENTO}
                required
                disabled={soloLectura}
                className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                  soloLectura
                    ? "border-gray-200 bg-gray-50 text-gray-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <Help>
                {form.numerodocumento.length}/{LIMITES.NUMERODOCUMENTO} caracteres
              </Help>
            </div>
          </div>

          <div>
            <Label>Correo</Label>
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
              maxLength={LIMITES.CORREO}
              required
              disabled={soloLectura}
              className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                soloLectura
                  ? "border-gray-200 bg-gray-50 text-gray-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            <Help>{form.correo.length}/{LIMITES.CORREO} caracteres</Help>
          </div>

          {/* Meta no editable */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow label="ID Empleado" value={data.idempleado} />
            <InfoRow label="Rol" value={data.rol} />
            <InfoRow
              label="Estado"
              value={
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    data.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {data.estado ? "Activo" : "Inactivo"}
                </span>
              }
            />
            <InfoRow
              label="Sucursal"
              value={
                data.sucursal
                  ? `${data.sucursal.nombre} (ID ${data.sucursal.idsucursal})`
                  : "-"
              }
            />
          </div>

          {/* Cambio de contraseña (solo admin) */}
          {!soloLectura && (
            <fieldset className="rounded-md border border-gray-200 p-4">
              <legend className="px-2 text-sm font-medium text-gray-700">
                Cambio de contraseña (opcional)
              </legend>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Label>Contraseña actual</Label>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.contrasenaActual}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, contrasenaActual: e.target.value }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <TogglePwd show={showPwd} setShow={setShowPwd} />
                </div>
                <div className="relative">
                  <Label>Nueva contraseña</Label>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.nuevaContrasena}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, nuevaContrasena: e.target.value }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <TogglePwd show={showPwd} setShow={setShowPwd} />
                </div>
              </div>
            </fieldset>
          )}

          {/* Footer acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={cerrarModal}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cerrar
            </button>
            {!soloLectura && (
              <button
                type="submit"
                disabled={!canSubmit}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${
                  canSubmit
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-300 cursor-not-allowed"
                }`}
              >
                <FaSave /> {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/** Subcomponentes simples para mantener orden */
function Label({ children }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">{children}</label>
  );
}
function Help({ children }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}
function InfoRow({ label, value }) {
  return (
    <div className="rounded-md border border-gray-100 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-gray-900">{value ?? "-"}</div>
    </div>
  );
}
function TogglePwd({ show, setShow }) {
  return (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      className="absolute inset-y-0 right-0 mr-3 flex items-center text-gray-400 hover:text-gray-600"
      tabIndex={-1}
      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {show ? <FaEyeSlash /> : <FaEye />}
    </button>
  );
}

