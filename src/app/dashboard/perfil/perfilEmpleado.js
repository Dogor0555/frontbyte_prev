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

/** Config */
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000"; // ✅ usar env si existe

// Catálogo con valores ENTEROS (coherente con el dashboard):
// DUI=13, NIT=36, Pasaporte=3, Carnet=2, Otro=37
const DOC_OPTIONS = [
  { label: "DUI", value: 13 },
  { label: "NIT", value: 36 },
  { label: "Pasaporte", value: 3 },
  { label: "Carnet de Residente", value: 2 },
  { label: "Otro", value: 37 },
];
const LIMITES = {
  NOMBRE: 70, // antes 255
  NUMERODOCUMENTO: 20, // fallback "Otros"
  CORREO: 255,
};
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Nombre: solo letras (tildes, ñ/ü) y espacios
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

const sanitizeName = (val) =>
  (val ?? "").replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, "").replace(/\s{2,}/g, " ");

const FORMAT_NUMBER_ON_SUBMIT = false;
const toDigits = (raw) => (raw ?? "").replace(/\D+/g, "");
const maxLenNumeroDocumento = (tipoInt) =>
  tipoInt === 13 ? 10 : tipoInt === 36 ? 17 : LIMITES.NUMERODOCUMENTO;
const capDigitsPorTipo = (digits, tipoInt) =>
  tipoInt === 13 ? digits.slice(0, 9) : tipoInt === 36 ? digits.slice(0, 14) : digits.slice(0, LIMITES.NUMERODOCUMENTO);

// Formateo DUI/NIT
function formatNumeroDocumento(rawOrDigits, tipoInt) {
  const digits = toDigits(rawOrDigits);
  if (tipoInt === 13) {
    const d = digits.slice(0, 9);
    if (d.length <= 8) return d;
    return `${d.slice(0, 8)}-${d.slice(8)}`;
  }
  if (tipoInt === 36) {
    const d = digits.slice(0, 14);
    if (d.length <= 4) return d;
    if (d.length <= 10) return `${d.slice(0, 4)}-${d.slice(4)}`;
    if (d.length <= 13) return `${d.slice(0, 4)}-${d.slice(4, 10)}-${d.slice(10)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 10)}-${d.slice(10, 13)}-${d.slice(13)}`;
  }
  // Otros: sin auto-guiones
  return digits;
}
function maskNumeroDocumentoLive(rawValue, tipoInt) {
  const digits = capDigitsPorTipo(toDigits(rawValue), tipoInt);
  return formatNumeroDocumento(digits, tipoInt);
}
// Validación estricta del número por tipo (para Guardar)
function validateNumeroDocumentoPorTipo(displayValue, tipoInt) {
  const val = (displayValue ?? "").trim();
  if (!val) return { ok: false, message: "El número de documento es obligatorio." };
  if (tipoInt === 13) {
    const fullPattern = /^\d{8}-\d{1}$/;
    if (!fullPattern.test(val)) {
      const digits = toDigits(val);
      if (digits.length < 9)
        return { ok: false, message: "El DUI debe tener 9 dígitos (formato 00000000-0)." };
      return { ok: false, message: "El DUI debe tener el formato 00000000-0 (solo dígitos y un guion)." };
    }
    return { ok: true };
  }
  if (tipoInt === 36) {
    const fullPattern = /^\d{4}-\d{6}-\d{3}-\d{1}$/;
    if (!fullPattern.test(val)) {
      const digits = toDigits(val);
      if (digits.length < 14)
        return { ok: false, message: "El NIT debe tener 14 dígitos (formato 0000-000000-000-0)." };
      return {
        ok: false,
        message:
          "El NIT debe tener el formato 0000-000000-000-0 (solo dígitos y guiones en posiciones correctas).",
      };
    }
    return { ok: true };
  }
  const otherPattern = /^[A-Za-z0-9-]+$/;
  return otherPattern.test(val)
    ? { ok: true }
    : { ok: false, message: "El número de documento solo puede contener letras, números y guiones." };
}

