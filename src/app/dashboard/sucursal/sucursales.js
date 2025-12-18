"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FaSearch, FaBars, FaTimes, FaEdit, FaSave } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { API_BASE_URL } from "@/lib/api";

/* =========================================
  Config / Utils
========================================= */
const API_BASE = API_BASE_URL;

// fetch JSON con manejo de errores uniforme
async function jsonFetch(url, options = {}) {
  const resp = await fetch(url, { credentials: "include", cache: "no-store", ...options });
  let data;
  try { data = await resp.json(); } catch { data = null; }
  if (!resp.ok || data?.ok === false) {
    const msg = data?.details?.join?.(", ") || data?.error || `Error HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}

// acento-insensible
const norm = (s = "") => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// hook debounce simple
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// seleccionar solo campos persistentes para comparar (sin rubro)
const pickComparable = (f) => ({
  nombre: f.nombre ?? "",
  telefono: f.telefono ?? "",
  complemento: f.complemento ?? "",
  tipoestablecimiento: f.tipoestablecimiento ?? "",
  codestablemh: f.codestablemh ?? "",
  codpuntoventamh: f.codpuntoventamh ?? "",
  codpuntoventa: f.codpuntoventa ?? "",
  departamento: f.departamento ?? "",
  municipio: f.municipio ?? "",
  logo: f.logo ?? "",
});

const getWorkingSucursalId = (user) =>
  user?.sucursalId || user?.sucursalid || user?.branchId || user?.sucursal?.idsucursal || null;

/* =========================================
   Diálogo confirmar descarte
========================================= */
function ConfirmDialog({ open, title="Confirmar", message="¿Estás seguro?", confirmText="Aceptar", cancelText="Cancelar", loading=false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded border hover:bg-gray-50" disabled={loading}>{cancelText}</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" disabled={loading}>
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   Página principal (solo UNA sucursal, sin crear ni eliminar)
========================================= */
export default function SucursalesSoloUna({ initialData, user }) {
  if (!user?.id) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="bg-white p-6 rounded shadow text-center">
          <h1 className="text-xl font-semibold text-gray-800">Inicia sesión</h1>
          <p className="text-gray-600 mt-2">Necesitas iniciar sesión para ver tu sucursal.</p>
        </div>
      </div>
    );
  }

  const [workingSucursalId, setWorkingSucursalId] = useState(getWorkingSucursalId(user));

  /* ---------- Layout / Responsive ---------- */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);

  /* ---------- Catálogos básicos ---------- */
  const DEPARTAMENTOS = DEPARTAMENTOS_DATA;
  const MUNICIPIOS = MUNICIPIOS_DATA;
  const deptosOptions = DEPARTAMENTOS;

  /* ---------- Filtros ---------- */
  const [searchTerm, setSearchTerm] = useState("");
  const q = useDebounce(searchTerm.trim(), 350);

  /* ---------- Tabla/state ---------- */
  const [rows, setRows] = useState(initialData?.data ?? []);
  const [meta, setMeta] = useState(initialData?.meta ?? { total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------- Modal editar ---------- */
  const emptyForm = useMemo(() => ({
    nombre: "",
    telefono: "",
    complemento: "",
    // Rubro (solo lectura)
    codactividad: "",
    desactividad: "",
    // Otros
    tipoestablecimiento: "",
    codestablemh: "",
    codpuntoventamh: "",
    codpuntoventa: "",
    departamento: "",
    municipio: "",
    logo: null,
  }), []);

  const [form, setForm] = useState(emptyForm);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // snapshot para detectar cambios (sin rubro)
  const initialFormRef = useRef(pickComparable(emptyForm));
  useEffect(() => {
    if (openModal) {
      initialFormRef.current = pickComparable(form);
    }
  }, [openModal, editingId, form]);

  const isDirty = useMemo(
    () => JSON.stringify(pickComparable(form)) !== JSON.stringify(initialFormRef.current),
    [form]
  );

  // confirmar cancelación
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const handleCancel = useCallback(() => {
    if (isDirty) setShowCancelConfirmModal(true);
    else setOpenModal(false);
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setShowCancelConfirmModal(false);
    setOpenModal(false);
    setForm(emptyForm);
    setMuniQuery("");
  }, [emptyForm]);

  /* ---------- Municipios dependientes ---------- */
  const [muniQuery, setMuniQuery] = useState("");
  const municipiosOptions = useMemo(() => {
    const list = MUNICIPIOS.filter(m => m.departamento === (form.departamento || ""));
    const nq = norm(muniQuery);
    return nq ? list.filter(m => norm(m.nombre).includes(nq) || m.codigo.includes(nq)) : list;
  }, [MUNICIPIOS, form.departamento, muniQuery]);

  useEffect(() => {
    setMuniQuery("");
    setForm(f => ({ ...f, municipio: "" }));
  }, [form.departamento]);

  /* ---------- Carga de datos: SOLO mi sucursal ---------- */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Pide al servidor la sucursal actual (o primera del usuario)
      const data = await jsonFetch(`${API_BASE}/sucursal/current`, { method: "GET" });
      const r = data?.data || data || null;
      const list = r ? [r] : [];

      if (r?.idsucursal) setWorkingSucursalId(r.idsucursal);

      // filtro client-side por búsqueda (opcional)
      const n = norm(q);
      const filtered = !n ? list : list.filter((x) => {
        const blob = `${x?.nombre || ''} ${x?.codpuntoventamh || ''} ${x?.departamento || ''} ${x?.municipio || ''}`;
        return norm(blob).includes(n);
      });

      setRows(filtered);
      setMeta({ total: filtered.length, page: 1, limit: 10, pages: 1 });
    } catch (e) {
      setError(e?.message || "Error cargando sucursal");
      setRows([]);
      setMeta({ total: 0, page: 1, limit: 10, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  /* ---------- Handlers ---------- */
  const openEdit = useCallback(async (id) => {
    try {
      if (workingSucursalId && id !== workingSucursalId) {
        setError("No autorizado para editar esta sucursal.");
        return;
      }
      setEditingId(id);
      setOpenModal(true);
      setLoading(true);
      const data = await jsonFetch(`${API_BASE}/sucursal/${id}`, { method: "GET" });
      const r = data?.data || data;
      setForm({
        nombre: r?.nombre ?? "",
        telefono: r?.telefono ?? "",
        complemento: r?.complemento ?? "",
        codactividad: r?.codactividad ?? "",
        desactividad: r?.desactividad ?? "",
        tipoestablecimiento: r?.tipoestablecimiento ?? "",
        codestablemh: r?.codestablemh ?? "",
        codpuntoventamh: r?.codpuntoventamh ?? "",
        codpuntoventa: r?.codpuntoventa ?? "",
        departamento: r?.departamento ?? "",
        municipio: r?.municipio ?? "",
        logo: null,
      });
    } catch (e) {
      setError(e.message);
      setOpenModal(false);
    } finally {
      setLoading(false);
    }
  }, [workingSucursalId]);

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }, []);

  const onFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return setForm((s) => ({ ...s, logo: null }));
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setForm((s) => ({ ...s, logo: (b64 || "").split(",").pop() }));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (!editingId) {
        setError("No tienes permiso para crear sucursales.");
        return;
      }

      // No permitimos cambiar el rubro: lo quitamos del payload
      const { codactividad, desactividad, ...rest } = form;
      const body = { ...rest };

      await jsonFetch(`${API_BASE}/sucursal/update/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setOpenModal(false);
      await load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }, [form, editingId, load]);

  /* =========================================
     Render
  ========================================= */
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* overlay móvil */}
      {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-1 h-full">
        {/* Sidebar */}
        <div className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}>
          <Sidebar />
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 bg-white backdrop-blur-md bg-opacity-90 shadow-sm z-20">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center gap-2">
                <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none" onClick={toggleSidebar} aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}>
                  {sidebarOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                </button>
                <h2 className="hidden md:block text-xl font-semibold text-gray-800">Mis Sucursales</h2>
              </div>

              <div className="flex items-center gap-3">
                {user?.name && <span className="hidden sm:block text-sm text-black font-medium truncate max-w-[180px]">{user.name}</span>}
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white font-medium">
                  {user?.name ? user.name.charAt(0) : "U"}
                </div>
              </div>
            </div>
          </header>

          {/* Contenido */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight sm:hidden">Mis Sucursales</h2>

              {/* Botón crear deshabilitado */}
              <button disabled className="px-4 py-2 bg-gray-300 text-white rounded-md shadow-sm w-full sm:w-auto cursor-not-allowed">
                + Nueva (deshabilitado)
              </button>
            </div>

            {/* BUSCADOR */}
            <div className="mb-4">
              <div className="grid grid-cols-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre/códigos/ubicación…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Tabla desktop */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PV MH</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipio</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-4">Cargando…</td></tr>
                    ) : rows?.length ? (
                      rows.map((r) => (
                        <tr key={r.idsucursal} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.idsucursal}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{r.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.codpuntoventamh || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.departamento || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.municipio || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                            {(!workingSucursalId || r.idsucursal === workingSucursalId) && (
                              <button onClick={() => openEdit(r.idsucursal)} className="text-amber-600 hover:text-amber-700" aria-label="Editar"><FaEdit /></button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-6 py-4">Sin resultados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tarjetas móvil */}
            <div className="md:hidden">
              <div className="space-y-4">
                {rows?.length ? rows.map((r) => (
                  <div key={r.idsucursal} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{r.nombre}</h3>
                      <div className="flex space-x-2">
                        {(!workingSucursalId || r.idsucursal === workingSucursalId) && (
                          <button onClick={() => openEdit(r.idsucursal)} className="text-amber-600 hover:text-amber-700" aria-label="Editar"><FaEdit /></button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 space-y-1">
                      <div><span className="font-medium">PV MH: </span>{r.codpuntoventamh || "-"}</div>
                      <div><span className="font-medium">Departamento: </span>{r.departamento || "-"}</div>
                      <div><span className="font-medium">Municipio: </span>{r.municipio || "-"}</div>
                    </div>
                  </div>
                )) : <div className="text-gray-600">Sin resultados</div>}
              </div>
            </div>

            {/* Resumen */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div> Total: <b>{meta.total}</b> • Página <b>{meta.page}</b> de <b>{meta.pages}</b> </div>
              <div className="flex gap-2 opacity-50 select-none">
                <button className="px-3 py-1.5 rounded border" disabled>Anterior</button>
                <button className="px-3 py-1.5 rounded border" disabled>Siguiente</button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}
          </div>

          <Footer />
        </div>
      </div>

      {/* Confirmación de cierre con cambios */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded shadow-md">
            <p className="mb-4 text-black">¿Seguro que quieres descartar los cambios?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancelConfirmModal(false)} className="px-4 py-2 rounded border text-black">No</button>
              <button onClick={confirmDiscard} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Sí, descartar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL editar (sin crear / rubro bloqueado) */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-black">
                {editingId ? `Editar sucursal #${editingId}` : "Editar sucursal"}
              </h2>
              <button onClick={handleCancel} className="p-2 rounded hover:bg-gray-100"><FaTimes /></button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-black">
              <div>
                <label className="block text-sm font-medium">Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" required />
              </div>

              <div>
                <label className="block text-sm font-medium">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Complemento</label>
                <input name="complemento" value={form.complemento} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
              </div>

              {/* Rubro (bloqueado) */}
              <div>
                <label className="block text-sm font-medium">Código de actividad (rubro)</label>
                <input readOnly value={form.codactividad} className="border border-gray-200 rounded w-full p-2 bg-gray-100 text-gray-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium">Descripción de actividad</label>
                <input readOnly value={form.desactividad} className="border border-gray-200 rounded w-full p-2 bg-gray-100 text-gray-700 cursor-not-allowed" />
              </div>

              {/* Depto → Municipio */}
              <div>
                <label className="block text-sm font-medium">Departamento</label>
                <select name="departamento" value={form.departamento} onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value }))} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900">
                  <option value="">-- Seleccionar --</option>
                  {deptosOptions.map((d) => (
                    <option key={d.codigo} value={d.codigo}>{d.codigo} - {d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Municipio</label>
                <input type="text" placeholder="Filtrar municipio…" value={muniQuery} onChange={(e) => setMuniQuery(e.target.value)} className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900" disabled={!form.departamento} />
                <select name="municipio" value={form.municipio} onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" disabled={!form.departamento}>
                  <option value="">{form.departamento ? "-- Seleccionar --" : "Seleccione un departamento"}</option>
                  {municipiosOptions.map((m) => (
                    <option key={`${m.departamento}-${m.codigo}`} value={m.codigo}>{m.codigo} - {m.nombre}</option>
                  ))}
                </select>
              </div>

              {/* MH / otros */}
              <div>
                <label className="block text-sm font-medium">Tipo Establecimiento</label>
                <input name="tipoestablecimiento" value={form.tipoestablecimiento} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium">Código Estable MH</label>
                <input name="codestablemh" value={form.codestablemh} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium">Código Punto Venta MH</label>
                <input name="codpuntoventamh" value={form.codpuntoventamh} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium">Código Punto Venta (interno)</label>
                <input name="codpuntoventa" value={form.codpuntoventa} onChange={onChange} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
              </div>

              {/* Logo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Logo (imagen)</label>
                <input type="file" accept="image/*" onChange={onFile} className="border border-gray-300 rounded w-full p-2 bg-white text-gray-900" />
                <p className="text-xs text-gray-500 mt-1">Se enviará como base64 (sin encabezado).</p>
              </div>

              {/* Botones */}
              <div className="md:col-span-2">
                <button disabled={loading} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  <FaSave /> {loading ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" onClick={handleCancel} className="ml-2 px-4 py-2 rounded border">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   Catálogos (recorta o pega los tuyos completos)
========================================= */

// Departamentos
const DEPARTAMENTOS_DATA = [
  { codigo: "00", nombre: "Otro (Para extranjeros)" },
  { codigo: "01", nombre: "Ahuachapán" },
  { codigo: "02", nombre: "Santa Ana" },
  { codigo: "03", nombre: "Sonsonate" },
  { codigo: "04", nombre: "Chalatenango" },
  { codigo: "05", nombre: "La Libertad" },
  { codigo: "06", nombre: "San Salvador" },
  { codigo: "07", nombre: "Cuscatlán" },
  { codigo: "08", nombre: "La Paz" },
  { codigo: "09", nombre: "Cabañas" },
  { codigo: "10", nombre: "San Vicente" },
  { codigo: "11", nombre: "Usulután" },
  { codigo: "12", nombre: "San Miguel" },
  { codigo: "13", nombre: "Morazán" },
  { codigo: "14", nombre: "La Unión" }
];

// Municipios (pega tu lista completa si la necesitas)
const MUNICIPIOS_DATA = [
  { codigo: "00", nombre: "Otro (Para extranjeros)", departamento: "00" },
  { codigo: "13", nombre: "AHUACHAPAN NORTE", departamento: "01" },
  { codigo: "14", nombre: "AHUACHAPAN CENTRO", departamento: "01" },
  { codigo: "15", nombre: "AHUACHAPAN SUR", departamento: "01" },
  { codigo: "14", nombre: "SANTA ANA NORTE", departamento: "02" },
  { codigo: "15", nombre: "SANTA ANA CENTRO", departamento: "02" },
  // ... pega aquí el resto de tu lista original sin cambios
];
