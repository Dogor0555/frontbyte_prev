"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";
import { FaReceipt, FaDollarSign, FaCalendarAlt, FaHistory, FaFileInvoice, FaCheckCircle, FaTimes, FaBuilding, FaUser, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function PagosLoteView({ user, sucursalUsuario, hasHaciendaToken, haciendaStatus, creditosActivos }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creditoId, setCreditoId] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [form, setForm] = useState({ monto_pago: "", fecha_pago: new Date().toISOString().slice(0, 10), tipo_pago: "cuota", observaciones: "" });
  const [generarDte, setGenerarDte] = useState(false);
  const [tipoDte, setTipoDte] = useState("03");
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [cargandoDte, setCargandoDte] = useState(false);
  const [showDteModal, setShowDteModal] = useState(false);
  const [dtePreview, setDtePreview] = useState(null);

  const fmtMoney = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const txtVal = (v) => (v == null ? "" : typeof v === "object" ? v.nombre || v.descripcion || "" : String(v));

  const calcularMontos = (monto, tipo, capital = 0, interes = 0) => {
    // Tanto DTE-01 como DTE-03: IVA INCLUIDO en el monto total
    // totalPagar = capital + interes + IVA = monto
    // interes = (monto - capital) / 1.13
    const totalnogravado = Number(capital);
    const ventagravada = (Number(monto) - Number(capital)) / 1.13;
    const iva = ventagravada * 0.13;
    return {
      ventaGravada: Math.round(ventagravada * 100) / 100,
      ventaExenta: 0,
      noGravado: totalnogravado,
      iva: Math.round(iva * 100) / 100,
      totalGravada: Math.round(ventagravada * 100) / 100,
      totalNoGravado: totalnogravado,
      subTotalVentas: Math.round(ventagravada * 100) / 100,
      montoTotalOperacion: Math.round((ventagravada + iva) * 100) / 100,
      totalPagar: Number(monto),
    };
  };

  const [cuotaActual, setCuotaActual] = useState(null);

  const seleccionar = async (id) => {
    if (!id) { setCreditoId(""); setDetalle(null); setPagos([]); setCuotaActual(null); return; }
    setCreditoId(id);
    setLoading(true);
    try {
      const [cr, pr] = await Promise.all([
        fetch(`${API_BASE_URL}/creditos-lote/${id}`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/pagos-lote/credito/${id}`, { credentials: "include" }),
      ]);
      if (cr.ok) {
        const data = await cr.json();
        setDetalle(data);
        const cuotasPend = data.cuotas?.filter((c) => c.estado !== "pagada") || [];
        if (cuotasPend.length > 0) {
          setCuotaActual(cuotasPend[0]);
          setForm((prev) => ({ ...prev, monto_pago: String(Number(cuotasPend[0].monto_total).toFixed(2)) }));
        } else {
          setCuotaActual(null);
        }
      }
      if (pr.ok) setPagos(await pr.json());
    } catch (_) { addToast("Error al cargar", "error"); }
    setLoading(false);
  };

  const construirBody = () => {
    const body = { idcredito: Number(creditoId), ...form, monto_pago: Number(form.monto_pago) };
    if (cuotaActual) {
      body.monto_capital = Number(cuotaActual.monto_capital);
      body.monto_interes = Number(cuotaActual.monto_interes);
    }
    if (generarDte && (tipoDte === "01" || tipoDte === "03")) {
      body.generar_dte = true;
      body.tipo_dte = tipoDte;
    }
    return body;
  };

  const enviarPago = async (body) => {
    setRegistrando(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/pagos-lote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await resp.json();
      if (resp.ok) {
        addToast("Pago registrado" + (json.data?.dte?.iddtefactura ? " + DTE generado" : ""), "success");
        setResultado(json.data);
        setShowDteModal(false);
        setForm({ monto_pago: "", fecha_pago: new Date().toISOString().slice(0, 10), tipo_pago: "cuota", observaciones: "" });
        setGenerarDte(false);
        seleccionar(creditoId);
      } else addToast(json.error || "Error al registrar el pago", "error");
    } catch (_) { addToast("Error de conexion", "error"); }
    setRegistrando(false);
  };

  const prepararDte = async () => {
    if (!detalle) return;
    setCargandoDte(true);
    try {
      let cliente = detalle.cliente || null;
      if ((!cliente || !Object.keys(cliente).length) && detalle.idcliente) {
        const resp = await fetch(`${API_BASE_URL}/clientes/${detalle.idcliente}`, { credentials: "include" });
        if (resp.ok) {
          const json = await resp.json();
          cliente = json.data || json;
        }
      }

      const monto = Number(form.monto_pago);
      const lotesTxt = detalle.lotes_asignados?.map((la) => la.lote?.codigo_lote).filter(Boolean).join(", ");
      const cuotasPend = detalle.cuotas?.filter((c) => c.estado !== "pagada") || [];
      const totalCuotas = detalle.cuotas?.length || detalle.plazo_meses || 0;
      const cuotaNum = totalCuotas - cuotasPend.length + 1;
      const tieneNit = !!(cliente?.nit && String(cliente.nit).trim());

      const capital = cuotaActual ? Number(cuotaActual.monto_capital) : 0;
      const interes = cuotaActual ? Number(cuotaActual.monto_interes) : 0;

      const suc = sucursalUsuario || {};
      const dirEmisor = suc.direccion
        ? [txtVal(suc.direccion.complemento), txtVal(suc.direccion.municipio), txtVal(suc.direccion.departamento)].filter(Boolean).join(", ")
        : [txtVal(user?.complemento), txtVal(user?.municipio), txtVal(user?.departamento)].filter(Boolean).join(", ");

      const items = [
        {
          numItem: 1,
          tipoItem: 2,
          cantidad: 1,
          codigo: "3225",
          uniMedida: 99,
          descripcion: `Capital - Cuota ${cuotaNum}/${totalCuotas} - Credito #${creditoId}${lotesTxt ? " - Lote(s): " + lotesTxt : ""}`,
          precioUni: 0,
          montoDescu: 0,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada: 0,
          psv: 0,
          noGravado: capital,
          numeroDocumento: null,
          codTributo: null,
          tributos: null,
        },
        {
          numItem: 2,
          tipoItem: 2,
          cantidad: 1,
          codigo: "3210",
          uniMedida: 99,
          descripcion: "Intereses Corrientes",
          precioUni: interes,
          montoDescu: 0,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada: interes,
          tributos: ["20"],
          psv: 0,
          noGravado: 0,
          numeroDocumento: null,
          codTributo: null,
        },
      ];

      const montos = calcularMontos(monto, tipoDte, capital, interes);

      setDtePreview({
        monto,
        capital,
        interes,
        cuotaNum,
        totalCuotas,
        montos,
        emisor: {
          nombre: suc.nombre || suc.nombrecomercial || user?.empresa || user?.nombre || "-",
          nit: suc.nit || user?.nit || "-",
          nrc: suc.nrc || user?.nrc || "-",
          direccion: dirEmisor || "-",
          actividad: suc.desactividad || suc.descactividad || user?.desactividad || user?.descactividad || "-",
          telefono: suc.telefono || user?.telefono || "-",
          correo: suc.correo || user?.correo || "-",
          codestablemh: suc.codestablemh || user?.codestablemh || "-",
          codpuntoventa: suc.codpuntoventa || user?.codpuntoventa || "-",
        },
        receptor: {
          nombre: cliente?.nombre || "-",
          docLabel: tieneNit ? "NIT" : "DUI",
          numDocumento: tieneNit ? String(cliente.nit) : "00000000",
          tipoDocumento: tieneNit ? "36" : "37",
          nrc: cliente?.nrc || "-",
          direccion: txtVal(cliente?.direccion) || "-",
          telefono: cliente?.telefono || "-",
          correo: cliente?.correo || "-",
        },
        items,
        saldoAnterior: Number(detalle.monto_financiado) || 0,
        saldoActual: (Number(detalle.monto_financiado) || 0) - capital,
      });
      setShowDteModal(true);
    } catch (_) {
      addToast("Error al preparar el comprobante DTE", "error");
    }
    setCargandoDte(false);
  };

  const handleTipoDteChange = (valor) => {
    setTipoDte(valor);
    setDtePreview((prev) => {
      if (!prev) return prev;
      return { ...prev, montos: calcularMontos(prev.monto, valor, prev.capital, prev.interes) };
    });
  };

  const confirmarDte = async () => {
    await enviarPago(construirBody());
  };

  const registrar = async (e) => {
    e.preventDefault();
    if (!creditoId) return;
    const monto = Number(form.monto_pago);
    if (!monto || monto <= 0) { addToast("Ingrese un monto valido", "error"); return; }
    if (generarDte && (tipoDte === "01" || tipoDte === "03")) {
      await prepararDte();
      return;
    }
    await enviarPago(construirBody());
  };

  const cuotasPendientes = detalle?.cuotas?.filter((c) => c.estado !== "pagada") || [];
  const cuotaMensual = Number(detalle?.cuota_mensual || 0);
  const totalPendiente = cuotasPendientes.reduce((s, c) => s + Number(c.monto_total) - Number(c.monto_pagado), 0);
  const montos = dtePreview
    ? dtePreview.montos
    : calcularMontos(Number(form.monto_pago) || 0, tipoDte, cuotaActual ? Number(cuotaActual.monto_capital) : 0, cuotaActual ? Number(cuotaActual.monto_interes) : 0);

  return (
    <div className="flex h-screen text-black bg-blue-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar user={user} hasHaciendaToken={hasHaciendaToken} haciendaStatus={haciendaStatus} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6"><FaReceipt className="text-blue-600" /> Registrar Pagos</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Seleccionar Crédito Activo</label>
        <select value={creditoId} onChange={(e) => seleccionar(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="">-- Seleccionar credito --</option>
          {creditosActivos.map((c) => (
            <option key={c.idcredito} value={c.idcredito}>
              {c.cliente?.nombre || `Credito #${c.idcredito}`} - Cuota: ${Number(c.cuota_mensual).toLocaleString()} - {c.plazo_meses} meses
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>}

      {detalle && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><FaDollarSign /> Informacion del Credito</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Cliente:</span><span className="font-medium">{detalle.cliente?.nombre}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Lote(s):</span><span className="font-medium">{detalle.lotes_asignados?.map((la) => la.lote?.codigo_lote).filter(Boolean).join(", ") || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Financiado:</span><span className="font-medium">${Number(detalle.monto_financiado).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cuota mensual:</span><span className="font-bold text-blue-600">${cuotaMensual.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cuotas pendientes:</span><span className="font-medium">{cuotasPendientes.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total pendiente:</span><span className="font-bold text-red-600">${totalPendiente.toLocaleString()}</span></div>
            </div>

            <form onSubmit={registrar} className="mt-6 space-y-3 border-t pt-4">
              <h3 className="font-semibold text-sm">Registrar Pago</h3>
              <div><label className="block text-xs text-gray-500 mb-1">Monto ($) *</label><input type="number" step="0.01" min="0.01" required value={form.monto_pago} onChange={(e) => setForm({ ...form, monto_pago: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0.00" /></div>
              <div><label className="block text-xs text-gray-500 mb-1"><FaCalendarAlt className="inline" /> Fecha *</label><input type="date" required value={form.fecha_pago} onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Tipo de Pago</label>
                <select value={form.tipo_pago} onChange={(e) => setForm({ ...form, tipo_pago: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="cuota">Cuota fija</option>
                  <option value="adelanto">Adelanto</option>
                  <option value="parcial">Pago parcial</option>
                </select>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">Observaciones</label><textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" /></div>

              <div className="border-t pt-3 mt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={generarDte} onChange={(e) => setGenerarDte(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                  <span className="text-sm font-medium flex items-center gap-1"><FaFileInvoice className="text-blue-500" /> Generar DTE fiscal</span>
                </label>
                {generarDte && (
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <label className="block text-xs text-gray-500 mb-1">Tipo de DTE</label>
                    <select value={tipoDte} onChange={(e) => setTipoDte(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="03">DTE-03 Crédito Fiscal</option>
                      <option value="01">DTE-01 Consumidor Final</option>
                    </select>
                    <p className="text-[11px] text-gray-400">
                      Capital como monto no gravado, intereses gravados al 13% IVA
                    </p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={registrando || cargandoDte} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
                {registrando ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Registrando...</> : cargandoDte ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Preparando DTE...</> : "Registrar Pago"}
              </button>
            </form>

            {resultado && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                <p className="font-bold text-green-800 mb-2">Pago Registrado</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Capital:</span><span className="font-medium">${Number(resultado.montoAplicadoCapital).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Interes:</span><span className="font-medium">${Number(resultado.montoAplicadoInteres).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Mora:</span><span className="font-medium">${Number(resultado.montoAplicadoMora).toFixed(2)}</span></div>
                  {Number(resultado.sobrante) > 0 && <div className="flex justify-between text-blue-600"><span>Sobrante:</span><span className="font-medium">${Number(resultado.sobrante).toFixed(2)}</span></div>}
                </div>
                {resultado.dte && resultado.dte.iddtefactura && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="font-bold text-blue-800 flex items-center gap-1 mb-1"><FaFileInvoice /> DTE Generado</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Tipo:</span><span className="font-medium">DTE-{resultado.dte.tipo_dte} {resultado.dte.tipo_dte === "03" ? "Crédito Fiscal" : "Consumidor Final"}</span></div>
                      <div className="flex justify-between"><span>N. Control:</span><span className="font-medium">{resultado.dte.ncontrol}</span></div>
                      <div className="flex justify-between"><span>Código Gen:</span><span className="font-medium text-[10px]">{resultado.dte.codigogen}</span></div>
                      <div className="flex justify-between"><span>Estado:</span><span className={`font-medium ${resultado.dte.estado === "TRANSMITIDO" ? "text-green-700" : "text-yellow-700"}`}>{resultado.dte.estado}</span></div>
                    </div>
                  </div>
                )}
                {resultado.dte && resultado.dte.error && (
                  <div className="mt-3 pt-3 border-t border-red-300">
                    <p className="text-red-700 text-xs">DTE no generado: {resultado.dte.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><FaHistory /> Historial de Pagos</h2>
            {pagos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No hay pagos registrados</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pagos.map((p) => (
                  <div key={p.idpago} className="border rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-green-700">${Number(p.monto_pago).toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        {p.iddtefactura && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"><FaCheckCircle /> DTE</span>}
                        <span className="text-xs text-gray-500">{p.fecha_pago}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="capitalize">{p.tipo_pago}</span>
                      <span>C: ${Number(p.monto_aplicado_capital).toFixed(2)} | I: ${Number(p.monto_aplicado_interes).toFixed(2)}</span>
                    </div>
                    {p.observaciones && <p className="text-xs text-gray-400 mt-1">{p.observaciones}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {showDteModal && dtePreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><FaFileInvoice /> Comprobante DTE - Detalles</h3>
              <button onClick={() => setShowDteModal(false)} disabled={registrando} className="hover:bg-white/20 rounded-lg p-1.5 transition"><FaTimes /></button>
            </div>

            <div className="p-6 space-y-4">
              {!hasHaciendaToken && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-xs text-yellow-800">
                  <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                  <span>No hay token vigente con Hacienda. El pago se registrará y el DTE quedará pendiente de transmisión.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 border-b px-3 py-2 text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2"><FaBuilding /> Emisor</div>
                  <div className="p-3 space-y-1.5 text-xs">
                    <p><span className="text-gray-400">Nombre: </span><span className="font-medium">{dtePreview.emisor.nombre}</span></p>
                    <p><span className="text-gray-400">NIT: </span><span className="font-medium">{dtePreview.emisor.nit}</span></p>
                    <p><span className="text-gray-400">NRC: </span><span className="font-medium">{dtePreview.emisor.nrc}</span></p>
                    <p><span className="text-gray-400">Dirección: </span><span className="font-medium">{dtePreview.emisor.direccion}</span></p>
                    <p><span className="text-gray-400">Actividad: </span><span className="font-medium">{dtePreview.emisor.actividad}</span></p>
                    <p><span className="text-gray-400">Tel: </span><span className="font-medium">{dtePreview.emisor.telefono}</span> <span className="text-gray-400">· Email: </span><span className="font-medium break-all">{dtePreview.emisor.correo}</span></p>
                    <p><span className="text-gray-400">Estab./Pto.Vta MH: </span><span className="font-medium">{dtePreview.emisor.codestablemh} / {dtePreview.emisor.codpuntoventa}</span></p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 border-b px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2"><FaUser /> Receptor</div>
                  <div className="p-3 space-y-1.5 text-xs">
                    <p><span className="text-gray-400">Nombre: </span><span className="font-medium">{dtePreview.receptor.nombre}</span></p>
                    <p><span className="text-gray-400">{dtePreview.receptor.docLabel}: </span><span className="font-medium">{dtePreview.receptor.numDocumento}</span> <span className="text-[10px] text-gray-400">(cat. {dtePreview.receptor.tipoDocumento})</span></p>
                    <p><span className="text-gray-400">NRC: </span><span className="font-medium">{dtePreview.receptor.nrc}</span></p>
                    <p><span className="text-gray-400">Dirección: </span><span className="font-medium">{dtePreview.receptor.direccion}</span></p>
                    <p><span className="text-gray-400">Tel: </span><span className="font-medium">{dtePreview.receptor.telefono}</span> <span className="text-gray-400">· Email: </span><span className="font-medium break-all">{dtePreview.receptor.correo}</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo DTE</label>
                  <select value={tipoDte} onChange={(e) => handleTipoDteChange(e.target.value)} disabled={registrando} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="03">DTE-03 Crédito Fiscal</option>
                    <option value="01">DTE-01 Consumidor Final</option>
                  </select>
                </div>
                <p className="text-[11px] text-gray-400 sm:text-right">Fecha de emisión: {new Date().toISOString().slice(0, 10)} · Moneda: USD</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 border-b px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2"><FaFileAlt /> Detalle</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-3 py-2 w-8">#</th>
                      <th className="px-3 py-2">Codigo</th>
                      <th className="px-3 py-2">Descripción</th>
                      <th className="px-3 py-2 text-center w-14">Cant.</th>
                      <th className="px-3 py-2 text-right w-24">Gravada</th>
                      <th className="px-3 py-2 text-right w-24">No Gravado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dtePreview.items.map((it) => (
                      <tr key={it.numItem} className="border-t odd:bg-white even:bg-gray-50">
                        <td className="px-3 py-2">{it.numItem}</td>
                        <td className="px-3 py-2 font-mono text-[10px]">{it.codigo}</td>
                        <td className="px-3 py-2">{it.descripcion}</td>
                        <td className="px-3 py-2 text-center">{it.cantidad}</td>
                        <td className="px-3 py-2 text-right font-medium">{it.ventaGravada > 0 ? `$${fmtMoney(it.ventaGravada)}` : "-"}</td>
                        <td className="px-3 py-2 text-right font-medium">{it.noGravado > 0 ? `$${fmtMoney(it.noGravado)}` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-gray-500">Venta gravada (Intereses):</span><span className="font-medium">${fmtMoney(montos.ventaGravada)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">No gravado (Capital):</span><span className="font-medium">${fmtMoney(montos.noGravado)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">IVA 13% (solo intereses):</span><span className="font-medium">${fmtMoney(montos.iva)}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold">Total a pagar:</span><span className="font-bold text-green-700 text-base">${fmtMoney(montos.totalPagar)}</span></div>
                {dtePreview.saldoAnterior > 0 && (
                  <>
                    <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-500">Saldo anterior:</span><span className="font-medium">${fmtMoney(dtePreview.saldoAnterior)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Abono a capital:</span><span className="font-medium text-blue-600">-${fmtMoney(dtePreview.capital)}</span></div>
                    <div className="flex justify-between"><span className="font-bold">Saldo actual:</span><span className="font-bold text-green-700">${fmtMoney(dtePreview.saldoActual)}</span></div>
                  </>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Condición:</span><span className="font-medium">Crédito</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Forma de pago:</span><span className="font-medium">Cuota mensual</span></div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t pt-4">
                <button onClick={() => setShowDteModal(false)} disabled={registrando} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-semibold transition">
                  Cancelar
                </button>
                <button onClick={confirmarDte} disabled={registrando} className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
                  {registrando ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Transmitiendo...</> : <><FaCheckCircle /> Confirmar y Transmitir</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
