"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { addToast } from "../components/Toast";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaMapMarkerAlt, FaRulerCombined, FaDollarSign, FaCalendarAlt } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";

export default function LotesView({ user, hasHaciendaToken, haciendaStatus, initialLotes, initialStats }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lotes, setLotes] = useState(initialLotes?.data || []);
  const [stats, setStats] = useState(initialStats);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialLotes?.pages || 1);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ codigo_lote: "", nombre_lote: "", direccion: "", metro_cuadrado: "", precio_venta: "", descripcion: "" });
  const [loading, setLoading] = useState(false);

  const cargarLotes = async (p = 1) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/lotes?page=${p}&limit=20`;
      if (filtroEstado) url += `&estado=${filtroEstado}`;
      if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
      const resp = await fetch(url, { credentials: "include" });
      if (resp.ok) {
        const json = await resp.json();
        setLotes(json.data || []);
        setTotalPages(json.pages || 1);
        setPage(json.page || 1);
      }
    } catch (e) { addToast("Error al cargar lotes", "error"); }
    setLoading(false);
  };

  const cargarStats = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/lotes/stats`, { credentials: "include" });
      if (resp.ok) setStats(await resp.json());
    } catch (_) {}
  };

  useEffect(() => { cargarLotes(1); cargarStats(); }, [filtroEstado]);

  const buscar = (e) => { e.preventDefault(); cargarLotes(1); };

  const abrirCrear = () => { setEditando(null); setForm({ codigo_lote: "", nombre_lote: "", direccion: "", metro_cuadrado: "", precio_venta: "", descripcion: "" }); setShowModal(true); };
  const abrirEditar = (lote) => { setEditando(lote); setForm({ codigo_lote: lote.codigo_lote || "", nombre_lote: lote.nombre_lote || "", direccion: lote.direccion || "", metro_cuadrado: lote.metro_cuadrado || "", precio_venta: lote.precio_venta || "", descripcion: lote.descripcion || "" }); setShowModal(true); };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const url = editando ? `${API_BASE_URL}/lotes/${editando.idlote}` : `${API_BASE_URL}/lotes`;
      const method = editando ? "PUT" : "POST";
      const resp = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      const json = await resp.json();
      if (resp.ok) { addToast(editando ? "Lote actualizado" : "Lote creado", "success"); setShowModal(false); cargarLotes(page); cargarStats(); }
      else addToast(json.error || "Error al guardar", "error");
    } catch (_) { addToast("Error de conexión", "error"); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este lote?")) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/lotes/${id}`, { method: "DELETE", credentials: "include" });
      if (resp.ok) { addToast("Lote eliminado", "success"); cargarLotes(page); cargarStats(); }
      else { const j = await resp.json(); addToast(j.error || "Error", "error"); }
    } catch (_) { addToast("Error de conexión", "error"); }
  };

  const estadoConfig = {
    disponible: { bg: "bg-gradient-to-br from-emerald-500 to-green-600", badge: "bg-emerald-100 text-emerald-800 border border-emerald-300", ring: "ring-emerald-200", label: "DISPONIBLE" },
    asignado: { bg: "bg-gradient-to-br from-amber-500 to-orange-500", badge: "bg-amber-100 text-amber-800 border border-amber-300", ring: "ring-amber-200", label: "ASIGNADO" },
    vendido: { bg: "bg-gradient-to-br from-red-500 to-rose-600", badge: "bg-red-100 text-red-800 border border-red-300", ring: "ring-red-200", label: "VENDIDO" },
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FaMapMarkerAlt className="text-blue-600" /> Gestión de Lotes</h1>
        <button onClick={abrirCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"><FaPlus /> Nuevo Lote</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-200 p-5 text-white text-center">
            <p className="text-3xl font-extrabold">{stats.total || 0}</p>
            <p className="text-sm text-blue-100 font-medium">Total Lotes</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-green-200 p-5 text-white text-center">
            <p className="text-3xl font-extrabold">{stats.disponibles || 0}</p>
            <p className="text-sm text-green-100 font-medium">Disponibles</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-200 p-5 text-white text-center">
            <p className="text-3xl font-extrabold">{stats.asignados || 0}</p>
            <p className="text-sm text-amber-100 font-medium">Asignados</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-200 p-5 text-white text-center">
            <p className="text-3xl font-extrabold">{stats.vendidos || 0}</p>
            <p className="text-sm text-red-100 font-medium">Vendidos</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={buscar} className="flex gap-2 flex-1">
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por código, nombre o dirección..." className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"><FaSearch /></button>
        </form>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="vendido">Vendido</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
      ) : lotes.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><FaMapMarkerAlt className="text-4xl mx-auto mb-3 text-gray-300" /><p>No se encontraron lotes</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lotes.map((lote) => {
            const ec = estadoConfig[lote.estado] || estadoConfig.disponible;
            return (
              <div key={lote.idlote} className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ring-1 ${ec.ring}`}>
                <div className={`${ec.bg} px-5 py-4 text-white relative`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/70 mb-0.5">Código</p>
                      <p className="text-2xl font-extrabold tracking-wide">{lote.codigo_lote}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${ec.badge}`}>{ec.label}</span>
                  </div>
                  {lote.nombre_lote && <p className="text-sm text-white/90 mt-1 font-medium">{lote.nombre_lote}</p>}
                </div>

                <div className="p-5">
                  {lote.direccion && (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                      <FaMapMarkerAlt className="text-red-400 flex-shrink-0" /> <span className="truncate">{lote.direccion}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    {lote.metro_cuadrado && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <FaRulerCombined className="text-blue-400" /> {Number(lote.metro_cuadrado).toLocaleString()} m²
                      </div>
                    )}
                    {lote.dia_pago && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <FaCalendarAlt className="text-purple-400" /> Día {lote.dia_pago}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Precio de Venta</p>
                    <p className="text-2xl font-extrabold text-green-700">${Number(lote.precio_venta).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Día pago: <span className="font-semibold">{lote.dia_pago || "—"}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => abrirEditar(lote)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm py-2 rounded-lg flex items-center justify-center gap-1.5 transition font-medium"><FaEdit /> Editar</button>
                    {lote.estado === "disponible" && <button onClick={() => eliminar(lote.idlote)} className="bg-red-50 hover:bg-red-100 text-red-700 text-sm py-2 px-3 rounded-lg transition"><FaTrash /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => cargarLotes(page - 1)} className="px-3 py-1 rounded border disabled:opacity-40">Anterior</button>
          <span className="px-3 py-1 text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => cargarLotes(page + 1)} className="px-3 py-1 rounded border disabled:opacity-40">Siguiente</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editando ? "Editar Lote" : "Nuevo Lote"}</h2>
              <form onSubmit={guardar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Código *</label><input type="text" required value={form.codigo_lote} onChange={(e) => setForm({ ...form, codigo_lote: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium mb-1">Nombre</label><input type="text" value={form.nombre_lote} onChange={(e) => setForm({ ...form, nombre_lote: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">Dirección</label><input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Metros²</label><input type="number" step="0.01" value={form.metro_cuadrado} onChange={(e) => setForm({ ...form, metro_cuadrado: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Venta *</label><input type="number" step="0.01" required value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" /></div>
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