export default function PerfilEmpleado({ perfil, canEdit }) {
  const router = useRouter();

  // Abrimos modal de inmediato
  const [showModal, setShowModal] = useState(true);

  // ✅ Nuevo: si no viene `perfil`, nos auto-hidratamos (fetch)
  const [data, setData] = useState(perfil ?? null);
  const [loading, setLoading] = useState(!perfil); // ✅

  const [form, setForm] = useState({
    nombre: perfil?.nombre ?? "",
    // Mantenemos string para el <select>, aunque guardemos entero al enviar
    tipodocumento: perfil?.tipodocumento != null ? String(perfil.tipodocumento) : "",
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

  // ✅ Nuevo: auto-fetch si no recibimos perfil (intercept route)
  useEffect(() => {
    let cancel = false;
    async function load() {
      if (perfil) return; // ya tenemos datos por prop
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/perfil`, {
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
          throw new Error(body?.error ?? body?.message ?? "No se pudo cargar el perfil.");
        }
        if (!cancel) {
          setData(body);
          setForm((f) => ({
            ...f,
            nombre: body.nombre ?? "",
            tipodocumento: body.tipodocumento != null ? String(body.tipodocumento) : "",
            numerodocumento: body.numerodocumento ?? "",
            correo: body.correo ?? "",
            contrasenaActual: "",
            nuevaContrasena: "",
          }));
        }
      } catch (e) {
        if (!cancel) setError(e.message || "Error al cargar el perfil.");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]); // ✅

  // Si cambia el perfil prop (SSR), sincroniza
  useEffect(() => {
    if (perfil) {
      setData(perfil);
      setForm((f) => ({
        ...f,
        nombre: perfil.nombre ?? "",
        tipodocumento: perfil.tipodocumento != null ? String(perfil.tipodocumento) : "",
        numerodocumento: perfil.numerodocumento ?? "",
        correo: perfil.correo ?? "",
        contrasenaActual: "",
        nuevaContrasena: "",
      }));
    }
  }, [perfil]);

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
    // Nombre
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return false;
    }
    if (form.nombre.trim().length > LIMITES.NOMBRE) {
      setError(`El nombre no puede exceder ${LIMITES.NOMBRE} caracteres.`);
      return false;
    }
    if (!NAME_REGEX.test(form.nombre.trim())) {
      setError(
        "El nombre solo puede contener letras (incluyendo tildes y ñ) y espacios. No se permiten números ni símbolos."
      );
      return false;
    }
    // Tipo y número de documento
    if (!form.tipodocumento) {
      setError("El tipo de documento es obligatorio.");
      return false;
    }
    const tipoInt = parseInt(form.tipodocumento, 10);
    const { ok, message } = validateNumeroDocumentoPorTipo(form.numerodocumento, tipoInt);
    if (!ok) {
      setError(message);
      return false;
    }
    // Correo
    if (!form.correo.trim()) {
      setError("El correo es obligatorio.");
      return false;
    }
    if (form.correo.length > LIMITES.CORREO || !emailRegex.test(form.correo)) {
      setError("El formato del correo no es válido.");
      return false;
    }
    // Si hay cambio de contraseña
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

  // ✅ deduce canEdit si no viene por prop
  const effectiveCanEdit =
    typeof canEdit === "boolean" ? canEdit : String(data?.rol ?? "").toLowerCase() === "admin";

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!effectiveCanEdit) return; // vendedor no guarda
    if (!validate()) return;
    try {
      setSaving(true);
      setError("");
      setOkMsg("");
      const payload = {};
      const tipoInt = parseInt(form.tipodocumento, 10);
      const digitsOnly = toDigits(form.numerodocumento);
      const numeroFmt = FORMAT_NUMBER_ON_SUBMIT
        ? formatNumeroDocumento(digitsOnly, tipoInt)
        : digitsOnly;

      // Solo incluir los campos que REALMENTE cambiaron
      // Nombre
      if (form.nombre.trim() !== (data?.nombre ?? "").trim()) {
        payload.nombre = form.nombre.trim();
      }
      // Tipo de documento
      const prevTipoStr = data?.tipodocumento != null ? String(data.tipodocumento) : "";
      if (String(form.tipodocumento) !== prevTipoStr) {
        payload.tipodocumento = Number.isNaN(tipoInt) ? null : tipoInt;
      }
      // Número de documento (comparar normalizando)
      const prevDigits = toDigits(data?.numerodocumento ?? "");
      if (numeroFmt !== prevDigits) {
        payload.numerodocumento = numeroFmt;
      }
      // Correo (comparación case-insensitive)
      const prevCorreo = String(data?.correo ?? "").toLowerCase().trim();
      const newCorreo = form.correo.trim().toLowerCase();
      if (newCorreo !== prevCorreo) {
        payload.correo = newCorreo;
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
        router.push("/auth/login");
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? body?.message ?? "No se pudo actualizar el perfil.");
        return;
      }
      const nuevo = body?.perfil ?? body; // por si tu API devuelve {perfil} o el objeto plano
      if (nuevo) {
        setData(nuevo);
        setForm((f) => ({
          ...f,
          nombre: nuevo.nombre ?? "",
          tipodocumento: nuevo.tipodocumento != null ? String(nuevo.tipodocumento) : "",
          numerodocumento: nuevo.numerodocumento ?? "",
          correo: nuevo.correo ?? "",
          contrasenaActual: "",
          nuevaContrasena: "",
        }));
      }
      setOkMsg("Perfil actualizado con éxito.");
      // No cerramos automáticamente; queda a preferencia.
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

  // ❌ Antes: if (!showModal || !data) return null;
  // ✅ Ahora: el shell del modal SIEMPRE se pinta; dentro mostramos loading/error
  if (!showModal) return null;

  const soloLectura = !effectiveCanEdit;

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
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">Cargando perfil…</div>
        ) : error && !data ? (
          <div className="px-5 py-10">
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <FaExclamationTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Mensajes */}
            {okMsg && (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
                <FaCheckCircle className="h-4 w-4" />
                <span className="text-sm">{okMsg}</span>
              </div>
            )}
            {error && data && (
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
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    nombre: sanitizeName(e.target.value).slice(0, LIMITES.NOMBRE),
                  }))
                }
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
                  onChange={(e) => {
                    const newTipo = parseInt(e.target.value, 10);
                    setForm((s) => ({
                      ...s,
                      tipodocumento: e.target.value,
                      numerodocumento: maskNumeroDocumentoLive(s.numerodocumento, newTipo),
                    }));
                  }}
                  required
                  disabled={soloLectura}
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                    soloLectura
                      ? "border-gray-200 bg-gray-50 text-gray-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                >
                  <option value="">Seleccionar</option>
                  {DOC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Número de documento</Label>
                <input
                  type="text"
                  value={form.numerodocumento}
                  onChange={(e) => {
                    const tipoInt = parseInt(form.tipodocumento, 10);
                    const masked = maskNumeroDocumentoLive(e.target.value, tipoInt);
                    setForm((s) => ({ ...s, numerodocumento: masked }));
                  }}
                  maxLength={maxLenNumeroDocumento(parseInt(form.tipodocumento, 10))}
                  required
                  disabled={soloLectura}
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                    soloLectura
                      ? "border-gray-200 bg-gray-50 text-gray-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <Help>
                  {form.numerodocumento.length}/
                  {maxLenNumeroDocumento(parseInt(form.tipodocumento, 10))} caracteres
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
            {data && (
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
                  value={data.sucursal ? `${data.sucursal.nombre} (ID ${data.sucursal.idsucursal})` : "-"}
                />
              </div>
            )}

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
                      onChange={(e) => setForm((s) => ({ ...s, contrasenaActual: e.target.value }))}
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
                      onChange={(e) => setForm((s) => ({ ...s, nuevaContrasena: e.target.value }))}
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
                    canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
                  }`}
                >
                  <FaSave /> {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** Subcomponentes simples para mantener orden */
function Label({ children }) {
  return <label className="mb-1 block text-sm font-medium text-gray-700">{children}</label>;
}
function Help({ children }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}
function InfoRow({ label, value }) {
  return (
    <div className="rounded-md border border-gray-100 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
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
