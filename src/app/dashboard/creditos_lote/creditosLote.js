"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";
import { FaCreditCard, FaSearch, FaEye, FaExchangeAlt, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaPlus } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function CreditosLoteView({ user, hasHaciendaToken, haciendaStatus, initialCreditos }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creditos, setCreditos] = useState(initialCreditos?.data || []);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialCreditos?.pages || 1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [selectedCredito, setSelectedCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferId, setTransferId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteNuevo, setClienteNuevo] = useState("");
  const [motivo, setMotivo] = useState("");

  // Nuevo Crédito modal state
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [nuevoClientes, setNuevoClientes] = useState([]);
  const [nuevoLotes, setNuevoLotes] = useState([]);
  const [nuevoLoadingData, setNuevoLoadingData] = useState(false);
  const [guardandoCredito, setGuardandoCredito] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    idcliente: "",
    lotes_ids: [],
    monto_total_lote: "",
    prima: "",
    monto_financiado: "",
    plazo_meses: "",
    dia_pago: "",
    fecha_inicio: ""
  });
  const [plazoUnidad, setPlazoUnidad] = useState("meses");
  const [showTabla, setShowTabla] = useState(false);

  const cargar = async (p = 1) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/creditos-lote?page=${p}&limit=20`;
      if (filtroEstado) url += `&estado=${filtroEstado}`;
      if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
      const resp = await fetch(url, { credentials: "include" });
      if (resp.ok) { const j = await resp.json(); setCreditos(j.data || []); setTotalPages(j.pages || 1); setPage(j.page || 1); }
    } catch (_) { addToast("Error al cargar", "error"); }
    setLoading(false);
  };

  useEffect(() => { cargar(1); }, [filtroEstado]);

  const verDetalle = async (id) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/creditos-lote/${id}`, { credentials: "include" });
      if (resp.ok) setSelectedCredito(await resp.json());
    } catch (_) { addToast("Error al cargar detalle", "error"); }
  };

  const abrirTransferir = async (id) => {
    setTransferId(id);
    try {
      const resp = await fetch(`${API_BASE_URL}/clientes/getAllCli`, { credentials: "include" });
      if (resp.ok) { const j = await resp.json(); setClientes(Array.isArray(j) ? j : []); }
    } catch (_) {}
    setShowTransferModal(true);
  };

  const transferir = async () => {
    if (!clienteNuevo) { addToast("Seleccione un cliente", "error"); return; }
    try {
      const resp = await fetch(`${API_BASE_URL}/creditos-lote/${transferId}/transferir`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ idcliente_nuevo: Number(clienteNuevo), motivo }) });
      if (resp.ok) { addToast("Crédito transferido", "success"); setShowTransferModal(false); cargar(page); if (selectedCredito?.idcredito === transferId) verDetalle(transferId); }
      else { const j = await resp.json(); addToast(j.error, "error"); }
    } catch (_) { addToast("Error", "error"); }
  };

  const abrirNuevoCredito = async () => {
    setShowNuevoModal(true);
    setFormNuevo({     idcliente: "", lotes_ids: [], monto_total_lote: "", prima: "", monto_financiado: "", plazo_meses: "", dia_pago: "", fecha_inicio: "" });
    setPlazoUnidad("meses");
    setNuevoLoadingData(true);
    try {
      const [resCli, resLotes] = await Promise.all([
        fetch(`${API_BASE_URL}/clientes/getAllCli`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/lotes?estado=disponible&limit=100`, { credentials: "include" }),
      ]);
      if (resCli.ok) { const j = await resCli.json(); setNuevoClientes(Array.isArray(j) ? j : j.data || []); }
      if (resLotes.ok) { const j = await resLotes.json(); setNuevoLotes(Array.isArray(j) ? j : j.data || []); }
    } catch (_) { addToast("Error al cargar datos del formulario", "error"); }
    setNuevoLoadingData(false);
  };

  const toggleLoteNuevo = (idLote) => {
    setFormNuevo((prev) => {
      const yaEsta = prev.lotes_ids.includes(idLote);
      const nuevosIds = yaEsta ? prev.lotes_ids.filter((id) => id !== idLote) : [...prev.lotes_ids, idLote];
      const total = nuevoLotes.filter((l) => nuevosIds.includes(l.idlote ?? l.id_lote)).reduce((acc, l) => acc + Number(l.precio_venta || 0), 0);
      const primaNum = Number(prev.prima || 0);
      const financiado = Math.max(0, total - primaNum);
      return { ...prev, lotes_ids: nuevosIds, monto_total_lote: nuevosIds.length ? String(total.toFixed(2)) : "", monto_financiado: nuevosIds.length ? String(financiado.toFixed(2)) : "" };
    });
  };

  const cambiarPrima = (valor) => {
    setFormNuevo((prev) => {
      const primaNum = Number(valor || 0);
      const total = Number(prev.monto_total_lote || 0);
      const financiado = Math.max(0, total - primaNum);
      return { ...prev, prima: valor, monto_financiado: String(financiado.toFixed(2)) };
    });
  };

  const TASA_INTERES_ANUAL = 7.9;
  const PLAZO_MAXIMO_MESES = 240;
  const tasaMensualFija = TASA_INTERES_ANUAL / 12;

  const plazoEnMeses = plazoUnidad === "años" ? Number(formNuevo.plazo_meses || 0) * 12 : Number(formNuevo.plazo_meses || 0);
  const plazoMaximoDisplay = plazoUnidad === "años" ? Math.floor(PLAZO_MAXIMO_MESES / 12) : PLAZO_MAXIMO_MESES;
  const plazoExcedido = plazoEnMeses > PLAZO_MAXIMO_MESES;

  let vistaPrevia = null;
  const montoFinanciado = Number(formNuevo.monto_financiado || 0);
  if (montoFinanciado > 0 && plazoEnMeses > 0) {
    const tasa = TASA_INTERES_ANUAL / 100;
    const n = plazoEnMeses;
    const factor = Math.pow(1 + tasa / 12, n);
    const cuotaMensual = montoFinanciado * ((tasa / 12) * factor) / (factor - 1);
    if (isFinite(cuotaMensual) && cuotaMensual > 0) {
      const totalPagar = cuotaMensual * n;
      vistaPrevia = { cuotaMensual, totalCapital: montoFinanciado, totalIntereses: totalPagar - montoFinanciado, totalPagar };
    }
  }

  const fmtDinero = (v) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const guardarNuevoCredito = async () => {
    if (!formNuevo.idcliente || formNuevo.lotes_ids.length === 0 || !formNuevo.monto_total_lote || !formNuevo.plazo_meses || plazoEnMeses <= 0 || !formNuevo.dia_pago || !formNuevo.fecha_inicio) {
      addToast("Complete todos los campos requeridos", "error");
      return;
    }
    if (plazoExcedido) { addToast(`El plazo no puede exceder 20 años (240 meses)`, "error"); return; }
    setGuardandoCredito(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/creditos-lote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idcliente: Number(formNuevo.idcliente),
          lotes_ids: formNuevo.lotes_ids,
          monto_total_lote: Number(formNuevo.monto_total_lote || 0),
          prima: Number(formNuevo.prima || 0),
          plazo_meses: plazoEnMeses,
          dia_pago: Number(formNuevo.dia_pago),
          fecha_inicio: formNuevo.fecha_inicio,
        })
      });
      const j = resp.ok ? await resp.json().catch(() => null) : await resp.json().catch(() => null);
      if (resp.ok) {
        addToast("Crédito creado exitosamente", "success");
        setShowNuevoModal(false);
        cargar(1);
      } else {
        addToast(j?.error || "Error al crear el crédito", "error");
      }
    } catch (_) { addToast("Error al crear el crédito", "error"); }
    setGuardandoCredito(false);
  };

  const estadoIcon = (e) => {
    const icons = { activo: <FaClock className="text-blue-500" />, pagado: <FaCheckCircle className="text-green-500" />, cancelado: <FaTimesCircle className="text-gray-500" />, vencido: <FaExclamationTriangle className="text-red-500" /> };
    return icons[e] || null;
  };

  return (
    <div className="flex h-screen text-black bg-blue-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar user={user} hasHaciendaToken={hasHaciendaToken} haciendaStatus={haciendaStatus} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FaCreditCard className="text-blue-600" /> Créditos de Lotificación</h1>
        <button onClick={abrirNuevoCredito} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow">
          <FaPlus /> Nuevo Crédito
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); cargar(1); }} className="flex gap-2 flex-1">
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por cliente..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"><FaSearch /></button>
        </form>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="pagado">Pagado</option>
          <option value="cancelado">Cancelado</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
      ) : creditos.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><FaCreditCard className="text-4xl mx-auto mb-3" /><p>No hay créditos de lotificación</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Lote(s)</th>
              <th className="px-4 py-3 text-right">Financiado</th>
              <th className="px-4 py-3 text-right">Cuota</th>
              <th className="px-4 py-3 text-center">Plazo</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr></thead>
            <tbody>
              {creditos.map((c) => (
                <tr key={c.idcredito} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.cliente?.nombre || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.lotes_asignados?.map((l) => l.lote?.codigo_lote).join(", ") || "N/A"}</td>
                  <td className="px-4 py-3 text-right">${Number(c.monto_financiado).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${Number(c.cuota_mensual).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{c.plazo_meses}m</td>
                  <td className="px-4 py-3 text-center"><span className="flex items-center gap-1 justify-center">{estadoIcon(c.estado)} {c.estado}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => verDetalle(c.idcredito)} className="text-blue-600 hover:text-blue-800 mr-2"><FaEye /></button>
                    {c.estado === "activo" && <button onClick={() => abrirTransferir(c.idcredito)} className="text-orange-600 hover:text-orange-800"><FaExchangeAlt /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => cargar(page - 1)} className="px-3 py-1 rounded border disabled:opacity-40">Anterior</button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => cargar(page + 1)} className="px-3 py-1 rounded border disabled:opacity-40">Siguiente</button>
        </div>
      )}

      {selectedCredito && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Crédito #${selectedCredito.idcredito}</h2>
                <button onClick={() => setSelectedCredito(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">{selectedCredito.cliente?.nombre}</span></div>
                <div><span className="text-gray-500">Estado:</span> <span className="font-medium capitalize">{selectedCredito.estado}</span></div>
                <div><span className="text-gray-500">Financiado:</span> <span className="font-medium">${Number(selectedCredito.monto_financiado).toLocaleString()}</span></div>
                <div><span className="text-gray-500">Cuota mensual:</span> <span className="font-medium">${Number(selectedCredito.cuota_mensual).toLocaleString()}</span></div>
                <div><span className="text-gray-500">Plazo:</span> <span className="font-medium">{selectedCredito.plazo_meses} meses</span></div>
                <div><span className="text-gray-500">Día pago:</span> <span className="font-medium">{selectedCredito.dia_pago}</span></div>
              </div>
              {selectedCredito.lotes_asignados?.length > 0 && (
                <div className="mb-4"><h3 className="font-semibold mb-2">Lotes</h3>
                  {selectedCredito.lotes_asignados.map((l, i) => <div key={i} className="text-sm bg-gray-50 p-2 rounded">{l.lote?.codigo_lote} - {l.lote?.nombre_lote || l.lote?.direccion}</div>)}
                </div>
              )}

              {(() => {
                const pagos = selectedCredito.pagos || [];
                const cuotas = selectedCredito.cuotas || [];
                const totalPagado = pagos.reduce((s, p) => s + Number(p.monto_pago || 0), 0);
                const cuotasPagadas = cuotas.filter(c => c.estado === "pagada");
                const cuotasParciales = cuotas.filter(c => c.estado === "parcial" || (Number(c.monto_pagado || 0) > 0 && c.estado !== "pagada"));
                const cuotasVencidas = cuotas.filter(c => c.estado === "vencida");
                const totalFinanciado = Number(selectedCredito.monto_financiado || 0);
                const capitalAbonadoPagadas = cuotasPagadas.reduce((s, c) => s + Number(c.monto_capital || 0), 0);
                const capitalAbonadoParciales = cuotasParciales.reduce((s, c) => {
                  const pagado = Number(c.monto_pagado || 0);
                  const interes = Number(c.monto_interes || 0);
                  return s + Math.max(0, pagado - interes);
                }, 0);
                const totalCapitalPagado = capitalAbonadoPagadas + capitalAbonadoParciales;
                const interesPagadoPagadas = cuotasPagadas.reduce((s, c) => s + Number(c.monto_interes || 0), 0);
                const interesPagadoParciales = cuotasParciales.reduce((s, c) => {
                  const pagado = Number(c.monto_pagado || 0);
                  const interes = Number(c.monto_interes || 0);
                  return s + Math.min(pagado, interes);
                }, 0);
                const totalInteresPagado = interesPagadoPagadas + interesPagadoParciales;
                const saldoCapital = totalFinanciado - totalCapitalPagado;
                if (pagos.length === 0 && cuotasPagadas === 0) return null;
                return (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Resumen de Pagos</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div><span className="text-gray-500 block text-xs">Total pagado</span><span className="font-bold text-green-700">${totalPagado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div><span className="text-gray-500 block text-xs">Capital abonado</span><span className="font-semibold">${totalCapitalPagado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div><span className="text-gray-500 block text-xs">Intereses pagados</span><span className="font-semibold">${totalInteresPagado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div><span className="text-gray-500 block text-xs">Saldo capital</span><span className="font-semibold text-orange-700">${saldoCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div><span className="text-gray-500 block text-xs">Cuotas pagadas</span><span className="font-semibold">{cuotasPagadas.length} / {cuotas.length}</span></div>
                      {cuotasParciales.length > 0 && <div><span className="text-gray-500 block text-xs">Cuotas parciales</span><span className="font-semibold text-yellow-600">{cuotasParciales.length}</span></div>}
                      {cuotasVencidas.length > 0 && <div><span className="text-gray-500 block text-xs">Cuotas vencidas</span><span className="font-semibold text-red-600">{cuotasVencidas.length}</span></div>}
                      <div><span className="text-gray-500 block text-xs">Nro. pagos registrados</span><span className="font-semibold">{pagos.length}</span></div>
                    </div>
                    {pagos.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">Ver historial de pagos ({pagos.length})</summary>
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100"><tr>
                              <th className="px-2 py-1">Fecha</th><th className="px-2 py-1 text-right">Monto</th><th className="px-2 py-1">Tipo</th><th className="px-2 py-1 text-right">Capital</th><th className="px-2 py-1 text-right">Interés</th>
                            </tr></thead>
                            <tbody>
                              {pagos.map((p) => (
                                <tr key={p.idpago} className="border-t">
                                  <td className="px-2 py-1">{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : "—"}</td>
                                  <td className="px-2 py-1 text-right font-medium">${Number(p.monto_pago || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-2 py-1">{p.tipo_pago || "—"}</td>
                                  <td className="px-2 py-1 text-right">${Number(p.monto_aplicado_capital || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                  <td className="px-2 py-1 text-right">${Number(p.monto_aplicado_interes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })()}

              {selectedCredito.cuotas?.length > 0 && (
                <div className="mb-4">
                  <button onClick={() => setShowTabla(!showTabla)} className="font-semibold mb-2 flex items-center gap-2 text-sm hover:text-blue-600">
                    Tabla de Amortización <span className="text-xs text-gray-400">({showTabla ? "ocultar" : "mostrar"})</span>
                  </button>
                  {showTabla && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100"><tr>
                        <th className="px-2 py-1">#</th><th className="px-2 py-1">Vence</th><th className="px-2 py-1 text-right">Capital</th><th className="px-2 py-1 text-right">Interés</th><th className="px-2 py-1 text-right">Total</th><th className="px-2 py-1 text-right">Pagado</th><th className="px-2 py-1 text-right">Saldo</th><th className="px-2 py-1">Estado</th>
                      </tr></thead>
                      <tbody>
                        {selectedCredito.cuotas.map((cu) => (
                          <tr key={cu.idcuota} className={`border-t ${cu.estado === "pagada" ? "bg-green-50" : cu.estado === "vencida" ? "bg-red-50" : cu.estado === "parcial" ? "bg-yellow-50" : ""}`}>
                            <td className="px-2 py-1 text-center">{cu.numero_cuota}</td>
                            <td className="px-2 py-1">{cu.fecha_vencimiento}</td>
                            <td className="px-2 py-1 text-right">${Number(cu.monto_capital).toFixed(2)}</td>
                            <td className="px-2 py-1 text-right">${Number(cu.monto_interes).toFixed(2)}</td>
                            <td className="px-2 py-1 text-right font-medium">${Number(cu.monto_total).toFixed(2)}</td>
                            <td className="px-2 py-1 text-right text-green-600">${Number(cu.monto_pagado).toFixed(2)}</td>
                            <td className="px-2 py-1 text-right">${Number(cu.saldo_pendiente).toFixed(2)}</td>
                            <td className="px-2 py-1 text-center"><span className={`text-xs font-semibold ${cu.estado === "pagada" ? "text-green-600" : cu.estado === "vencida" ? "text-red-600" : cu.estado === "parcial" ? "text-yellow-600" : "text-gray-500"}`}>{cu.estado}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Transferir Crédito</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nuevo Cliente *</label>
                <select value={clienteNuevo} onChange={(e) => setClienteNuevo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cl) => <option key={cl.idcliente} value={cl.idcliente}>{cl.nombre}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Motivo</label><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowTransferModal(false)} className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-sm">Cancelar</button>
                <button onClick={transferir} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm">Transferir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNuevoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><FaPlus className="text-blue-600" /> Nuevo Crédito</h2>
                <button onClick={() => setShowNuevoModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>

              {nuevoLoadingData ? (
                <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cliente *</label>
                    <select value={formNuevo.idcliente} onChange={(e) => setFormNuevo({ ...formNuevo, idcliente: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">Seleccionar cliente...</option>
                      {nuevoClientes.map((cl) => <option key={cl.idcliente} value={cl.idcliente}>{cl.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Lotes Disponibles * <span className="text-gray-400 font-normal">({formNuevo.lotes_ids.length} seleccionados)</span></label>
                    {nuevoLotes.length === 0 ? (
                      <p className="text-sm text-gray-400 border rounded-lg p-3">No hay lotes disponibles</p>
                    ) : (
                      <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                        {nuevoLotes.map((l) => {
                          const lid = l.idlote ?? l.id_lote;
                          const checked = formNuevo.lotes_ids.includes(lid);
                          return (
                            <label key={lid} className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${checked ? "bg-blue-50" : ""}`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleLoteNuevo(lid)} className="accent-blue-600" />
                              <span className="font-medium">{l.codigo_lote || l.codigo}</span>
                              <span className="text-gray-500 truncate flex-1">{l.nombre_lote || l.nombre || ""}</span>
                              <span className="text-gray-700 whitespace-nowrap">${Number(l.precio_venta || 0).toLocaleString()}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Valor Total de la Propiedad ($) *</label>
                    <input type="number" step="0.01" value={formNuevo.monto_total_lote} readOnly placeholder="Se calcula automáticamente" className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Prima / Anticipo ($)</label>
                      <input type="number" step="0.01" min="0" value={formNuevo.prima} onChange={(e) => cambiarPrima(e.target.value)} placeholder="0.00" className="w-full border rounded-lg px-3 py-2 text-sm" />
                      <p className="text-xs text-gray-400 mt-1">Se resta del valor total para calcular el monto financiado</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Monto a Financiar ($) *</label>
                      <input type="number" step="0.01" value={formNuevo.monto_financiado} readOnly placeholder="Se calcula automáticamente" className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" />
                      <p className="text-xs text-gray-400 mt-1">Valor total - Prima</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 space-y-0.5">
                    <p className="font-semibold text-gray-800">Condiciones del Financiamiento</p>
                    <p>Tasa de interés anual: <span className="font-semibold">{TASA_INTERES_ANUAL}%</span> (fija)</p>
                    <p>Tasa de interés mensual: <span className="font-semibold">{tasaMensualFija.toFixed(4)}%</span></p>
                    <p>Plazo máximo: <span className="font-semibold">20 años (240 meses)</span></p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Plazo *</label>
                      <div className="flex">
                        <input
                          type="number"
                          min="1"
                          max={plazoMaximoDisplay > 0 ? plazoMaximoDisplay : undefined}
                          value={formNuevo.plazo_meses}
                          onChange={(e) => setFormNuevo({ ...formNuevo, plazo_meses: e.target.value })}
                          placeholder={plazoUnidad === "años" ? "Ej: 2" : "Ej: 12"}
                          className={`flex-1 border rounded-l-lg px-3 py-2 text-sm ${plazoExcedido ? "border-red-500 ring-1 ring-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setPlazoUnidad(plazoUnidad === "meses" ? "años" : "meses")}
                          className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-sm font-medium hover:bg-gray-200 whitespace-nowrap"
                        >
                          {plazoUnidad === "meses" ? "meses" : "años"}
                        </button>
                      </div>
                      {plazoExcedido && <p className="text-xs text-red-600 mt-1 font-medium">El plazo excede el máximo de 20 años (240 meses)</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Día Pago *</label>
                      <select value={formNuevo.dia_pago} onChange={(e) => setFormNuevo({ ...formNuevo, dia_pago: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="">Día...</option>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha Inicio *</label>
                      <input type="date" value={formNuevo.fecha_inicio} onChange={(e) => setFormNuevo({ ...formNuevo, fecha_inicio: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>

                  {vistaPrevia && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-sm mb-3 text-blue-900">Vista Previa Amortización</h3>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <span className="text-gray-600">Cuota mensual:</span>
                        <span className="text-right font-semibold">{fmtDinero(vistaPrevia.cuotaMensual)}</span>
                        <span className="text-gray-600">Plazo:</span>
                        <span className="text-right">{plazoEnMeses} meses{plazoUnidad === "años" && Number(formNuevo.plazo_meses) > 0 ? ` (${Number(formNuevo.plazo_meses)} ${Number(formNuevo.plazo_meses) === 1 ? "año" : "años"})` : ""}</span>
                        <span className="text-gray-600">Tasa mensual:</span>
                        <span className="text-right">{tasaMensualFija.toFixed(4)}%</span>
                        <span className="text-gray-600">Total capital:</span>
                        <span className="text-right">{fmtDinero(vistaPrevia.totalCapital)}</span>
                        <span className="text-gray-600">Total intereses:</span>
                        <span className="text-right">{fmtDinero(vistaPrevia.totalIntereses)}</span>
                        <span className="text-gray-600 font-medium">Total a pagar:</span>
                        <span className="text-right font-semibold text-blue-800">{fmtDinero(vistaPrevia.totalPagar)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNuevoModal(false)} className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-sm">Cancelar</button>
                    <button onClick={guardarNuevoCredito} disabled={guardandoCredito || plazoExcedido} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                      {guardandoCredito ? (<><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Guardando...</>) : (<>Crear Crédito</>)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
