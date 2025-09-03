// src/app/dashboard/reportes/reporte.js
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";

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

export default function Reportes({ user, cookie }) {
  /* ------------------------------- Filtros UI ------------------------------- */
  const today = useMemo(() => toISO(new Date()), []);
  const startMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  }, []);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
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
      // sucursalId eliminado (el backend ignora y filtra por req.user)
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

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full overflow-hidden">
        <aside className="hidden md:block w-64 shrink-0 border-r bg-white h-full sticky top-0 ">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">Reportes</h1>
                <p className="text-xs text-gray-500">Hola {user?.nombre || user?.email || "usuario"} 👋</p>
              </div>
              <a
                href={csvHref}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
              >
                Exportar CSV
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7h2v7h10v-7h2zM11 3h2v8h3l-4 4-4-4h3V3z" />
                </svg>
              </a>
              <a
                href={pdfHref}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
                target="_blank"
                rel="noreferrer"
              >
                Exportar PDF
              </a>
            </div>
          </header>

          {/* Filtros */}
          <section className="max-w-7xl mx-auto w-full px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="col-span-1">
                <label className="text-xs text-gray-500">Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input" />
              </div>
              <div className="col-span-1">
                <label className="text-xs text-gray-500">Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input" />
              </div>
              <div className="col-span-1">
                <label className="text-xs text-gray-500">Tipo venta</label>
                <select value={tipoventa} onChange={(e) => setTipoventa(e.target.value)} className="input">
                  <option value="">Todos</option>
                  <option value="contado">Contado</option>
                  <option value="crédito">Crédito</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-xs text-gray-500">Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input">
                  <option value="">Todos</option>
                  <option value="emitido">Emitido</option>
                  <option value="anulado">Anulado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Buscar (N° control / Código gen.)</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ej: 0001-00000001"
                  className="input"
                />
              </div>
            </div>
            {/* IDs opcionales */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-3">
              <input
                type="number"
                className="input"
                placeholder="Usuario ID"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value.replace(/\D+/g, ""))}
              />
              <input
                type="number"
                className="input"
                placeholder="Cliente ID"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value.replace(/\D+/g, ""))}
              />
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
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
              >
                Limpiar filtros
              </button>
              <div className="col-span-2 flex items-center text-sm text-gray-500">
                {loading ? "Cargando…" : "Listo"}
              </div>
            </div>
          </section>

          {/* Resumen */}
          <section className="max-w-7xl mx-auto w-full px-4 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card title="Total facturas" value={fmtInt(resumen?.totalFacturas)} />
              <Card title="Clientes únicos" value={fmtInt(resumen?.clientesUnicos)} />
              <Card title="Total monto" value={fmtMoney(resumen?.totalMonto)} />
              <Card title="Contado" value={fmtMoney(resumen?.totalContado)} />
              <Card title="Crédito" value={fmtMoney(resumen?.totalCredito)} />
            </div>
          </section>

          {/* Ventas diarias */}
          <section className="max-w-7xl mx-auto w-full px-4 py-4">
            <h2 className="font-semibold mb-2">Ventas diarias</h2>
            <div className="rounded-xl bg-white border p-3">
              <LineChart data={ventas} xKey="fecha" yKey="monto" />
              <div className="mt-2 text-xs text-gray-500">
                {ventas?.length || 0} días ·{" "}
                {fmtMoney(ventas.reduce((a, b) => a + Number(b?.monto || 0), 0))} vendido
              </div>
            </div>
          </section>

          {/* Top productos y clientes */}
          <section className="max-w-7xl mx-auto w-full px-4 grid md:grid-cols-2 gap-4">
            <Table
              title="Top productos"
              headers={["Código", "Descripción", "Cant.", "Monto"]}
              rows={topProd?.map((r) => [r.codigo, r.descripcion, fmtInt(r.cantidad), fmtMoney(r.monto)])}
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
            />
          </section>

          {/* Facturas */}
          <section className="max-w-7xl mx-auto w-full px-4 pb-10">
            <div className="rounded-xl bg-white border">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold">Facturas</h3>
                <div className="text-xs text-gray-500">
                  {fmtInt(facturas?.meta?.total)} resultados · página {facturas?.meta?.p} de {facturas?.meta?.pages}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "ID",
                        "Fecha",
                        "Hora",
                        "N° Control",
                        "Código Gen.",
                        "Tipo",
                        "Estado",
                        "Cliente",
                        "Sucursal",
                        "Usuario",
                        "Total",
                      ].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facturas?.data?.map((f) => (
                      <tr key={f.iddtefactura} className="odd:bg-white even:bg-gray-50">
                        <td className="px-3 py-2">{f.iddtefactura}</td>
                        <td className="px-3 py-2">{new Date(f.fechaemision).toISOString().slice(0, 10)}</td>
                        <td className="px-3 py-2">{f.horaemision?.slice?.(0, 8) || ""}</td>
                        <td className="px-3 py-2">{f.ncontrol}</td>
                        <td className="px-3 py-2">{f.codigogen}</td>
                        <td className="px-3 py-2 capitalize">{f.tipoventa}</td>
                        <td className="px-3 py-2 capitalize">{f.estado}</td>
                        <td className="px-3 py-2">{f.cliente?.nombre || f.cliente?.nombrecomercial || ""}</td>
                        <td className="px-3 py-2">{f.sucursal?.nombre || ""}</td>
                        <td className="px-3 py-2">{f.usuario?.nombre || f.usuario?.correo || ""}</td>
                        <td className="px-3 py-2 font-medium">{fmtMoney(f.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  disabled={facturas?.meta?.p <= 1 || loading}
                  onClick={() => onPage(facturas?.meta?.p - 1)}
                >
                  ← Anterior
                </button>
                <div className="text-xs text-gray-500">
                  Página {facturas?.meta?.p} / {facturas?.meta?.pages}
                </div>
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  disabled={facturas?.meta?.p >= facturas?.meta?.pages || loading}
                  onClick={() => onPage(facturas?.meta?.p + 1)}
                >
                  Siguiente →
                </button>
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
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          outline: none;
        }
        .input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.35);
        }
      `}</style>
    </div>
  );
}

/* ------------------------------- Subcomponents ------------------------------ */

function Card({ title, value }) {
  return (
    <div className="rounded-xl bg-white border p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg md:text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Table({ title, headers = [], rows = [] }) {
  return (
    <div className="rounded-xl bg-white border overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{rows?.length || 0} filas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2">
                      {c}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-3 py-6 text-center text-gray-500">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
