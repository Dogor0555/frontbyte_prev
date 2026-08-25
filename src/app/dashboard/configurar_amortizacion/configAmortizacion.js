"use client";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";
import { FaPlus, FaEdit, FaTrash, FaCog, FaPercent, FaCalendarAlt } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function ConfigAmortizacionView({ user, hasHaciendaToken, haciendaStatus, initialConfigs }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configs, setConfigs] = useState(initialConfigs || []);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: "", tasa_interes_anual: "", tasa_mora_mensual: "", plazo_maximo_meses: "12" });

  const abrirCrear = () => { setEditando(null); setForm({ nombre: "", tasa_interes_anual: "", tasa_mora_mensual: "", plazo_maximo_meses: "12" }); setShowModal(true); };
  const abrirEditar = (c) => { setEditando(c); setForm({ nombre: c.nombre || "", tasa_interes_anual: c.tasa_interes_anual || "", tasa_mora_mensual: c.tasa_mora_mensual || "", plazo_maximo_meses: c.plazo_maximo_meses || "12" }); setShowModal(true); };

  const recargar = async () => {
    try { const r = await fetch(`${API_BASE_URL}/amortizacion-config`, { credentials: "include" }); if (r.ok) setConfigs(await r.json()); } catch (_) {}
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const url = editando ? `${API_BASE_URL}/amortizacion-config/${editando.idconfig}` : `${API_BASE_URL}/amortizacion-config`;
      const resp = await fetch(url, { method: editando ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...form, tasa_interes_anual: Number(form.tasa_interes_anual), tasa_mora_mensual: Number(form.tasa_mora_mensual || 0), plazo_maximo_meses: Number(form.plazo_maximo_meses) }) });
      const json = await resp.json();
      if (resp.ok) { addToast(editando ? "Configuración actualizada" : "Configuración creada", "success"); setShowModal(false); recargar(); }
      else addToast(json.error || "Error", "error");
    } catch (_) { addToast("Error de conexión", "error"); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta configuración?")) return;
    try {
      const r = await fetch(`${API_BASE_URL}/amortizacion-config/${id}`, { method: "DELETE", credentials: "include" });
      if (r.ok) { addToast("Eliminada", "success"); recargar(); }
      else { const j = await r.json(); addToast(j.error, "error"); }
    } catch (_) { addToast("Error", "error"); }
  };

  const calcMensual = (anual) => {
    if (!anual) return 0;
    return ((Math.pow(1 + Number(anual) / 100, 1 / 12) - 1) * 100).toFixed(2);
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
            <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FaCog className="text-blue-600" /> Configurar Amortización</h1>
        <button onClick={abrirCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FaPlus /> Nueva Configuración</button>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow text-gray-400"><FaCog className="text-4xl mx-auto mb-3" /><p>No hay configuraciones creadas</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-center"><FaPercent className="inline" /> Tasa Anual</th>
              <th className="px-4 py-3 text-center">Tasa Mensual</th>
              <th className="px-4 py-3 text-center">Mora Mensual</th>
              <th className="px-4 py-3 text-center"><FaCalendarAlt className="inline" /> Plazo Máx</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr></thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.idconfig} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-center">{Number(c.tasa_interes_anual).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-center text-blue-600">{Number(c.tasa_interes_mensual).toFixed(4)}%</td>
                  <td className="px-4 py-3 text-center text-orange-600">{Number(c.tasa_mora_mensual).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-center">{c.plazo_maximo_meses} meses</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => abrirEditar(c)} className="text-blue-600 hover:text-blue-800 mr-3"><FaEdit /></button>
                    <button onClick={() => eliminar(c.idconfig)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editando ? "Editar Configuración" : "Nueva Configuración"}</h2>
              <form onSubmit={guardar} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Francés 12%" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Tasa Interés Anual (%) *</label><input type="number" step="0.01" required value={form.tasa_interes_anual} onChange={(e) => setForm({ ...form, tasa_interes_anual: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  {form.tasa_interes_anual && <p className="text-xs text-gray-500 mt-1">Mensual equivalente: <span className="font-semibold text-blue-600">{calcMensual(form.tasa_interes_anual)}%</span></p>}
                </div>
                <div><label className="block text-sm font-medium mb-1">Tasa Mora Mensual (%)</label><input type="number" step="0.01" value={form.tasa_mora_mensual} onChange={(e) => setForm({ ...form, tasa_mora_mensual: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Plazo Máximo (meses) *</label><input type="number" min="1" required value={form.plazo_maximo_meses} onChange={(e) => setForm({ ...form, plazo_maximo_meses: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-sm">Cancelar</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">{editando ? "Actualizar" : "Crear"}</button>
                </div>
              </form>
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
