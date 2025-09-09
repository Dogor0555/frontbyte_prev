// src/app/dashboard/reportes/reporte.js
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

/* --------------------------------- Utils --------------------------------- */
const API_BASE = "http://localhost:3000";
const fmtMoney = (n = 0) =>
  Number(n || 0).toLocaleString("es-SV", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const fmtInt = (n = 0) => Number(n || 0).toLocaleString("es-SV");

const toISO = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const buildQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

// Asegura que IDs sean enteros positivos y filtra valores no permitidos
function normalizeFilters(f = {}) {
  const toIntOrUndef = (x) => {
    const n = Number(x);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const allowedEstado = new Set(["emitido", "anulado", ""]);
  const allowedTipo = new Set(["contado", "crédito", ""]);

  return {
    ...f,
    usuarioId: toIntOrUndef(f.usuarioId),
    // sucursalId: eliminado (el backend filtra por req.user)
    clienteId: toIntOrUndef(f.clienteId),
    estado: allowedEstado.has(String(f.estado || "")) ? f.estado : "",
    tipoventa: allowedTipo.has(String(f.tipoventa || "")) ? f.tipoventa : "",
  };
}

async function getJSON(path, { cookie, signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Error HTTP ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

function useDebouncedValue(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ------------------------------- Mini Chart ------------------------------ */
/** Dibujamos un pequeño gráfico de líneas con SVG (sin dependencias). */
function LineChart({ data = [], xKey = "fecha", yKey = "monto", height = 140 }) {
  const pad = 24;
  const width = Math.max(360, (data?.length || 1) * 28);

  if (!data?.length) {
    return (
      <div className="w-full h-[140px] grid place-items-center text-sm text-muted-foreground">
        Sin datos para el rango seleccionado
      </div>
    );
  }

  const xs = data.map((d) => new Date(d[xKey]).getTime());
  const ys = data.map((d) => Number(d[yKey] || 0));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys) || 1;

  const toX = (t) => pad + ((width - pad * 2) * (t - minX)) / (maxX - minX || 1);
  const toY = (v) => height - pad - ((height - pad * 2) * (v - minY)) / (maxY - minY || 1);

  const dAttr = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(new Date(p[xKey]).getTime())} ${toY(Number(p[yKey] || 0))}`)
    .join(" ");

  const gridY = Array.from({ length: 3 }, (_, i) => Math.round((maxY * (i + 1)) / 3));

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="rounded-xl border border-gray-200">
        {/* Ejes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e5e7eb" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e5e7eb" />
        {/* Grid horizontal */}
        {gridY.map((v, i) => {
          const y = toY(v);
          return <line key={i} x1={pad} y1={y} x2={width - pad} y2={y} stroke="#f1f5f9" />;
        })}
        {/* Línea */}
        <path d={dAttr} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        {/* Puntos */}
        {data.map((p, i) => {
          const x = toX(new Date(p[xKey]).getTime());
          const y = toY(Number(p[yKey] || 0));
          return <circle key={i} cx={x} cy={y} r={3} fill="#2563eb" />;
        })}
      </svg>
    </div>
  );
}



/* --------------------------------- View ---------------------------------- */

export default function Reportes({ user, cookie, hasHaciendaToken, haciendaStatus }) {
  /* ------------------------------- Filtros UI ------------------------------- */
  const today = useMemo(() => toISO(new Date()), []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const startMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  }, []);

  // log para ver usuario desde las props
console.log("Reporte - User:", user);

  const [desde, setDesde] = useState(startMonth);
  const [hasta, setHasta] = useState(today);
  const [usuarioId, setUsuarioId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado] = useState(""); // "emitido" | "anulado"
  const [tipoventa, setTipoventa] = useState(""); // "contado" | "crédito"
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);

  const filters = useMemo(
    () => ({
      desde,
      hasta,
      usuarioId,
      // sucursalId eliminado (el backend filtra por req.user)
      clienteId,
      estado,
      tipoventa,
      search: debouncedSearch,
    }),
    [desde, hasta, usuarioId, clienteId, estado, tipoventa, debouncedSearch]
  );

  /* ------------------------------ Data states ------------------------------ */
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [topProd, setTopProd] = useState([]);
  const [topCli, setTopCli] = useState([]);
  const [trib, setTrib] = useState([]);
  const [facturas, setFacturas] = useState({ data: [], meta: { p: 1, pages: 1, limit: 20, total: 0 } });

  const abortRef = useRef();

  const fetchAll = useCallback(
    async (page = 1) => {
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const safeFilters = normalizeFilters(filters);
      const q = buildQuery({ ...safeFilters, p: page, limit: facturas?.meta?.limit || 20 });
      try {
        const [r1, r2, r3, r4, r5, r6] = await Promise.all([
          getJSON(`/reportes/resumen?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/ventas-diarias?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/top-productos?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/top-clientes?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/tributos?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/facturas?${q}`, { cookie, signal: controller.signal }),
        ]);

        setResumen(r1?.data || null);
        setVentas(r2?.data || []);
        setTopProd(r3?.data || []);
        setTopCli(r4?.data || []);
        setTrib(r5?.data || []);
        setFacturas({ data: r6?.data || [], meta: r6?.meta || { p: 1, pages: 1, limit: 20, total: 0 } });
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, cookie, facturas?.meta?.limit]
  );

  useEffect(() => {
    fetchAll(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const onPage = (p) => {
    fetchAll(p);
  };

  const csvHref = useMemo(
    () => `${API_BASE}/reportes/facturas.csv?${buildQuery(normalizeFilters(filters))}`,
    [filters]
  );
  const pdfHref = useMemo(
    () => `${API_BASE}/reportes/facturas.pdf?${buildQuery(normalizeFilters(filters))}&landscape=true&totals=true&compact=true`,
    [filters]
  );

  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

  /* --------------------------------- UI --------------------------------- */

  return (

    <div className="h-screen bg-gray-50">

      <div className="flex h-full overflow-hidden">
      <div className={`md:static fixed z-40 h-full transition-all duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
      >
        <Sidebar />
      </div>

      {isMobile && sidebarOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={() => setSidebarOpen(false)}
      ></div>
      )}

        <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Navbar */}
        <Navbar 
          user={user}
          hasHaciendaToken={hasHaciendaToken}
          haciendaStatus={haciendaStatus}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Reportes</h1>
                <p className="text-xs text-gray-500">Hola {user?.nombre || user?.email || "usuario"} 👋</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={csvHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-gray-600">
                    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7h2v7h10v-7h2zM11 3h2v8h3l-4 4-4-4h3V3z" />
                  </svg>
                  Exportar CSV
                </a>
                <a
                  href={pdfHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar PDF
                </a>
              </div>
            </div>
          </header>

          {/* Filtros */}
          <section className="max-w-7xl mx-auto w-full px-4 py-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Filtros de búsqueda</h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input 
                    type="date" 
                    value={desde} 
                    onChange={(e) => setDesde(e.target.value)} 
                    className="input w-full" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input 
                    type="date" 
                    value={hasta} 
                    onChange={(e) => setHasta(e.target.value)} 
                    className="input w-full" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo venta</label>
                  <select 
                    value={tipoventa} 
                    onChange={(e) => setTipoventa(e.target.value)} 
                    className="input w-full"
                  >
                    <option value="">Todos</option>
                    <option value="contado">Contado</option>
                    <option value="crédito">Crédito</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select 
                    value={estado} 
                    onChange={(e) => setEstado(e.target.value)} 
                    className="input w-full"
                  >
                    <option value="">Todos</option>
                    <option value="emitido">Emitido</option>
                    <option value="anulado">Anulado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar (N° control / Código gen.)</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ej: 0001-00000001"
                    className="input w-full"
                  />
                </div>
              </div>
              
              {/* IDs opcionales */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario ID</label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="ID de usuario"
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value.replace(/\D+/g, ""))}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente ID</label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="ID de cliente"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value.replace(/\D+/g, ""))}
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setUsuarioId("");
                      setClienteId("");
                      setEstado("");
                      setTipoventa("");
                      setSearch("");
                      setDesde(startMonth);
                      setHasta(today);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors h-[42px]"
                  >
                    Limpiar filtros
                  </button>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    loading ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${loading ? "bg-blue-500 animate-pulse" : "bg-green-500"}`}></span>
                    {loading ? "Cargando…" : "Listo"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Resumen */}
          <section className="max-w-7xl mx-auto w-full px-4 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card title="Total facturas" value={fmtInt(resumen?.totalFacturas)} loading={loading} />
              <Card title="Clientes únicos" value={fmtInt(resumen?.clientesUnicos)} loading={loading} />
              <Card title="Total monto" value={fmtMoney(resumen?.totalMonto)} loading={loading} accent={true} />
              <Card title="Contado" value={fmtMoney(resumen?.totalContado)} loading={loading} />
              <Card title="Crédito" value={fmtMoney(resumen?.totalCredito)} loading={loading} />
            </div>
          </section>

          {/* Ventas diarias */}
          <section className="max-w-7xl mx-auto w-full px-4 py-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">Ventas diarias</h2>
                <div className="text-sm text-gray-500">
                  {ventas?.length || 0} días · {fmtMoney(ventas.reduce((a, b) => a + Number(b?.monto || 0), 0))} vendido
                </div>
              </div>
              <LineChart data={ventas} xKey="fecha" yKey="monto" />
            </div>
          </section>

          {/* Top productos y clientes */}
          <section className="max-w-7xl mx-auto w-full px-4 grid md:grid-cols-2 gap-4">
            <Table
              title="Top productos"
              headers={["Código", "Descripción", "Cant.", "Monto"]}
              rows={topProd?.map((r) => [r.codigo, r.descripcion, fmtInt(r.cantidad), fmtMoney(r.monto)])}
              loading={loading}
            />
            <Table
              title="Top clientes"
              headers={["ID", "Nombre", "Comercial", "Facturas", "Monto"]}
              rows={topCli?.map((r) => [
                r.idcliente ?? "",
                r.nombre ?? "",
                r.nombrecomercial ?? "",
                fmtInt(r.facturas),
                fmtMoney(r.monto),
              ])}
              loading={loading}
            />
          </section>

          {/* Tributos */}
          <section className="max-w-7xl mx-auto w-full px-4 py-4">
            <Table
              title="Tributos"
              headers={["Código", "Descripción", "Facturas", "Detalles", "Total"]}
              rows={trib?.map((r) => [
                r.codigo,
                r.descripcion,
                fmtMoney(r.valor_factura),
                fmtMoney(r.valor_detalle),
                fmtMoney(r.valor_total),
              ])}
              loading={loading}
            />
          </section>

          {/* Facturas */}
          <section className="max-w-7xl mx-auto w-full px-4 pb-10">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50 gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Gestión de Facturas</h3>
                  <p className="text-sm text-gray-500 mt-1">Visualiza y gestiona todas las facturas del sistema</p>
                </div>
              </div>
              
              <div className="px-6 py-3 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-white gap-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{fmtInt(facturas?.meta?.total)}</span> resultados · 
                  Página <span className="font-medium">{facturas?.meta?.p}</span> de <span className="font-medium">{facturas?.meta?.pages}</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        { label: "ID", width: "w-16" },
                        { label: "Fecha", width: "w-24" },
                        { label: "Hora", width: "w-20" },
                        { label: "N° Control", width: "w-28" },
                        { label: "Código Gen.", width: "w-28" },
                        { label: "Tipo", width: "w-24" },
                        { label: "Estado", width: "w-24" },
                        { label: "Cliente", width: "w-40" },
                        { label: "Sucursal", width: "w-32" },
                        { label: "Usuario", width: "w-40" },
                        { label: "Total", width: "w-24" },
                        { label: "", width: "w-16" },
                      ].map((h) => (
                        <th key={h.label} className={`px-4 py-3 text-left font-medium text-gray-700 text-xs uppercase tracking-wider ${h.width}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {facturas?.data?.map((f) => (
                      <tr key={f.iddtefactura} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 font-medium text-gray-900">{f.iddtefactura}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700">{new Date(f.fechaemision).toISOString().slice(0, 10)}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{f.horaemision?.slice?.(0, 8) || ""}</td>
                        <td className="px-4 py-3 font-mono text-gray-800 text-xs">{f.ncontrol}</td>
                        <td className="px-4 py-3 font-mono text-gray-800 text-xs">{f.codigogen}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {f.tipoventa}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${f.estado === 'aprobado' ? 'bg-green-100 text-green-800' : 
                              f.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                              f.estado === 'anulado' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {f.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[160px] truncate" title={f.cliente?.nombre || f.cliente?.nombrecomercial || ""}>
                            {f.cliente?.nombre || f.cliente?.nombrecomercial || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{f.sucursal?.nombre || ""}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[160px] truncate" title={f.usuario?.nombre || f.usuario?.correo || ""}>
                            {f.usuario?.nombre || f.usuario?.correo || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{fmtMoney(f.total)}</td>
                        <td className="px-4 py-3">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación mejorada */}
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between bg-white gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando <span className="font-medium">{(facturas?.meta?.p - 1) * 10 + 1}</span> a <span className="font-medium">{(facturas?.meta?.p - 1) * 10 + facturas?.data?.length}</span> de <span className="font-medium">{fmtInt(facturas?.meta?.total)}</span> resultados
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={facturas?.meta?.p <= 1 || loading}
                    onClick={() => onPage(facturas?.meta?.p - 1)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Anterior
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, facturas?.meta?.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${facturas?.meta?.p === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => onPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {facturas?.meta?.pages > 5 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </div>
                  
                  <button
                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={facturas?.meta?.p >= facturas?.meta?.pages || loading}
                    onClick={() => onPage(facturas?.meta?.p + 1)}
                  >
                    Siguiente
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 border-t bg-white">
            <Footer />
          </div>
        </main>
      </div>

      {/* Tailwind helpers for inputs */}
      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          outline: none;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </div>
  );
}

/* ------------------------------- Subcomponents ------------------------------ */

function Card({ title, value, loading = false, accent = false }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${accent ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} ${loading ? 'opacity-70' : ''}`}>
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className={`text-lg md:text-xl font-semibold ${accent ? 'text-blue-700' : 'text-gray-800'}`}>
        {loading ? (
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function Table({ title, headers = [], rows = [], loading = false }) {
  return (
    <div className="rounded-xl bg-white border overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-500">{rows?.length || 0} filas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {headers.map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : rows?.length ? (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-2.5 text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-gray-500">
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}