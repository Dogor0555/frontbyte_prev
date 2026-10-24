"use client";

import { useDeferredValue, useEffect, useState } from "react";
import {
  FaBalanceScale,
  FaBoxOpen,
  FaCalendarAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaPercentage,
  FaSearch,
  FaSyncAlt,
  FaTags,
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { API_BASE_URL } from "@/lib/api";

const money = (value) => Number(value || 0).toLocaleString("es-SV", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = (value, decimals = 2) => Number(value || 0).toLocaleString("es-SV", {
  minimumFractionDigits: 0,
  maximumFractionDigits: decimals,
});

const percent = (value) => value === null || value === undefined
  ? "—"
  : `${number(value, 2)}%`;

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const rangeFromMonth = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    desde: `${monthValue}-01`,
    hasta: `${monthValue}-${String(lastDay).padStart(2, "0")}`,
  };
};

const marginTone = (value) => {
  if (value === null || value === undefined) return "bg-gray-100 text-gray-500";
  if (value < 0) return "bg-rose-100 text-rose-700";
  if (value < 15) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

export default function RentabilidadView({ user, hasHaciendaToken, haciendaStatus }) {
  const initialMonth = currentMonth();
  const initialRange = rangeFromMonth(initialMonth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [empresa, setEmpresa] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const [periodType, setPeriodType] = useState("month");
  const [month, setMonth] = useState(initialMonth);
  const [desde, setDesde] = useState(initialRange.desde);
  const [hasta, setHasta] = useState(initialRange.hasta);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const pageSize = 25;

  useEffect(() => {
    try {
      const empresaData = localStorage.getItem("empresa");
      const sucursalData = localStorage.getItem("sucursal");
      if (empresaData) setEmpresa(JSON.parse(empresaData));
      if (sucursalData) setSucursal(JSON.parse(sucursalData));
    } catch (storageError) {
      console.error("No se pudo leer la empresa o sucursal:", storageError);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadRentabilidad = async () => {
      if (!desde || !hasta || desde > hasta) {
        setData(null);
        setError("El rango de fechas no es válido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setData(null);
      setError("");
      try {
        const query = new URLSearchParams({ desde, hasta });
        const response = await fetch(`${API_BASE_URL}/reportes/rentabilidad?${query}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.mensaje || payload.message || "No se pudo cargar la rentabilidad.");
        }
        setData(payload);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setData(null);
          setError(requestError.message || "No se pudo cargar la rentabilidad.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadRentabilidad();
    return () => controller.abort();
  }, [desde, hasta, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, desde, hasta]);

  const handleMonthChange = (event) => {
    const value = event.target.value;
    setMonth(value);
    if (value) {
      const range = rangeFromMonth(value);
      setDesde(range.desde);
      setHasta(range.hasta);
    }
  };

  const productos = (data?.productos || []).filter((producto) => {
    const matchesSearch = !deferredSearch
      || String(producto.nombre || "").toLowerCase().includes(deferredSearch)
      || String(producto.codigo || "").toLowerCase().includes(deferredSearch)
      || String(producto.codigoBarras || "").toLowerCase().includes(deferredSearch);
    if (!matchesSearch) return false;
    if (statusFilter === "sold") return Number(producto.periodo?.unidadesVendidas || 0) !== 0;
    if (statusFilter === "missingCost") return !producto.tieneCosto;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(productos.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedProducts = productos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resumen = data?.resumen || {};
  const calidad = data?.calidad || {};
  const monthlyMax = Math.max(
    1,
    ...(data?.mensual || []).map((item) => Math.abs(Number(item.gananciaEstimada) || 0))
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex h-full flex-1 overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            sidebarOpen={sidebarOpen}
          />

          <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <FaChartLine className="text-sm" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold text-gray-900">Rentabilidad por producto</h1>
                  <p className="truncate text-xs text-gray-500">
                    {empresa?.nombre || "Empresa"} · {sucursal?.nombre || "Sucursal actual"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-400 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-screen-2xl space-y-4 p-3 sm:p-4">
              <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex gap-3 p-4">
                  <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Estimación basada en el costo actual</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      Los importes se muestran sin IVA. Si el costo cambió después de una venta, la rentabilidad histórica puede variar. Este reporte representa ganancia bruta estimada y no utilidad neta contable.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Período del reporte</p>
                    <div className="mt-2 flex rounded-lg bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPeriodType("month");
                          const range = rangeFromMonth(month);
                          setDesde(range.desde);
                          setHasta(range.hasta);
                        }}
                        className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${periodType === "month" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"}`}
                      >
                        Mes
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriodType("range")}
                        className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${periodType === "range" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"}`}
                      >
                        Rango
                      </button>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
                    {periodType === "month" ? (
                      <label className="text-xs font-semibold text-gray-700">
                        Mes
                        <span className="relative mt-1 block">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="month"
                            value={month}
                            onChange={handleMonthChange}
                            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </span>
                      </label>
                    ) : (
                      <>
                        <label className="text-xs font-semibold text-gray-700">
                          Desde
                          <input
                            type="date"
                            value={desde}
                            onChange={(event) => setDesde(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                        <label className="text-xs font-semibold text-gray-700">
                          Hasta
                          <input
                            type="date"
                            value={hasta}
                            onChange={(event) => setHasta(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {error && (
                <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <div className="flex items-center gap-2 font-bold">
                    <FaExclamationTriangle />
                    {error}
                  </div>
                </section>
              )}

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  title="Ventas netas"
                  value={money(resumen.ventasNetas)}
                  caption={`${number(resumen.documentos, 0)} documentos`}
                  icon={<FaTags />}
                  loading={loading}
                  tone="slate"
                />
                <MetricCard
                  title="Costo estimado"
                  value={money(resumen.costoEstimado)}
                  caption="Costo actual sin IVA"
                  icon={<FaBalanceScale />}
                  loading={loading}
                  tone="blue"
                />
                <MetricCard
                  title="Ganancia estimada"
                  value={money(resumen.gananciaEstimada)}
                  caption="Ganancia bruta evaluada"
                  icon={<FaChartLine />}
                  loading={loading}
                  tone="emerald"
                  featured
                />
                <MetricCard
                  title="Margen ponderado"
                  value={percent(resumen.margenPonderado)}
                  caption="Sobre ventas evaluadas"
                  icon={<FaPercentage />}
                  loading={loading}
                  tone="violet"
                />
                <MetricCard
                  title="Productos vendidos"
                  value={number(resumen.productosVendidos, 0)}
                  caption={`${number(calidad.productosVendidosSinCosto, 0)} sin costo`}
                  icon={<FaBoxOpen />}
                  loading={loading}
                  tone="amber"
                />
              </section>

              {!loading && (calidad.productosVendidosSinCosto > 0 || calidad.lineasSinProducto > 0) && (
                <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <QualityCard
                    title="Ventas no evaluadas"
                    value={money(calidad.ventasNoEvaluadas)}
                    detail="No participan en el margen ponderado."
                  />
                  <QualityCard
                    title="Productos vendidos sin costo"
                    value={number(calidad.productosVendidosSinCosto, 0)}
                    detail={`Venta asociada: ${money(calidad.ventasSinCosto)}`}
                  />
                  <QualityCard
                    title="Líneas sin producto"
                    value={number(calidad.lineasSinProducto, 0)}
                    detail={`Venta sin coincidencia: ${money(calidad.ventasSinProducto)}`}
                  />
                  {calidad.notasCreditoSinProducto > 0 && (
                    <QualityCard
                      title="Créditos no asignados"
                      value={number(calidad.notasCreditoSinProducto, 0)}
                      detail="Reducen la ganancia global sin revertir costo de un producto."
                    />
                  )}
                </section>
              )}

              {(data?.mensual || []).length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Ganancia por mes</h2>
                      <p className="text-xs text-gray-500">Comparación dentro del rango seleccionado</p>
                    </div>
                    <FaChartLine className="text-blue-600" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {data.mensual.map((item) => {
                      const positive = Number(item.gananciaEstimada) >= 0;
                      return (
                        <div key={item.mes} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold uppercase text-gray-500">{item.mes}</span>
                            <span className={`text-sm font-black ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                              {money(item.gananciaEstimada)}
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${positive ? "bg-emerald-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.max(4, (Math.abs(Number(item.gananciaEstimada) || 0) / monthlyMax) * 100)}%` }}
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-[11px] text-gray-500">
                            <span>Ventas {money(item.ventasNetas)}</span>
                            <span>Margen {percent(item.margen)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Rentabilidad general de productos</h2>
                      <p className="text-xs text-gray-500">Margen de catálogo y resultado del período seleccionado</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 sm:w-72">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Buscar producto, código o barra..."
                          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-xs text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-blue-500"
                      >
                        <option value="all">Todos los productos</option>
                        <option value="sold">Vendidos en el período</option>
                        <option value="missingCost">Sin costo registrado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1280px] w-full text-xs">
                    <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Producto</th>
                        <th className="px-3 py-3 text-right">Precio IVA incl.</th>
                        <th className="px-3 py-3 text-right">Costo IVA incl.</th>
                        <th className="px-3 py-3 text-right">Ganancia unitaria</th>
                        <th className="px-3 py-3 text-center">Margen catálogo</th>
                        <th className="px-3 py-3 text-center">Markup</th>
                        <th className="px-3 py-3 text-right">Unidades</th>
                        <th className="px-3 py-3 text-right">Ventas netas</th>
                        <th className="px-3 py-3 text-right">Costo estimado</th>
                        <th className="px-3 py-3 text-right">Ganancia período</th>
                        <th className="px-3 py-3 text-center">Margen período</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        Array.from({ length: 8 }).map((_, index) => (
                          <tr key={index}>
                            {Array.from({ length: 11 }).map((__, column) => (
                              <td key={column} className="px-3 py-3">
                                <div className="h-3 animate-pulse rounded bg-gray-100" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : paginatedProducts.length > 0 ? (
                        paginatedProducts.map((producto) => {
                          const sold = Number(producto.periodo?.unidadesVendidas || 0) !== 0;
                          return (
                            <tr key={producto.id} className="transition hover:bg-blue-50/40">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{producto.nombre}</div>
                                <div className="mt-0.5 flex gap-2 text-[10px] text-gray-400">
                                  <span>{producto.codigo}</span>
                                  {producto.codigoBarras && <span>· {producto.codigoBarras}</span>}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-gray-700">{money(producto.precioBruto)}</td>
                              <td className="px-3 py-3 text-right">
                                {producto.tieneCosto
                                  ? <span className="font-semibold text-gray-700">{money(producto.costoBruto)}</span>
                                  : <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">Sin costo</span>}
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-emerald-700">
                                {producto.tieneCosto ? money(producto.gananciaUnitaria) : "—"}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex min-w-[62px] justify-center rounded-full px-2 py-1 font-black ${marginTone(producto.margenCatalogo)}`}>
                                  {percent(producto.margenCatalogo)}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center font-semibold text-gray-600">{percent(producto.markupCatalogo)}</td>
                              <td className="px-3 py-3 text-right font-bold text-gray-700">{sold ? number(producto.periodo.unidadesVendidas, 4) : "—"}</td>
                              <td className="px-3 py-3 text-right font-semibold text-gray-700">{sold ? money(producto.periodo.ventasNetas) : "—"}</td>
                              <td className="px-3 py-3 text-right text-gray-600">{sold && producto.tieneCosto ? money(producto.periodo.costoEstimado) : "—"}</td>
                              <td className={`px-3 py-3 text-right font-black ${Number(producto.periodo?.gananciaEstimada) < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                                {sold && producto.tieneCosto ? money(producto.periodo.gananciaEstimada) : "—"}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex min-w-[62px] justify-center rounded-full px-2 py-1 font-black ${marginTone(sold ? producto.periodo.margen : null)}`}>
                                  {sold ? percent(producto.periodo.margen) : "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="11" className="px-4 py-12 text-center text-gray-400">
                            <FaBoxOpen className="mx-auto mb-2 text-3xl text-gray-200" />
                            No se encontraron productos con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {!loading && productos.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">
                      Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, productos.length)} de {productos.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 hover:border-blue-400 hover:text-blue-700 disabled:opacity-40"
                      >
                        Anterior
                      </button>
                      <span className="font-bold text-gray-700">{currentPage} / {pageCount}</span>
                      <button
                        type="button"
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 hover:border-blue-400 hover:text-blue-700 disabled:opacity-40"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, caption, icon, loading, tone, featured = false }) {
  const iconTones = {
    slate: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <article className={`relative overflow-hidden rounded-xl border p-3 transition-all hover:shadow-md sm:p-4 ${featured ? "border-blue-700 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-900"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${featured ? "text-blue-200" : "text-gray-500"}`}>
            {title}
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-current opacity-10" />
          ) : (
            <p className="mt-1 truncate text-lg font-black">{value}</p>
          )}
          <p className={`mt-2 text-[10px] ${featured ? "text-blue-100" : "text-gray-500"}`}>{caption}</p>
        </div>
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${featured ? "bg-blue-500 text-white" : iconTones[tone]}`}>{icon}</span>
      </div>
    </article>
  );
}

function QualityCard({ title, value, detail }) {
  return (
    <article className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-amber-600" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">{title}</p>
          <p className="mt-1 text-lg font-black text-amber-900">{value}</p>
          <p className="mt-1 text-[11px] text-amber-700">{detail}</p>
        </div>
      </div>
    </article>
  );
}
