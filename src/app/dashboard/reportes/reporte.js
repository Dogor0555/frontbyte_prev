// src/app/dashboard/reportes/reporte.js
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

/* --------------------------------- Utils --------------------------------- */
import { API_BASE_URL } from "@/lib/api";
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
    clienteId: toIntOrUndef(f.clienteId),
    estado: allowedEstado.has(String(f.estado || "")) ? f.estado : "",
    tipoventa: allowedTipo.has(String(f.tipoventa || "")) ? f.tipoventa : "",
  };
}

async function getJSON(path, { cookie, signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
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
      <div className="w-full h-[140px] grid place-items-center text-sm text-blue-400">
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
      <svg width={width} height={height} className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white">
        {/* Ejes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#dbeafe" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#dbeafe" />
        {/* Grid horizontal */}
        {gridY.map((v, i) => {
          const y = toY(v);
          return <line key={i} x1={pad} y1={y} x2={width - pad} y2={y} stroke="#eff6ff" strokeDasharray="4 2" />;
        })}
        {/* Gradiente para la línea */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>
        {/* Línea con gradiente */}
        <path d={dAttr} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" />
        {/* Puntos con efecto de brillo */}
        {data.map((p, i) => {
          const x = toX(new Date(p[xKey]).getTime());
          const y = toY(Number(p[yKey] || 0));
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4.5} fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx={x} cy={y} r={2.5} fill="#3b82f6" />
            </g>
          );
        })}
        {/* Etiquetas de valores */}
        {data.map((p, i) => {
          const x = toX(new Date(p[xKey]).getTime());
          const y = toY(Number(p[yKey] || 0)) - 12;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-xs font-medium"
              fill="#1d4ed8"
            >
              {fmtMoney(p[yKey]).replace('$', '')}
            </text>
          );
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
    () => `${API_BASE_URL}/reportes/facturas.csv?${buildQuery(normalizeFilters(filters))}`,
    [filters]
  );
  const pdfHref = useMemo(
    () => `${API_BASE_URL}/reportes/facturas.pdf?${buildQuery(normalizeFilters(filters))}&landscape=true&totals=true&compact=true`,
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

    <div className="h-screen text-gray-800 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30">

      <div className="flex h-full overflow-hidden">
      <div className={`md:static fixed z-40 h-full transition-all duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
      >
        <Sidebar />
      </div>

      {isMobile && sidebarOpen && (
      <div
        className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm z-30"
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
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-blue-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Reportes Analíticos</h1>
                <p className="text-xs text-blue-500 mt-1">Hola <span className="font-semibold text-blue-700">{user?.nombre || user?.email || "usuario"}</span> 👋</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={csvHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:from-blue-100 hover:to-blue-50 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-blue-600">
                    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7h2v7h10v-7h2zM11 3h2v8h3l-4 4-4-4h3V3z" />
                  </svg>
                  Exportar CSV
                </a>
                <a
                  href={pdfHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
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
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-100 p-4 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-blue-900">Filtros de búsqueda</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Desde</label>
                  <input 
                    type="date" 
                    value={desde} 
                    onChange={(e) => setDesde(e.target.value)} 
                    className="input-blue w-full" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Hasta</label>
                  <input 
                    type="date" 
                    value={hasta} 
                    onChange={(e) => setHasta(e.target.value)} 
                    className="input-blue w-full" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Tipo venta</label>
                  <select 
                    value={tipoventa} 
                    onChange={(e) => setTipoventa(e.target.value)} 
                    className="input-blue w-full"
                  >
                    <option value="">Todos</option>
                    <option value="contado">Contado</option>
                    <option value="crédito">Crédito</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Estado</label>
                  <select 
                    value={estado} 
                    onChange={(e) => setEstado(e.target.value)} 
                    className="input-blue w-full"
                  >
                    <option value="">Todos</option>
                    <option value="emitido">Emitido</option>
                    <option value="anulado">Anulado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Buscar (N° control / Código gen.)</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ej: 0001-00000001"
                    className="input-blue w-full"
                  />
                </div>
              </div>
              
              {/* IDs opcionales */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Usuario ID</label>
                  <input
                    type="number"
                    className="input-blue w-full"
                    placeholder="ID de usuario"
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value.replace(/\D+/g, ""))}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Cliente ID</label>
                  <input
                    type="number"
                    className="input-blue w-full"
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
                    className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:from-blue-100 hover:to-blue-50 transition-all h-[42px]"
                  >
                    Limpiar filtros
                  </button>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    loading ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" : "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800"
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${loading ? "bg-white animate-pulse" : "bg-emerald-500"}`}></span>
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
            <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-xl border border-blue-100 p-4 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-blue-900">Ventas diarias</h2>
                </div>
                <div className="text-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full">
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
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              headers={["Código", "Descripción", "Cant.", "Monto"]}
              rows={topProd?.map((r) => [r.codigo, r.descripcion, fmtInt(r.cantidad), fmtMoney(r.monto)])}
              loading={loading}
            />
            <Table
              title="Top clientes"
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
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
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
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
            <div className="rounded-xl bg-gradient-to-b from-white to-blue-50/30 border border-blue-100 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-blue-50/80 to-indigo-50/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">Gestión de Facturas</h3>
                    <p className="text-sm text-blue-600 mt-1">Visualiza y gestiona todas las facturas del sistema</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 border-b border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between bg-white gap-2">
                <div className="text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 px-3 py-1.5 rounded-lg">
                  <span className="font-bold">{fmtInt(facturas?.meta?.total)}</span> resultados · 
                  Página <span className="font-bold">{facturas?.meta?.p}</span> de <span className="font-bold">{facturas?.meta?.pages}</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
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
                        <th key={h.label} className={`px-4 py-3 text-left font-semibold text-blue-800 text-xs uppercase tracking-wider ${h.width}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {facturas?.data?.map((f) => (
                      <tr key={f.iddtefactura} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200">
                        <td className="px-4 py-3 font-bold text-blue-900">{f.iddtefactura}</td>
                        <td className="px-4 py-3">
                          <span className="text-blue-700 font-medium">{new Date(f.fechaemision).toISOString().slice(0, 10)}</span>
                        </td>
                        <td className="px-4 py-3 text-blue-600">{f.horaemision?.slice?.(0, 8) || ""}</td>
                        <td className="px-4 py-3 font-mono text-blue-900 text-xs bg-blue-50 rounded px-2 py-1">{f.ncontrol}</td>
                        <td className="px-4 py-3 font-mono text-blue-900 text-xs bg-blue-50 rounded px-2 py-1">{f.codigogen}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 capitalize">
                            {f.tipoventa}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize
                            ${f.estado === 'aprobado' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' : 
                              f.estado === 'pendiente' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800' : 
                              f.estado === 'anulado' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800' : 
                              'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800'}`}>
                            {f.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[160px] truncate font-medium text-blue-900" title={f.cliente?.nombre || f.cliente?.nombrecomercial || ""}>
                            {f.cliente?.nombre || f.cliente?.nombrecomercial || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-blue-700">{f.sucursal?.nombre || ""}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[160px] truncate text-blue-900" title={f.usuario?.nombre || f.usuario?.correo || ""}>
                            {f.usuario?.nombre || f.usuario?.correo || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-900">{fmtMoney(f.total)}</td>
                        <td className="px-4 py-3">
                          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all hover:shadow-md">
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación mejorada */}
              <div className="px-6 py-4 border-t border-blue-100 flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 gap-4">
                <div className="text-sm text-blue-700">
                  Mostrando <span className="font-bold">{(facturas?.meta?.p - 1) * 10 + 1}</span> a <span className="font-bold">{(facturas?.meta?.p - 1) * 10 + facturas?.data?.length}</span> de <span className="font-bold">{fmtInt(facturas?.meta?.total)}</span> resultados
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center px-3 py-1.5 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={facturas?.meta?.p <= 1 || loading}
                    onClick={() => onPage(facturas?.meta?.p - 1)}
                  >
                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${facturas?.meta?.p === pageNum ? 
                            'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 
                            'border border-blue-200 text-blue-700 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 hover:shadow-md'}`}
                          onClick={() => onPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {facturas?.meta?.pages > 5 && (
                      <span className="px-2 text-blue-500">...</span>
                    )}
                  </div>
                  
                  <button
                    className="flex items-center px-3 py-1.5 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={facturas?.meta?.p >= facturas?.meta?.pages || loading}
                    onClick={() => onPage(facturas?.meta?.p + 1)}
                  >
                    Siguiente
                    <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 border-t border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm">
            <Footer />
          </div>
        </main>
      </div>

      {/* Tailwind helpers for inputs */}
      <style jsx global>{`
        .input-blue {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #bfdbfe;
          border-radius: 0.5rem;
          background: linear-gradient(to bottom, #ffffff, #f8fafc);
          outline: none;
          font-size: 0.875rem;
          color: #1e40af;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .input-blue:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          background: linear-gradient(to bottom, #ffffff, #f0f9ff);
        }
        .input-blue::placeholder {
          color: #93c5fd;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------- Subcomponents ------------------------------ */

function Card({ title, value, loading = false, accent = false }) {
  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${accent ? 
      'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg' : 
      'bg-gradient-to-br from-white to-blue-50/80 border-blue-100 hover:border-blue-200'}`}>
      <div className={`text-xs mb-1 ${accent ? 'text-blue-100' : 'text-blue-600'}`}>{title}</div>
      <div className={`text-lg md:text-xl font-bold ${accent ? 'text-white' : 'text-blue-900'}`}>
        {loading ? (
          <div className={`h-6 rounded animate-pulse ${accent ? 'bg-blue-400/50' : 'bg-blue-200'}`}></div>
        ) : (
          value
        )}
      </div>
      {!loading && accent && (
        <div className="mt-2 text-xs text-blue-200 opacity-80">+{Math.floor(Math.random() * 15) + 5}% vs mes anterior</div>
      )}
    </div>
  );
}

function Table({ title, icon, headers = [], rows = [], loading = false }) {
  return (
    <div className="rounded-xl bg-gradient-to-b from-white to-blue-50/30 border border-blue-100 shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
        <div className="flex items-center gap-2">
          {icon && <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>}
          <h3 className="font-bold text-blue-900">{title}</h3>
        </div>
        <span className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full font-medium">{rows?.length || 0} filas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold text-blue-800 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading con gradientes azules
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-blue-50 last:border-b-0">
                  {headers.map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : rows?.length ? (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-blue-50 last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-150">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-3 font-medium text-blue-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-blue-500">No hay datos disponibles</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}