"use client";
import { useState, useEffect } from "react";
import {
  FaLayerGroup,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaTag,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaDollarSign,
  FaChartPie,
  FaSync,
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";

const num = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(amount || 0);

const formatNumber = (n) => new Intl.NumberFormat("es-SV").format(n || 0);

export default function DashboardLotesView({ user, hasHaciendaToken, haciendaStatus, dashboardData }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState(dashboardData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setData(dashboardData);
  }, [dashboardData]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const refrescar = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/dashboard-lotes`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!resp.ok) throw new Error("Error al actualizar el dashboard");
      setData(await resp.json());
      addToast("Dashboard actualizado", "success");
    } catch (error) {
      console.error("Error al refrescar dashboard:", error);
      addToast("Error al actualizar: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Normalización defensiva de la estructura del backend
  const lotes = data?.lotes || data?.stats?.lotes || {};
  const creditos = data?.creditos || data?.stats?.creditos || {};
  const montos = data?.montos || {};
  const alertas = data?.alertas || {};

  const totalLotes = num(lotes.total, lotes.total_lotes, data?.total_lotes);
  const disponibles = num(lotes.disponibles, lotes.total_disponibles, data?.disponibles);
  const asignados = num(lotes.asignados, lotes.total_asignados, data?.asignados);
  const vendidos = num(lotes.vendidos, lotes.total_vendidos, data?.vendidos);

  const totalCreditos = num(creditos.total, creditos.total_creditos);
  const creditosActivos = num(creditos.activos, creditos.total_activos);
  const creditosPagados = num(creditos.pagados, creditos.total_pagados);
  const creditosVencidos = num(creditos.vencidos, creditos.total_vencidos);

  const totalFinanciado = num(
    montos.totalFinanciado,
    montos.total_financiado,
    data?.total_financiado
  );
  const totalCobrado = num(montos.totalCobrado, montos.total_cobrado, data?.total_cobrado);
  const porCobrar = num(montos.porCobrar, montos.por_cobrar, data?.por_cobrar);

  const cuotasVencidas = num(
    alertas.cuotasVencidas,
    alertas.cuotas_vencidas,
    data?.cuotas_vencidas
  );
  const pagosMes = num(alertas.pagosMes, alertas.pagos_mes, alertas.pagosDelMes, data?.pagos_del_mes);

  const tieneDatos =
    data &&
    (totalLotes > 0 ||
      totalCreditos > 0 ||
      totalFinanciado > 0 ||
      cuotasVencidas > 0 ||
      pagosMes > 0);

  const loteCards = [
    { label: "Total Lotes", value: formatNumber(totalLotes), icon: FaLayerGroup, gradient: "from-blue-500 to-blue-700", shadow: "shadow-blue-200" },
    { label: "Disponibles", value: formatNumber(disponibles), icon: FaCheckCircle, gradient: "from-green-500 to-green-700", shadow: "shadow-green-200" },
    { label: "Asignados", value: formatNumber(asignados), icon: FaMapMarkerAlt, gradient: "from-yellow-400 to-yellow-600", shadow: "shadow-yellow-200" },
    { label: "Vendidos", value: formatNumber(vendidos), icon: FaTag, gradient: "from-red-500 to-red-700", shadow: "shadow-red-200" },
  ];

  const creditoCards = [
    { label: "Total Créditos", value: formatNumber(totalCreditos), icon: FaFileInvoiceDollar, gradient: "from-indigo-500 to-indigo-700", shadow: "shadow-indigo-200" },
    { label: "Activos", value: formatNumber(creditosActivos), icon: FaMoneyBillWave, gradient: "from-emerald-500 to-emerald-700", shadow: "shadow-emerald-200" },
    { label: "Pagados", value: formatNumber(creditosPagados), icon: FaCheckCircle, gradient: "from-teal-500 to-teal-700", shadow: "shadow-teal-200" },
    { label: "Vencidos", value: formatNumber(creditosVencidos), icon: FaExclamationTriangle, gradient: "from-orange-500 to-orange-700", shadow: "shadow-orange-200" },
  ];

  const montoCards = [
    { label: "Total Financiado", value: formatCurrency(totalFinanciado), icon: FaHandHoldingUsd, gradient: "from-purple-500 to-purple-700", shadow: "shadow-purple-200" },
    { label: "Total Cobrado", value: formatCurrency(totalCobrado), icon: FaDollarSign, gradient: "from-cyan-500 to-cyan-700", shadow: "shadow-cyan-200" },
    { label: "Por Cobrar", value: formatCurrency(porCobrar), icon: FaChartPie, gradient: "from-pink-500 to-pink-700", shadow: "shadow-pink-200" },
  ];

  return (
    <div className="flex h-screen text-black bg-blue-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b print:hidden">
          <Navbar
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              {/* Encabezado */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Dashboard de Lotificación
                  </h1>
                  <p className="text-gray-600">
                    Resumen general de lotes, créditos y cobranza
                  </p>
                </div>
                <button
                  onClick={refrescar}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <FaSync className={loading ? "animate-spin" : ""} />
                  Actualizar
                </button>
              </div>

              {/* Estado sin datos */}
              {!tieneDatos && !loading ? (
                <div className="bg-white rounded-xl shadow-md p-10 text-center border border-gray-100">
                  <FaLayerGroup className="inline-block text-5xl text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Aún no hay datos para mostrar
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Cuando registres tus primeros lotes y créditos de lotificación, aquí verás
                    las métricas más importantes de tu negocio.
                  </p>
                  <a
                    href="/dashboard/lotes"
                    className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Ir a Gestión de Lotes
                  </a>
                </div>
              ) : (
                <>
                  {/* Alertas */}
                  {(cuotasVencidas > 0 || pagosMes > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div
                        className={`flex items-center gap-3 rounded-xl p-4 border ${
                          cuotasVencidas > 0
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full ${
                            cuotasVencidas > 0 ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <FaExclamationTriangle className="text-xl" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cuotas vencidas</p>
                          <p className={`text-xl font-bold ${cuotasVencidas > 0 ? "text-red-700" : "text-gray-400"}`}>
                            {formatNumber(cuotasVencidas)}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-3 rounded-xl p-4 border ${
                          pagosMes > 0
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full ${
                            pagosMes > 0 ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <FaCalendarCheck className="text-xl" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pagos registrados este mes</p>
                          <p className={`text-xl font-bold ${pagosMes > 0 ? "text-green-700" : "text-gray-400"}`}>
                            {formatNumber(pagosMes)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cards de lotes */}
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Lotificación
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {loteCards.map((card) => (
                      <div
                        key={card.label}
                        className={`bg-white rounded-xl shadow-lg ${card.shadow} p-5 border border-gray-100 hover:-translate-y-0.5 transition-transform`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                            <p className="text-3xl font-extrabold text-gray-800 mt-1">{card.value}</p>
                          </div>
                          <div
                            className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-md`}
                          >
                            <card.icon className="text-xl" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cards de créditos */}
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Créditos de Lotificación
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {creditoCards.map((card) => (
                      <div
                        key={card.label}
                        className={`bg-white rounded-xl shadow-lg ${card.shadow} p-5 border border-gray-100 hover:-translate-y-0.5 transition-transform`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                            <p className="text-3xl font-extrabold text-gray-800 mt-1">{card.value}</p>
                          </div>
                          <div
                            className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-md`}
                          >
                            <card.icon className="text-xl" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cards de montos */}
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Resumen Financiero
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {montoCards.map((card) => (
                      <div
                        key={card.label}
                        className={`relative overflow-hidden bg-white rounded-xl shadow-lg ${card.shadow} p-5 border border-gray-100`}
                      >
                        <div
                          className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.gradient}`}
                        ></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                            <p className="text-2xl md:text-3xl font-extrabold text-gray-800 mt-1">
                              {card.value}
                            </p>
                          </div>
                          <div
                            className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-md`}
                          >
                            <card.icon className="text-xl" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Barra de progreso global de cobro */}
                  {totalFinanciado > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-700">Progreso de cobranza</p>
                        <p className="text-sm font-bold text-cyan-700">
                          {totalFinanciado > 0
                            ? `${Math.min(100, Math.round((totalCobrado / totalFinanciado) * 100))}%`
                            : "0%"}
                        </p>
                      </div>
                      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              totalFinanciado > 0
                                ? Math.min(100, (totalCobrado / totalFinanciado) * 100)
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Cobrado: {formatCurrency(totalCobrado)}</span>
                        <span>Pendiente: {formatCurrency(Math.max(0, porCobrar))}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
