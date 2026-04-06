"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import {
  FaFilePdf,
  FaFileCsv,
  FaChartLine,
  FaUsers,
  FaBoxes,
  FaFileInvoice,
  FaBuilding,
  FaUserTie,
  FaCertificate,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaArrowLeft,
  FaArrowRight,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaReceipt,
  FaCreditCard,
  FaExchangeAlt,
  FaFileExport,
  FaRegFileAlt,
  FaTag,
  FaPercent,
  FaSortAmountDown,
} from "react-icons/fa";

import { API_BASE_URL } from "@/lib/api";

/* --------------------------------- Utils --------------------------------- */
const fmtMoney = (n = 0) =>
  Number(n || 0).toLocaleString("es-SV", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const fmtInt = (n = 0) => Number(n || 0).toLocaleString("es-SV");

const toISO = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const buildQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

function normalizeFilters(f = {}) {
  const toIntOrUndef = (x) => {
    const n = Number(x);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const allowedEstado = new Set(["emitido", "anulado", "TRANSMITIDO", "CONTINGENCIA", ""]);
  const allowedTipo = new Set(["contado", "crédito", ""]);
  const allowedTipodte = new Set(["01", "03", "04", "05", "06", "11", "14", ""]);

  return {
    ...f,
    usuarioId: toIntOrUndef(f.usuarioId),
    clienteId: toIntOrUndef(f.clienteId),
    estado: allowedEstado.has(String(f.estado || "")) ? f.estado : "",
    tipoventa: allowedTipo.has(String(f.tipoventa || "")) ? f.tipoventa : "",
    tipodte: allowedTipodte.has(String(f.tipodte || "")) ? f.tipodte : "",
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

/* ------------------------------- Line Chart ------------------------------ */
function LineChart({ data = [], xKey = "fecha", yKey = "monto", height = 160 }) {
  const pad = { top: 10, right: 10, bottom: 30, left: 50 };
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width));
    ro.observe(svgRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  if (!data?.length) {
    return (
      <div className="w-full h-[160px] grid place-items-center">
        <div className="text-center">
          <FaChartLine className="text-gray-300 text-3xl mx-auto mb-2" />
          <p className="text-xs text-gray-400">Sin datos para mostrar</p>
        </div>
      </div>
    );
  }

  const w = containerWidth;
  const xs = data.map((d) => new Date(d[xKey]).getTime());
  const ys = data.map((d) => Number(d[yKey] || 0));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = 0, maxY = Math.max(...ys) || 1;

  const toX = (t) => pad.left + ((w - pad.left - pad.right) * (t - minX)) / (maxX - minX || 1);
  const toY = (v) => pad.top + ((height - pad.top - pad.bottom) * (1 - (v - minY) / (maxY - minY || 1)));

  const pts = data.map((p) => [toX(new Date(p[xKey]).getTime()), toY(Number(p[yKey] || 0))]);
  const dAttr = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaAttr = `${dAttr} L ${pts[pts.length - 1][0]} ${height - pad.bottom} L ${pts[0][0]} ${height - pad.bottom} Z`;

  const yTicks = 4;
  return (
    <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="ag1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = pad.top + ((height - pad.top - pad.bottom) * i) / yTicks;
        const val = maxY - (maxY * i) / yTicks;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
            <text x={pad.left - 4} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="9">
              {val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(0)}`}
            </text>
          </g>
        );
      })}

      {data.length <= 14 && pts.map(([x], i) => (
        <text key={i} x={x} y={height - 5} textAnchor="middle" fill="#9ca3af" fontSize="8">
          {new Date(data[i][xKey]).getDate()}
        </text>
      ))}

      <path d={areaAttr} fill="url(#ag1)" />
      <path d={dAttr} fill="none" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="white" stroke="#3b82f6" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

/* --------------------------- Bar Chart --------------------------- */
function BarChart({ data = [], nameKey = "nombre", valueKey = "monto" }) {
  if (!data?.length) {
    return (
      <div className="h-full grid place-items-center py-6">
        <div className="text-center">
          <FaUsers className="text-gray-300 text-3xl mx-auto mb-2" />
          <p className="text-xs text-gray-400">Sin datos para mostrar</p>
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => Number(b[valueKey] || 0) - Number(a[valueKey] || 0)).slice(0, 10);
  const maxVal = Math.max(...sorted.map((d) => Number(d[valueKey] || 0))) || 1;

  const colors = [
    "#3b82f6", "#6366f1", "#06b6d4", "#8b5cf6", "#0ea5e9",
    "#4f46e5", "#14b8a6", "#2563eb", "#7c3aed", "#0891b2",
  ];

  return (
    <div className="space-y-2.5">
      {sorted.map((item, i) => {
        const value = Number(item[valueKey] || 0);
        const pct = (value / maxVal) * 100;
        const name = String(item[nameKey] || item.nombrecomercial || "Sin nombre");
        const short = name.length > 22 ? name.slice(0, 22) + "…" : name;

        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-bold text-white rounded px-1.5 py-0.5 flex-shrink-0"
                  style={{ backgroundColor: colors[i] }}>
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-gray-700 truncate" title={name}>{short}</span>
              </div>
              <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: colors[i] }}>
                {fmtMoney(value)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: colors[i] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Componente Principal ---------------------------------- */

export default function Reportes({ user, cookie, hasHaciendaToken, haciendaStatus }) {
  const today = useMemo(() => toISO(new Date()), []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [empresa, setEmpresa] = useState(null);
  const [empleado, setEmpleado] = useState(null);

  // ========== FILTROS ==========
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
  });

  const [tipoFiltroFecha, setTipoFiltroFecha] = useState("mes");
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  });
  const [hasta, setHasta] = useState(today);
  const [busquedaRapida, setBusquedaRapida] = useState("");

  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [usuarioId, setUsuarioId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoventa, setTipoventa] = useState("");
  const [tipodte, setTipodte] = useState("");

  const debouncedBusqueda = useDebouncedValue(busquedaRapida, 500);

  useEffect(() => {
    if (tipoFiltroFecha === "mes" && mesSeleccionado) {
      const [year, month] = mesSeleccionado.split("-").map(Number);
      setDesde(toISO(new Date(year, month - 1, 1)));
      setHasta(toISO(new Date(year, month, 0)));
    }
  }, [mesSeleccionado, tipoFiltroFecha]);

  const filters = useMemo(
    () => ({ desde, hasta, usuarioId, clienteId, estado, tipoventa, tipodte, search: debouncedBusqueda }),
    [desde, hasta, usuarioId, clienteId, estado, tipoventa, tipodte, debouncedBusqueda]
  );

  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [resumenPorTipo, setResumenPorTipo] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [topProd, setTopProd] = useState([]);
  const [topCli, setTopCli] = useState([]);
  const [trib, setTrib] = useState([]);
  const [facturas, setFacturas] = useState({ data: [], meta: { p: 1, pages: 1, limit: 20, total: 0 } });

  const abortRef = useRef();

  useEffect(() => {
    const empresaData = localStorage.getItem("empresa");
    const empleadoData = localStorage.getItem("empleado");
    if (empresaData) setEmpresa(JSON.parse(empresaData));
    if (empleadoData) setEmpleado(JSON.parse(empleadoData));
  }, []);

  const fetchAll = useCallback(
    async (page = 1) => {
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const safeFilters = normalizeFilters(filters);
      const q = buildQuery({ ...safeFilters, p: page, limit: facturas?.meta?.limit || 20 });
      try {
        const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
          getJSON(`/reportes/resumen?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/ventas-diarias?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/top-productos?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/top-clientes?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/tributos?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/facturas?${q}`, { cookie, signal: controller.signal }),
          getJSON(`/reportes/resumen-por-tipo?${q}`, { cookie, signal: controller.signal }),
        ]);

        setResumen(r1?.data || null);
        setVentas(r2?.data || []);
        setTopProd(r3?.data || []);
        setTopCli(r4?.data || []);
        setTrib(r5?.data || []);
        setFacturas({ data: r6?.data || [], meta: r6?.meta || { p: 1, pages: 1, limit: 20, total: 0 } });
        setResumenPorTipo(r7?.data || null);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [filters, cookie, facturas?.meta?.limit]
  );

  useEffect(() => {
    fetchAll(1);
  }, [filters, fetchAll]);

  const onPage = (p) => fetchAll(p);

  const csvHref = useMemo(
    () => `${API_BASE_URL}/reportes/facturas.csv?${buildQuery(normalizeFilters(filters))}`,
    [filters]
  );
  
  const excelHref = useMemo(
    () => `${API_BASE_URL}/reportes/facturas.xlsx?${buildQuery(normalizeFilters(filters))}`,
    [filters]
  );
  
  const pdfHref = useMemo(
    () => `${API_BASE_URL}/reportes/facturas.pdf?${buildQuery(normalizeFilters(filters))}&landscape=true&totals=true&compact=true`,
    [filters]
  );

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

  const limpiarFiltros = () => {
    const ahora = new Date();
    setMesSeleccionado(`${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`);
    setTipoFiltroFecha("mes");
    setBusquedaRapida("");
    setUsuarioId("");
    setClienteId("");
    setEstado("");
    setTipoventa("");
    setTipodte("");
    setMostrarFiltrosAvanzados(false);
  };

  const filtrosActivos = () =>
    [tipoFiltroFecha === "rango", busquedaRapida, usuarioId, clienteId, estado, tipoventa, tipodte].filter(Boolean).length;

  const getNombreMes = (fecha) => {
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const [year, month] = fecha.split("-").map(Number);
    return `${meses[month - 1]} ${year}`;
  };

  const getTipoDTENombre = (codigo) => {
    const tipos = {
      "01": "Factura",
      "03": "CCF",
      "04": "N.Crédito",
      "05": "N.Débito",
      "06": "Retención",
      "11": "Exportación",
      "14": "Exclusión"
    };
    return tipos[codigo] || codigo || "N/A";
  };

  const tiposDTE = [
    {
      codigo: "01",
      nombre: "Facturas",
      descripcion: "Consumidor Final",
      icono: FaFileInvoice,
      color: "#3b82f6",
      bgLight: "bg-blue-50",
      border: "border-blue-200",
      textColor: "text-blue-700",
      dataKey: "factura",
    },
    {
      codigo: "03",
      nombre: "CCF",
      descripcion: "Crédito Fiscal",
      icono: FaCreditCard,
      color: "#8b5cf6",
      bgLight: "bg-purple-50",
      border: "border-purple-200",
      textColor: "text-purple-700",
      dataKey: "ccf",
    },
    {
      codigo: "04",
      nombre: "N. Crédito",
      descripcion: "Notas de Crédito",
      icono: FaExchangeAlt,
      color: "#f59e0b",
      bgLight: "bg-yellow-50",
      border: "border-yellow-200",
      textColor: "text-yellow-700",
      dataKey: "notaCredito",
    },
    {
      codigo: "05",
      nombre: "N. Débito",
      descripcion: "Notas de Débito",
      icono: FaTag,
      color: "#f97316",
      bgLight: "bg-orange-50",
      border: "border-orange-200",
      textColor: "text-orange-700",
      dataKey: "notaDebito",
    },
    {
      codigo: "11",
      nombre: "Exportación",
      descripcion: "Ventas exterior",
      icono: FaFileExport,
      color: "#10b981",
      bgLight: "bg-emerald-50",
      border: "border-emerald-200",
      textColor: "text-emerald-700",
      dataKey: "exportacion",
    },
    {
      codigo: "14",
      nombre: "Exclusión",
      descripcion: "Sujeto exclusión",
      icono: FaRegFileAlt,
      color: "#6b7280",
      bgLight: "bg-gray-50",
      border: "border-gray-200",
      textColor: "text-gray-600",
      dataKey: "exclusion",
    },
  ];

  const getMontoPorTipo = (tipo) => {
    if (!resumenPorTipo || !tipo.dataKey) return 0;
    return Number(resumenPorTipo[tipo.dataKey]) || 0;
  };

  const totalGeneral = useMemo(() => {
    if (!resumenPorTipo) return 0;
    return Object.values(resumenPorTipo).reduce((a, v) => a + (Number(v) || 0), 0);
  }, [resumenPorTipo]);

  const tipoActivoInfo = tiposDTE.find((t) => t.codigo === tipodte);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 h-full overflow-hidden">
        <div className={`fixed md:static z-40 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 w-64`}>
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

          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FaChartLine className="text-white text-sm" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-gray-900 leading-tight truncate">Reportes y Estadísticas</h1>
                  <p className="text-xs text-gray-500 truncate">
                    {empresa?.nombre || "—"} · {empleado?.nombre || user?.nombre || "Usuario"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={csvHref} className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:border-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1.5">
                  <FaFileCsv className="text-sm" />
                  <span className="hidden sm:inline">CSV</span>
                </a>
                <a href={excelHref} className="px-3 py-1.5 rounded-lg border border-green-200 text-green-600 text-xs font-medium hover:border-green-400 hover:text-green-700 transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 14h-3v-2h3v2zm0-4h-3V7h3v5z"/>
                  </svg>
                  <span className="hidden sm:inline">Excel</span>
                </a>
                <a href={pdfHref} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5" target="_blank" rel="noreferrer">
                  <FaFilePdf className="text-sm" />
                  <span className="hidden sm:inline">PDF</span>
                </a>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-4 space-y-4 max-w-screen-2xl mx-auto">

              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                <MetricCard title="Documentos" value={fmtInt(resumen?.totalFacturas)} loading={loading} icon={<FaFileInvoice />} color="#3b82f6" />
                <MetricCard title="Clientes" value={fmtInt(resumen?.clientesUnicos)} loading={loading} icon={<FaUsers />} color="#6366f1" />
                <MetricCard title="Total Ventas" value={fmtMoney(resumen?.totalMonto)} loading={loading} icon={<FaChartLine />} color="#06b6d4" highlight />
                <MetricCard title="Al Contado" value={fmtMoney(resumen?.totalContado)} loading={loading} icon={<FaCheckCircle />} color="#10b981" />
                <MetricCard title="A Crédito" value={fmtMoney(resumen?.totalCredito)} loading={loading} icon={<FaClock />} color="#f59e0b" />
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-3">

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFilter className="text-blue-600 text-xs" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filtros</span>
                      {filtrosActivos() > 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                          {filtrosActivos()}
                        </span>
                      )}
                    </div>
                    {filtrosActivos() > 0 && (
                      <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                        <FaTimesCircle className="text-[10px]" /> Limpiar
                      </button>
                    )}
                  </div>

                  <div className="p-3 space-y-3">
                    <div>
                      <div className="flex gap-1.5 mb-2">
                        <button
                          onClick={() => setTipoFiltroFecha("mes")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tipoFiltroFecha === "mes" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          Por mes
                        </button>
                        <button
                          onClick={() => setTipoFiltroFecha("rango")}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tipoFiltroFecha === "rango" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          Rango
                        </button>
                      </div>

                      {tipoFiltroFecha === "mes" ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="month"
                            value={mesSeleccionado}
                            onChange={(e) => setMesSeleccionado(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                          />
                          <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 whitespace-nowrap">
                            {getNombreMes(mesSeleccionado)}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Desde</label>
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Hasta</label>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 outline-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        value={busquedaRapida}
                        onChange={(e) => setBusquedaRapida(e.target.value)}
                        placeholder="Buscar N° control, código gen..."
                        className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                      />
                    </div>

                    <button
                      onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium w-full"
                    >
                      {mostrarFiltrosAvanzados ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                      Filtros avanzados
                      {(usuarioId || clienteId || estado || tipoventa) && (
                        <span className="ml-auto px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                          {[usuarioId, clienteId, estado, tipoventa].filter(Boolean).length}
                        </span>
                      )}
                    </button>

                    {mostrarFiltrosAvanzados && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">Tipo venta</label>
                          <select value={tipoventa} onChange={(e) => setTipoventa(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:border-blue-500 outline-none">
                            <option value="">Todos</option>
                            <option value="contado">Contado</option>
                            <option value="crédito">Crédito</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">Estado</label>
                          <select value={estado} onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-900 focus:border-blue-500 outline-none">
                            <option value="">Todos</option>
                            <option value="TRANSMITIDO">Transmitido</option>
                            <option value="CONTINGENCIA">Contingencia</option>
                            <option value="emitido">Emitido</option>
                            <option value="anulado">Anulado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">ID Usuario</label>
                          <input type="number" placeholder="Ej: 1" value={usuarioId}
                            onChange={(e) => setUsuarioId(e.target.value.replace(/\D+/g, ""))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 mb-1">ID Cliente</label>
                          <input type="number" placeholder="Ej: 5" value={clienteId}
                            onChange={(e) => setClienteId(e.target.value.replace(/\D+/g, ""))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 outline-none" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-500">
                        {new Date(desde).toLocaleDateString("es-SV")} – {new Date(hasta).toLocaleDateString("es-SV")}
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium">
                        {Math.ceil((new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24)) + 1} días
                      </span>
                    </div>

                    {loading && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1.5">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                        Actualizando datos...
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFilter className="text-blue-600 text-xs" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Filtrar por tipo de documento</span>
                      {tipodte && (
                        <button onClick={() => setTipodte("")} className="ml-1 text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5">
                          <FaTimesCircle /> Limpiar
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {loading ? "..." : `Total: ${fmtMoney(totalGeneral)}`}
                    </span>
                  </div>

                  <div className="p-3 grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {tiposDTE.map((tipo) => {
                      const Icono = tipo.icono;
                      const monto = getMontoPorTipo(tipo);
                      const isActive = tipodte === tipo.codigo;
                      const pct = totalGeneral > 0 ? (monto / totalGeneral) * 100 : 0;

                      return (
                        <button
                          key={tipo.codigo}
                          onClick={() => setTipodte(isActive ? "" : tipo.codigo)}
                          className={`relative p-3 rounded-xl text-left border-2 transition-all duration-200 ${
                            isActive
                              ? `${tipo.bgLight} ${tipo.border} shadow-md ring-2 ring-offset-1`
                              : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                          }`}
                          style={isActive ? { "--tw-ring-color": tipo.color } : {}}
                        >
                          {isActive && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow" style={{ backgroundColor: tipo.color }}>
                              <FaCheckCircle className="text-white text-[8px]" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: tipo.color + "20" }}>
                              <Icono className="text-sm" style={{ color: tipo.color }} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 leading-tight">{tipo.nombre}</p>
                              <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{tipo.descripcion}</p>
                            </div>
                            <div>
                              {loading ? (
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-14" />
                              ) : (
                                <p className="text-xs font-black" style={{ color: isActive ? tipo.color : "#111827" }}>
                                  {fmtMoney(monto)}
                                </p>
                              )}
                              {!loading && pct > 0 && (
                                <div className="mt-1 w-full bg-gray-100 rounded-full h-0.5">
                                  <div className="h-0.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: tipo.color }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaChartLine className="text-blue-500 text-sm" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Tendencia de ventas</h3>
                      <p className="text-[10px] text-gray-400">{ventas?.length || 0} días con ventas</p>
                    </div>
                  </div>
                  <LineChart data={ventas} xKey="fecha" yKey="monto" height={160} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaUsers className="text-indigo-500 text-sm" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Top 10 Clientes</h3>
                      <p className="text-[10px] text-gray-400">Ranking por monto facturado</p>
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                    <BarChart data={topCli} nameKey="nombre" valueKey="monto" />
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <CompactTable
                  title="Top Productos"
                  subtitle="Por monto vendido"
                  icon={<FaBoxes className="text-blue-500" />}
                  headers={["Código", "Descripción", "Cant.", "Monto"]}
                  rows={topProd?.map((r) => [r.codigo, r.descripcion, fmtInt(r.cantidad), fmtMoney(r.monto)])}
                  loading={loading}
                  colAlign={["left", "left", "right", "right"]}
                />
                <CompactTable
                  title="Resumen Tributos"
                  subtitle="Impuestos aplicados"
                  icon={<FaCertificate className="text-indigo-500" />}
                  headers={["Código", "Descripción", "Total"]}
                  rows={trib?.map((r) => [r.codigo, r.descripcion, fmtMoney(r.valor_total)])}
                  loading={loading}
                  colAlign={["left", "left", "right"]}
                />
              </section>

              <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaFileInvoice className="text-emerald-500 text-sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">Listado de Documentos</h3>
                        {tipoActivoInfo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: tipoActivoInfo.color }}>
                            <tipoActivoInfo.icono className="text-[9px]" />
                            {tipoActivoInfo.nombre}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {fmtInt(facturas?.meta?.total)} resultado{facturas?.meta?.total !== 1 ? "s" : ""}
                        {facturas?.meta?.pages > 1 && ` · Pág. ${facturas?.meta?.p} / ${facturas?.meta?.pages}`}
                        {tipoActivoInfo && ` · Filtrado: ${tipoActivoInfo.nombre}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px] w-12">ID</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px]">Fecha</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px]">N° Control</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px]">Tipo</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px] hidden sm:table-cell">Venta</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px]">Estado</th>
                        <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide text-[10px]">Cliente</th>
                        <th className="px-3 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wide text-[10px]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {facturas?.data?.map((f, idx) => {
                        const tipoInfo = tiposDTE.find((t) => t.codigo === (f.tipodte || f.tipo_dte)) || tiposDTE[0];
                        const Icono = tipoInfo.icono;
                        return (
                          <tr key={f.iddtefactura} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-3 py-2 font-bold text-blue-600">{f.iddtefactura}</td>
                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                              {f.fechaemision ? new Date(f.fechaemision).toLocaleDateString("es-SV") : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-600 text-[10px] max-w-[120px] truncate">{f.ncontrol}</td>
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                                style={{ backgroundColor: tipoInfo.color + "18", color: tipoInfo.color }}>
                                <Icono className="text-[9px]" />
                                {getTipoDTENombre(f.tipodte || f.tipo_dte)}
                              </span>
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell">
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 capitalize">{f.tipoventa}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold capitalize ${
                                f.estado === "emitido" || f.estado === "TRANSMITIDO"
                                  ? "bg-green-100 text-green-700"
                                  : f.estado === "anulado"
                                  ? "bg-red-100 text-red-700"
                                  : f.estado === "CONTINGENCIA"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {f.estado}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-800 font-medium max-w-[150px] truncate">
                              {f.cliente?.nombre || f.cliente?.nombrecomercial || "Sin nombre"}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-blue-600 whitespace-nowrap">{fmtMoney(f.total)}</td>
                          </tr>
                        );
                      })}

                      {facturas?.data?.length === 0 && !loading && (
                        <tr>
                          <td colSpan="8" className="px-4 py-10 text-center text-gray-400">
                            <FaFileInvoice className="mx-auto text-3xl text-gray-200 mb-2" />
                            <p className="text-sm">No se encontraron documentos</p>
                            <p className="text-xs mt-1">
                              {tipodte ? `No hay ${tipoActivoInfo?.nombre || tipodte} en el período seleccionado` : "Intenta cambiar los filtros"}
                            </p>
                          </td>
                        </tr>
                      )}

                      {loading && facturas?.data?.length === 0 && (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <td key={j} className="px-3 py-2.5">
                                <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: j === 6 ? "80%" : "60%" }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {facturas?.meta?.pages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <span className="text-xs text-gray-500">
                      {(facturas?.meta?.p - 1) * 20 + 1}–{Math.min((facturas?.meta?.p - 1) * 20 + facturas?.data?.length, facturas?.meta?.total)} de {fmtInt(facturas?.meta?.total)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        disabled={facturas?.meta?.p <= 1 || loading}
                        onClick={() => onPage(1)}
                      >1</button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        disabled={facturas?.meta?.p <= 1 || loading}
                        onClick={() => onPage(facturas?.meta?.p - 1)}
                      >
                        <FaArrowLeft className="text-[10px]" /> Ant.
                      </button>
                      <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
                        {facturas?.meta?.p}
                      </span>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        disabled={facturas?.meta?.p >= facturas?.meta?.pages || loading}
                        onClick={() => onPage(facturas?.meta?.p + 1)}
                      >
                        Sig. <FaArrowRight className="text-[10px]" />
                      </button>
                      <button
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        disabled={facturas?.meta?.p >= facturas?.meta?.pages || loading}
                        onClick={() => onPage(facturas?.meta?.pages)}
                      >{facturas?.meta?.pages}</button>
                    </div>
                  </div>
                )}
              </section>

            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, loading = false, icon, color = "#3b82f6", highlight = false }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-3 sm:p-4 border transition-all hover:shadow-md ${highlight ? "bg-blue-600 border-blue-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 truncate ${highlight ? "text-blue-200" : "text-gray-500"}`}>
            {title}
          </p>
          <div className={`text-base sm:text-lg font-black leading-tight ${highlight ? "text-white" : "text-gray-900"}`}>
            {loading ? (
              <div className={`h-5 rounded animate-pulse ${highlight ? "bg-blue-500" : "bg-gray-200"}`} style={{ width: "70%" }} />
            ) : value}
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${highlight ? "bg-blue-500" : ""}`}
          style={!highlight ? { backgroundColor: color + "18" } : {}}>
          <span className="text-sm" style={!highlight ? { color } : { color: "white" }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function CompactTable({ title, subtitle, icon, headers = [], rows = [], loading = false, colAlign = [] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="overflow-auto max-h-[220px]">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
            <tr>
              {headers.map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide ${colAlign[i] === "right" ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {headers.map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.length
              ? rows.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                    {r.map((cell, j) => (
                      <td key={j} className={`px-3 py-2 text-gray-700 font-medium max-w-[160px] truncate ${colAlign[j] === "right" ? "text-right" : "text-left"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              : (
                  <tr>
                    <td colSpan={headers.length} className="px-3 py-6 text-center text-gray-400 text-xs">
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