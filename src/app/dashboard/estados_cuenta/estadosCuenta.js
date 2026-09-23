"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import {
  FaFileInvoiceDollar,
  FaUser,
  FaIdCard,
  FaEnvelope,
  FaHashtag,
  FaPrint,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaAdjust,
} from "react-icons/fa";

const fmt = (v) => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EstadosCuentaView({ user, hasHaciendaToken, haciendaStatus, clientes: clientesInit }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState(clientesInit || []);

  useEffect(() => {
    if (!clientesInit || clientesInit.length === 0) {
      fetch(`${API_BASE_URL}/clientes/getAllCli`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then((j) => setClientes(Array.isArray(j) ? j : []))
        .catch(() => {});
    }
  }, [clientesInit]);

  const cargarEstadoCuenta = async (id) => {
    if (!id) { setData(null); return; }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/estados-cuenta/cliente/${id}`, { credentials: "include" });
      if (resp.ok) {
        const json = await resp.json();
        setData(json);
      } else {
        let msg = "Error al obtener el estado de cuenta";
        try { const j = await resp.json(); msg = j.error || msg; } catch (_) {}
        addToast(msg, "error");
        setData(null);
      }
    } catch (_) {
      addToast("Error de conexión al obtener el estado de cuenta", "error");
      setData(null);
    }
    setLoading(false);
  };

  const onSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    cargarEstadoCuenta(id);
  };

  const clienteSeleccionado =
    data?.cliente ||
    clientes.find((c) => String(c.idcliente) === String(selectedId)) ||
    null;

  const creditos = Array.isArray(data)
    ? data
    : data?.creditos || data?.data?.creditos || [];

  return (
    <div className="flex h-screen text-black bg-blue-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <Navbar user={user} hasHaciendaToken={hasHaciendaToken} haciendaStatus={haciendaStatus} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
      {/* Encabezado y selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaFileInvoiceDollar className="text-blue-600" /> Estados de Cuenta
        </h1>
        <button
          onClick={() => window.print()}
          disabled={!data}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FaPrint /> Imprimir Estado de Cuenta
        </button>
      </div>

      <div className="mb-6 print:hidden">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <select
          value={selectedId}
          onChange={onSelect}
          className="w-full sm:max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">Seleccione un cliente...</option>
          {(clientes || []).map((c) => (
            <option key={c.idcliente} value={c.idcliente}>
              {c.nombre} {c.dui ? `- ${c.dui}` : ""}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-16 print:hidden">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {!loading && !selectedId && (
        <div className="text-center py-16 bg-white rounded-xl shadow border border-gray-100 text-gray-400 print:hidden">
          <FaFileInvoiceDollar className="text-5xl mx-auto mb-3" />
          <p>Seleccione un cliente para consultar su estado de cuenta</p>
        </div>
      )}

      {!loading && selectedId && data && (
        <Documento
          cliente={clienteSeleccionado}
          creditos={creditos}
          user={user}
        />
      )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function Documento({ cliente, creditos, user }) {
  const hoy = new Date().toLocaleDateString("es-SV", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden print:shadow-none print:border-0">
      {/* Encabezado tipo documento bancario */}
      <div className="border-b-4 border-double border-gray-800 px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold tracking-widest uppercase text-gray-900">ByteFusion SV</h2>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Estado de Cuenta de Créditos</p>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-0.5">
            <p><span className="font-semibold">Fecha de emisión:</span> {hoy}</p>
            {cliente?.idcliente && <p><span className="font-semibold">No. expediente:</span> CLI-{String(cliente.idcliente).padStart(6, "0")}</p>}
            {user?.nombre && <p><span className="font-semibold">Atendido por:</span> {user.nombre}</p>}
          </div>
        </div>
      </div>

      {/* Resumen del cliente */}
      {cliente && (
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
            <FaUser className="text-blue-600" /> Datos del Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <InfoItem icon={<FaUser />} label="Nombre" value={cliente.nombre} />
            <InfoItem icon={<FaIdCard />} label="DUI" value={cliente.dui || "N/A"} />
            <InfoItem icon={<FaHashtag />} label="NIT" value={cliente.nit || "N/A"} />
            <InfoItem icon={<FaEnvelope />} label="Correo" value={cliente.correo || "N/A"} />
          </div>
        </div>
      )}

      {/* Créditos */}
      <div className="px-6 py-5 space-y-8">
        {creditos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaFileInvoiceDollar className="text-4xl mx-auto mb-3" />
            <p>El cliente no tiene créditos registrados</p>
          </div>
        ) : (
          creditos.map((credito, idx) => (
            <CreditoSeccion key={credito.idcredito || idx} credito={credito} indice={idx + 1} />
          ))
        )}
      </div>

      {/* Pie del documento */}
      <div className="border-t border-gray-200 px-6 py-4 text-center text-[11px] text-gray-400 uppercase tracking-widest">
        Documento generado electrónicamente · ByteFusion SV · {hoy}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-blue-600 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
        <p className="text-gray-800 font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function CreditoSeccion({ credito, indice }) {
  const cuotas = credito.cuotas || [];
  const montoFinanciado = Number(credito.monto_financiado || 0);
  const cuotaMensual = Number(credito.cuota_mensual || 0);
  const totalPagado = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
  const saldoTotal = Math.max(montoFinanciado - totalPagado, 0);
  const progreso = montoFinanciado > 0 ? Math.min((totalPagado / montoFinanciado) * 100, 100) : 0;

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Cabecera del crédito */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-300">Crédito #{credito.idcredito}</p>
          <p className="font-semibold">
            Contrato {String(indice).padStart(2, "0")} · {credito.plazo_meses} meses
            {credito.estado ? ` · ${credito.estado}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-slate-300">Cuota mensual</p>
          <p className="text-lg font-bold">{fmt(cuotaMensual)}</p>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
        <ResumenItem label="Monto Financiado" value={fmt(montoFinanciado)} />
        <ResumenItem label="Total Pagado" value={fmt(totalPagado)} valueClass="text-green-700" />
        <ResumenItem label="Saldo Pendiente" value={fmt(saldoTotal)} valueClass="text-red-700" />
      </div>

      {/* Barra de progreso */}
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span className="font-medium uppercase tracking-wide">Avance de pago</span>
          <span className="font-bold text-gray-800">{progreso.toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progreso >= 100 ? "bg-green-500" : "bg-blue-600"}`}
            style={{ width: `${progreso}%` }}
          ></div>
        </div>
      </div>

      {/* Tabla de amortización */}
      <div className="px-5 py-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
          <FaCalendarAlt className="text-blue-600" /> Tabla de Amortización
        </h4>
        {cuotas.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay cuotas registradas para este crédito</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase tracking-wide">
                  <th className="px-3 py-2.5 text-left font-semibold">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Fecha</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Capital</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Interés</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Pagado</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Saldo</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((cu) => (
                  <tr key={cu.idcuota || cu.numero_cuota} className={`border-t border-gray-100 ${filaColor(cu.estado)}`}>
                    <td className="px-3 py-2 text-center text-gray-500">{cu.numero_cuota}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{cu.fecha_vencimiento}</td>
                    <td className="px-3 py-2 text-right">{fmt(cu.monto_capital)}</td>
                    <td className="px-3 py-2 text-right">{fmt(cu.monto_interes)}</td>
                    <td className="px-3 py-2 text-right font-medium">{fmt(cu.monto_total)}</td>
                    <td className="px-3 py-2 text-right text-green-700">{fmt(cu.monto_pagado)}</td>
                    <td className="px-3 py-2 text-right">{fmt(cu.saldo_pendiente)}</td>
                    <td className="px-3 py-2 text-center"><EstadoBadge estado={cu.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <PagosHistorial cuotas={cuotas} />
    </section>
  );
}

function ResumenItem({ label, value, valueClass = "" }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function filaColor(estado) {
  switch (estado) {
    case "pagada": return "bg-green-50";
    case "parcial": return "bg-yellow-50";
    case "vencida": return "bg-red-50";
    default: return "bg-white";
  }
}

function EstadoBadge({ estado }) {
  const config = {
    pagada: { texto: "Pagada", clases: "bg-green-100 text-green-700 border-green-300", icono: <FaCheckCircle /> },
    parcial: { texto: "Parcial", clases: "bg-yellow-100 text-yellow-700 border-yellow-300", icono: <FaAdjust /> },
    vencida: { texto: "Vencida", clases: "bg-red-100 text-red-700 border-red-300", icono: <FaExclamationTriangle /> },
    pendiente: { texto: "Pendiente", clases: "bg-gray-100 text-gray-500 border-gray-300", icono: <FaClock /> },
  };
  const c = config[estado] || config.pendiente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${c.clases}`}>
      {c.icono} {c.texto}
    </span>
  );
}

function PagosHistorial({ cuotas }) {
  const pagos = cuotas
    .filter((c) => Number(c.monto_pagado || 0) > 0)
    .map((c) => ({
      fecha: c.fecha_ultimo_pago || c.fecha_pago || c.fecha_vencimiento,
      monto: Number(c.monto_pagado),
      cuota: c.numero_cuota,
    }));

  if (pagos.length === 0) return null;

  const total = pagos.reduce((acc, p) => acc + p.monto, 0);

  return (
    <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
        <FaMoneyBillWave className="text-green-600" /> Historial de Pagos
      </h4>
      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white max-h-56 overflow-y-auto">
        {pagos.map((p, i) => (
          <li key={i} className="flex justify-between items-center px-4 py-2 text-sm hover:bg-green-50/50">
            <span className="text-gray-600">
              Cuota #{p.cuota} — <span className="text-gray-800 font-medium">{p.fecha}</span>
            </span>
            <span className="font-semibold text-green-700">{fmt(p.monto)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-end mt-2 text-sm">
        <span className="text-gray-500 mr-3 uppercase tracking-wide text-xs font-semibold self-center">Total pagado:</span>
        <span className="font-bold text-green-700">{fmt(total)}</span>
      </div>
    </div>
  );
}
