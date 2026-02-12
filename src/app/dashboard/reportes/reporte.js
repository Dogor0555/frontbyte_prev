// src/app/dashboard/reportes/reporte.js
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import {
  FaDownload,
  FaFilePdf,
  FaFileCsv,
  FaChartLine,
  FaUsers,
  FaBoxes,
  FaFileInvoice,
  FaBuilding,
  FaUser,
  FaIdCard,
  FaCertificate,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaArrowLeft,
  FaArrowRight,
  FaBars,
  FaTimes,
  FaBriefcase,
} from "react-icons/fa";

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

/* ------------------------------- Line Chart con estilo Welcome ------------------------------ */
function LineChart({ data = [], xKey = "fecha", yKey = "monto", height = 200 }) {
  const pad = 40;
  const width = Math.max(500, (data?.length || 1) * 50);

  if (!data?.length) {
    return (
      <div className="w-full h-[200px] grid place-items-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <FaChartLine className="text-blue-400 text-2xl" />
          </div>
          <p className="text-sm text-gray-400">Sin datos para mostrar</p>
        </div>
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

  const areaAttr = `${dAttr} L ${toX(new Date(data[data.length - 1][xKey]).getTime())} ${height - pad} L ${toX(new Date(data[0][xKey]).getTime())} ${height - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="rounded-xl">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
            <stop offset="50%" stopColor="#6366f1" /> {/* indigo-500 */}
            <stop offset="100%" stopColor="#06b6d4" /> {/* cyan-500 */}
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = pad + ((height - pad * 2) * i) / 4;
          return (
            <line
              key={i}
              x1={pad}
              y1={y}
              x2={width - pad}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Área con gradiente */}
        <path d={areaAttr} fill="url(#areaGradient)" className="animate-fade-in" />

        {/* Línea principal con glow */}
        <path 
          d={dAttr} 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
          className="animate-draw-line"
        />

        {/* Puntos animados */}
        {data.map((p, i) => {
          const x = toX(new Date(p[xKey]).getTime());
          const y = toY(Number(p[yKey] || 0));
          return (
            <g key={i} className="animate-pop-in" style={{ animationDelay: `${i * 50}ms` }}>
              <circle cx={x} cy={y} r="6" fill="white" />
              <circle cx={x} cy={y} r="4" fill="#3b82f6" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* --------------------------- Bar Chart estilo Welcome --------------------------- */
function BarChart({ data = [], nameKey = "nombre", valueKey = "monto" }) {
  if (!data?.length) {
    return (
      <div className="w-full h-[300px] grid place-items-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <FaUsers className="text-blue-400 text-2xl" />
          </div>
          <p className="text-sm text-gray-400">Sin datos para mostrar</p>
        </div>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => Number(b[valueKey] || 0) - Number(a[valueKey] || 0)).slice(0, 10);
  const maxValue = Math.max(...sortedData.map(d => Number(d[valueKey] || 0))) || 1;

  const colors = [
    'from-blue-500 to-cyan-500',
    'from-indigo-500 to-blue-500',
    'from-cyan-500 to-teal-500',
    'from-blue-600 to-indigo-600',
    'from-sky-500 to-blue-500',
    'from-indigo-600 to-blue-600',
    'from-teal-500 to-cyan-500',
    'from-blue-700 to-indigo-700',
    'from-sky-600 to-blue-600',
    'from-cyan-600 to-teal-600',
  ];

  return (
    <div className="space-y-4">
      {sortedData.map((item, i) => {
        const value = Number(item[valueKey] || 0);
        const percentage = (value / maxValue) * 100;
        const name = String(item[nameKey] || item.nombrecomercial || "Sin nombre");
        const displayName = name.length > 28 ? name.slice(0, 28) + "..." : name;

        return (
          <div 
            key={i} 
            className="group animate-slide-in-left"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${colors[i]} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-all duration-300`}>
                  <span className="text-white text-sm font-bold">{i + 1}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 truncate" title={name}>
                  {displayName}
                </span>
              </div>
              <span className="text-sm font-bold text-blue-600 ml-3">
                {fmtMoney(value)}
              </span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors[i]} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${percentage}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 animate-shimmer"></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- View ---------------------------------- */

export default function Reportes({ user, cookie, hasHaciendaToken, haciendaStatus }) {
  const today = useMemo(() => toISO(new Date()), []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const startMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  }, []);

  // Datos de empresa y empleado del localStorage
  const [empresa, setEmpresa] = useState(null);
  const [empleado, setEmpleado] = useState(null);

  // Estado de conexión a Hacienda
  const [haciendaConnection, setHaciendaConnection] = useState({
    connected: hasHaciendaToken,
    expiresIn: haciendaStatus?.seconds_left ?? 0,
  });

  const [desde, setDesde] = useState(startMonth);
  const [hasta, setHasta] = useState(today);
  const [usuarioId, setUsuarioId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoventa, setTipoventa] = useState("");
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

  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [topProd, setTopProd] = useState([]);
  const [topCli, setTopCli] = useState([]);
  const [trib, setTrib] = useState([]);
  const [facturas, setFacturas] = useState({ data: [], meta: { p: 1, pages: 1, limit: 20, total: 0 } });

  const abortRef = useRef();

  // Cargar datos de localStorage
  useEffect(() => {
    const empresaData = localStorage.getItem('empresa');
    const empleadoData = localStorage.getItem('empleado');
    
    if (empresaData) {
      const empresaObj = JSON.parse(empresaData);
      setEmpresa(empresaObj);
    }
    
    if (empleadoData) {
      const empleadoObj = JSON.parse(empleadoData);
      setEmpleado(empleadoObj);
    }
  }, []);

  // Actualizar estado de Hacienda
  useEffect(() => {
    setHaciendaConnection({
      connected: hasHaciendaToken,
      expiresIn: haciendaStatus?.seconds_left ?? 0,
    });
  }, [hasHaciendaToken, haciendaStatus]);

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
        if (e.name !== 'AbortError') {
          console.error(e);
        }
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
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Formatear tiempo restante para token de Hacienda
  const formatTimeLeft = (seconds) => {
    if (!seconds || seconds <= 0) return "Expirado";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Overlay para mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed md:static z-40 h-full transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 w-64`}
        >
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navbar */}
          <Navbar 
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          {/* Header estilo Welcome */}
          <header className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="mb-2">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold tracking-wider uppercase">
                      {empresa ? empresa.nombre : 'BYTE FUSION SOLUCIONES'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Reportes y Estadísticas
                  </h1>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {empleado?.nombre || user?.nombre || user?.email || "Usuario"} · {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <a
                    href={csvHref}
                    className="group relative px-5 py-2.5 rounded-xl bg-white border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <FaFileCsv className="text-blue-600" />
                    <span>CSV</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl -z-10"></div>
                  </a>
                  <a
                    href={pdfHref}
                    className="group relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaFilePdf className="text-white" />
                    <span>PDF</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  </a>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">
              
              {/* Información de empresa y empleado estilo Welcome */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Empresa Card */}
                {empresa && (
                  <div className="group">
                    <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-2 border-blue-200/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      
                      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" />
                      <div className="absolute bottom-6 right-8 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
                              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <FaBuilding className="text-white text-xl" />
                              </div>
                            </div>
                            <div>
                              <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Empresa Activa
                              </p>
                              <h2 className="text-xl font-black text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                                {empresa.nombre}
                              </h2>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className={`absolute inset-0 blur-sm opacity-60 rounded-lg animate-pulse ${empresa.ambiente === '00' ? 'bg-yellow-300' : 'bg-green-300'}`} />
                            <span className={`relative px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transform hover:scale-105 transition-all duration-300 ${empresa.ambiente === '00' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900' : 'bg-gradient-to-r from-green-400 to-emerald-500 text-green-900'}`}>
                              {empresa.ambiente === '00' ? 'Pruebas' : 'Producción'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 group/item">
                            <div className="flex items-center gap-2 mb-1">
                              <FaIdCard className="text-blue-500 text-sm group-hover/item:scale-110 transition-transform duration-300" />
                              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">NIT</p>
                            </div>
                            <p className="font-black text-gray-900 text-lg">{empresa.nit}</p>
                          </div>
                          
                          {empresa.nrc && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 group/item">
                              <div className="flex items-center gap-2 mb-1">
                                <FaCertificate className="text-indigo-500 text-sm group-hover/item:scale-110 transition-transform duration-300" />
                                <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider">NRC</p>
                              </div>
                              <p className="font-black text-gray-900 text-lg">{empresa.nrc}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empleado y Hacienda Card */}
                <div className="space-y-4">
                  {/* Empleado Card */}
                  {empleado && (
                    <div className="group">
                      <div className="relative bg-gradient-to-r from-white via-gray-50 to-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                        
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-pulse" />
                        </div>
                        
                        <div className="relative z-10 flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin" style={{animationDuration: '3s'}} />
                            
                            <div className="relative w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-white shadow-lg transform group-hover:scale-110 transition-all duration-300">
                              <span className="text-gray-700 font-black text-2xl">
                                {empleado.nombre.charAt(0)}
                              </span>
                            </div>
                            
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md">
                              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Usuario Activo
                            </p>
                            <p className="font-black text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors duration-300">
                              {empleado.nombre}
                            </p>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                <span className="relative inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md transform group-hover:scale-105 transition-all duration-300">
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                  {empleado.rol}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 font-bold">•</span>
                              <span className="text-xs text-gray-600 font-medium group-hover:text-blue-600 transition-colors duration-300">
                                {empleado.correo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hacienda Connection Status */}
                  <div className={`p-4 rounded-xl shadow-md ${
                    haciendaConnection.connected
                      ? "bg-green-50 border-2 border-green-200"
                      : "bg-yellow-50 border-2 border-yellow-200"
                  }`}>
                    <div className="flex items-start gap-3">
                      {haciendaConnection.connected ? (
                        <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-lg" />
                      ) : (
                        <FaExclamationTriangle className="text-yellow-500 flex-shrink-0 mt-0.5 text-lg" />
                      )}
                      <span className={`text-sm font-medium ${
                        haciendaConnection.connected ? "text-green-700" : "text-yellow-700"
                      }`}>
                        {haciendaConnection.connected
                          ? `Conectado a Hacienda (expira en ${formatTimeLeft(haciendaConnection.expiresIn)})`
                          : "Advertencia: No hay conexión activa con Hacienda. Algunas funciones pueden estar limitadas."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filtros estilo corporativo */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <FaFilter className="text-white text-sm" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Filtros de búsqueda</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Desde</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input 
                        type="date" 
                        value={desde} 
                        onChange={(e) => setDesde(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Hasta</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input 
                        type="date" 
                        value={hasta} 
                        onChange={(e) => setHasta(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Tipo venta</label>
                    <select 
                      value={tipoventa} 
                      onChange={(e) => setTipoventa(e.target.value)} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="contado">Contado</option>
                      <option value="crédito">Crédito</option>
                    </select>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Estado</label>
                    <select 
                      value={estado} 
                      onChange={(e) => setEstado(e.target.value)} 
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="emitido">Emitido</option>
                      <option value="anulado">Anulado</option>
                    </select>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Buscar</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="N° control o código generación..."
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Usuario ID</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="ID"
                      value={usuarioId}
                      onChange={(e) => setUsuarioId(e.target.value.replace(/\D+/g, ""))}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Cliente ID</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="ID"
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value.replace(/\D+/g, ""))}
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex items-end">
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
                      className="w-full px-5 py-2.5 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all h-[42px]"
                    >
                      Limpiar
                    </button>
                  </div>
                  
                  <div className="md:col-span-3 flex items-center justify-end">
                    {loading && (
                      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50">
                        <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-semibold text-blue-700">Cargando datos...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards de resumen estilo corporativo */}
              <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard 
                  title="Total facturas" 
                  value={fmtInt(resumen?.totalFacturas)} 
                  loading={loading}
                  icon={<FaFileInvoice />}
                  gradient="from-blue-500 to-cyan-500"
                />
                <MetricCard 
                  title="Clientes únicos" 
                  value={fmtInt(resumen?.clientesUnicos)} 
                  loading={loading}
                  icon={<FaUsers />}
                  gradient="from-indigo-500 to-blue-500"
                />
                <MetricCard 
                  title="Total monto" 
                  value={fmtMoney(resumen?.totalMonto)} 
                  loading={loading}
                  icon={<FaChartLine />}
                  gradient="from-cyan-500 to-teal-500"
                />
                <MetricCard 
                  title="Contado" 
                  value={fmtMoney(resumen?.totalContado)} 
                  loading={loading}
                  icon={<FaCheckCircle />}
                  gradient="from-emerald-500 to-teal-500"
                />
                <MetricCard 
                  title="Crédito" 
                  value={fmtMoney(resumen?.totalCredito)} 
                  loading={loading}
                  icon={<FaClock />}
                  gradient="from-amber-500 to-orange-500"
                />
              </section>

              {/* Gráficas principales */}
              <section className="grid lg:grid-cols-2 gap-6">
                {/* Ventas diarias */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <FaChartLine className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Tendencia de ventas</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {ventas?.length || 0} días de actividad
                        </p>
                      </div>
                    </div>
                  </div>
                  <LineChart data={ventas} xKey="fecha" yKey="monto" />
                </div>

                {/* Top clientes */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                        <FaUsers className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Top 10 Clientes</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Ranking por monto facturado
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    <BarChart data={topCli} nameKey="nombre" valueKey="monto" />
                  </div>
                </div>
              </section>

              {/* Tablas: Productos y Tributos */}
              <section className="grid lg:grid-cols-2 gap-6">
                <GlassTable
                  title="Top productos"
                  subtitle="Los más vendidos del período"
                  icon={<FaBoxes />}
                  headers={["Código", "Descripción", "Cant.", "Monto"]}
                  rows={topProd?.map((r) => [r.codigo, r.descripcion, fmtInt(r.cantidad), fmtMoney(r.monto)])}
                  loading={loading}
                />
                <GlassTable
                  title="Tributos"
                  subtitle="Resumen por código fiscal"
                  icon={<FaCertificate />}
                  headers={["Código", "Descripción", "Total"]}
                  rows={trib?.map((r) => [r.codigo, r.descripcion, fmtMoney(r.valor_total)])}
                  loading={loading}
                />
              </section>

              {/* Facturas */}
              <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                      <FaFileInvoice className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Gestión de Facturas</h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {fmtInt(facturas?.meta?.total)} registros · Página {facturas?.meta?.p} de {facturas?.meta?.pages}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "ID", "Fecha", "Hora", "N° Control", "Código Gen.", 
                          "Tipo", "Estado", "Cliente", "Sucursal", "Usuario", "Total", ""
                        ].map((h) => (
                          <th key={h} className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {facturas?.data?.map((f, idx) => (
                        <tr key={f.iddtefactura} className="hover:bg-blue-50/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                          <td className="px-4 py-3 text-sm font-bold text-blue-700">{f.iddtefactura}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{new Date(f.fechaemision).toISOString().slice(0, 10)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{f.horaemision?.slice?.(0, 8) || ""}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-900">{f.ncontrol}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-900">{f.codigogen}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 capitalize">
                              {f.tipoventa}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold capitalize
                              ${f.estado === 'aprobado' ? 'bg-green-100 text-green-700' : 
                                f.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                                f.estado === 'anulado' ? 'bg-red-100 text-red-700' : 
                                'bg-gray-100 text-gray-700'}`}>
                              {f.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate font-medium">
                            {f.cliente?.nombre || f.cliente?.nombrecomercial || ""}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{f.sucursal?.nombre || ""}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-[150px] truncate">
                            {f.usuario?.nombre || f.usuario?.correo || ""}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-700">
                            {fmtMoney(f.total)}
                          </td>
                          <td className="px-4 py-3">
                            <button className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-bold hover:shadow-lg transition-all hover:scale-105">
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación moderna */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">{(facturas?.meta?.p - 1) * 20 + 1}</span> a <span className="font-semibold">
                      {Math.min((facturas?.meta?.p - 1) * 20 + facturas?.data?.length, facturas?.meta?.total)}
                    </span> de <span className="font-semibold">{fmtInt(facturas?.meta?.total)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-400 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      disabled={facturas?.meta?.p <= 1 || loading}
                      onClick={() => onPage(facturas?.meta?.p - 1)}
                    >
                      <FaArrowLeft className="text-xs" />
                      Anterior
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, facturas?.meta?.pages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                              facturas?.meta?.p === pageNum 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md' 
                                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                            }`}
                            onClick={() => onPage(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-400 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      disabled={facturas?.meta?.p >= facturas?.meta?.pages || loading}
                      onClick={() => onPage(facturas?.meta?.p + 1)}
                    >
                      Siguiente
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes draw-line {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
        }
        
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slide-in-left {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-draw-line {
          animation: draw-line 1.5s ease-out forwards;
        }
        
        .animate-pop-in {
          animation: pop-in 0.4s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #6366f1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------- Components ------------------------------ */

function MetricCard({ title, value, loading = false, icon, gradient = "from-blue-500 to-cyan-500" }) {
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-white text-lg">{icon}</span>
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        </div>
        
        <div className="text-2xl font-black text-gray-900">
          {loading ? (
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          ) : (
            <div className="group-hover:scale-105 transition-transform origin-left">{value}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function GlassTable({ title, subtitle, icon, headers = [], rows = [], loading = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-lg">{icon}</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {headers.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : rows?.length ? (
              rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                  {r.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center">
                  <div className="text-gray-400">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <FaBoxes className="text-blue-300 text-lg" />
                    </div>
                    <span className="text-sm">Sin datos</span>
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