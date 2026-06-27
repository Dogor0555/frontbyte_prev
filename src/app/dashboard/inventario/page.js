"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaBoxOpen, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaMinus, FaPlus as FaPlusIcon, FaInfoCircle } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { API_BASE_URL } from "@/lib/api";

// ========== UNIDADES DE MEDIDA (mismas que en compras) ==========
const unidadesDisponibles = [
    { codigo: "1", nombre: "metro" },
    { codigo: "2", nombre: "Yarda" },
    { codigo: "6", nombre: "milímetro" },
    { codigo: "9", nombre: "kilómetro cuadrado" },
    { codigo: "10", nombre: "Hectárea" },
    { codigo: "13", nombre: "metro cuadrado" },
    { codigo: "15", nombre: "Vara cuadrada" },
    { codigo: "18", nombre: "metro cúbico" },
    { codigo: "20", nombre: "Barril" },
    { codigo: "22", nombre: "Galón" },
    { codigo: "23", nombre: "Litro" },
    { codigo: "24", nombre: "Botella" },
    { codigo: "26", nombre: "Mililitro" },
    { codigo: "30", nombre: "Tonelada" },
    { codigo: "32", nombre: "Quintal" },
    { codigo: "33", nombre: "Arroba" },
    { codigo: "34", nombre: "Kilogramo" },
    { codigo: "36", nombre: "Libra" },
    { codigo: "37", nombre: "Onza troy" },
    { codigo: "38", nombre: "Onza" },
    { codigo: "39", nombre: "Gramo" },
    { codigo: "40", nombre: "Miligramo" },
    { codigo: "42", nombre: "Megawatt" },
    { codigo: "43", nombre: "Kilowatt" },
    { codigo: "44", nombre: "Watt" },
    { codigo: "45", nombre: "Megavoltio-amperio" },
    { codigo: "46", nombre: "Kilovoltio-amperio" },
    { codigo: "47", nombre: "Voltio-amperio" },
    { codigo: "49", nombre: "Gigawatt-hora" },
    { codigo: "50", nombre: "Megawatt-hora" },
    { codigo: "51", nombre: "Kilowatt-hora" },
    { codigo: "52", nombre: "Watt-hora" },
    { codigo: "53", nombre: "Kilovoltio" },
    { codigo: "54", nombre: "Voltio" },
    { codigo: "55", nombre: "Millar" },
    { codigo: "56", nombre: "Medio millar" },
    { codigo: "57", nombre: "Ciento" },
    { codigo: "58", nombre: "Docena" },
    { codigo: "59", nombre: "Unidad" },
    { codigo: "99", nombre: "Otra" },
    { codigo: "Caja", nombre: "Caja" }
];

// ========== TOAST NOTIFICATION ==========
const Toast = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 360 }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-lg border px-4 py-3"
                    style={{
                        borderLeftWidth: 4,
                        borderLeftStyle: 'solid',
                        borderLeftColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#2563eb',
                        opacity: toast.leaving ? 0 : 1,
                        transform: toast.leaving ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease'
                    }}
                >
                    <div className="mt-0.5 flex-shrink-0">
                        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{toast.title}</p>
                        <p className="text-sm text-gray-600">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
            ))}
        </div>
    );
};

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = ({ type = 'info', title, message, duration = 4000 }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message, leaving: false }]);
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
        }, duration);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    };

    return { toasts, addToast, removeToast };
};

const getNombreUnidad = (codigo) => {
    const unidad = unidadesDisponibles.find(u => u.codigo === codigo);
    return unidad ? unidad.nombre : "Unidad";
};

export default function InventarioMP() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [proveedores, setProveedores] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    // Modal states
    const [openModal, setOpenModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Stock adjustment modal
    const [openStockModal, setOpenStockModal] = useState(false);
    const [stockAction, setStockAction] = useState(null); // 'increment' or 'decrement'
    const [stockMateria, setStockMateria] = useState(null);
    const [stockCantidad, setStockCantidad] = useState("");
    const [stockCosto, setStockCosto] = useState("");

    // Form state
    const [form, setForm] = useState({
        nombre: "",
        codigo: "",
        unidad: "59",
        costo_promedio: "",
        precio_sugerido: "",
        stock_minimo: "",
        descripcion: "",
        idproveedor: ""
    });

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/materias-primas`, {
                credentials: "include"
            });
            const json = await res.json();
            setData(Array.isArray(json) ? json : (json.data || []));
        } catch (error) {
            console.error("Error fetching materias primas:", error);
        }
    };

    const fetchProveedores = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/proveedores/getAll`, {
                credentials: "include"
            });
            const json = await res.json();
            setProveedores(Array.isArray(json) ? json : (json.data || []));
        } catch (error) {
            console.error("Error fetching proveedores:", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchProveedores();
    }, []);

    const filtered = data.filter((item) =>
        item.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        item.codigo?.toLowerCase().includes(search.toLowerCase())
    );

    const getStockColor = (stock) => {
        const numStock = Number(stock || 0);
        if (numStock <= 10) return "text-red-500 bg-red-50";
        if (numStock <= 30) return "text-yellow-500 bg-yellow-50";
        return "text-green-600 bg-green-50";
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const resetForm = () => {
        setForm({
            nombre: "",
            codigo: "",
            unidad: "59",
            costo_promedio: "",
            precio_sugerido: "",
            stock_minimo: "",
            descripcion: "",
            idproveedor: ""
        });
        setIsEditing(false);
        setSelectedId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = isEditing 
                ? `${API_BASE_URL}/materias-primas/${selectedId}`
                : `${API_BASE_URL}/materias-primas`;
            
            const method = isEditing ? "PUT" : "POST";

            const payload = {
                nombre: form.nombre,
                codigo: form.codigo || `MP-${Date.now()}`,
                unidad: form.unidad,
                costo_promedio: parseFloat(form.costo_promedio) || 0,
                precio_sugerido: form.precio_sugerido ? parseFloat(form.precio_sugerido) : null,
                stock_minimo: parseFloat(form.stock_minimo) || 0,
                descripcion: form.descripcion || null,
                idproveedor: form.idproveedor ? parseInt(form.idproveedor) : null
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const dataRes = await res.json();

            if (!res.ok) {
                throw new Error(dataRes.error || dataRes.message || "Error al guardar");
            }

            await fetchData();
            resetForm();
            setOpenModal(false);
            addToast({
                type: 'success',
                title: isEditing ? 'Materia Prima Actualizada' : 'Materia Prima Creada',
                message: `${form.nombre} ha sido ${isEditing ? 'actualizada' : 'agregada'} correctamente.`
            });
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (item) => {
        setForm({
            nombre: item.nombre,
            codigo: item.codigo || "",
            unidad: item.unidad || "59",
            costo_promedio: item.costo_promedio || "",
            precio_sugerido: item.precio_sugerido || "",
            stock_minimo: item.stock_minimo || "",
            descripcion: item.descripcion || "",
            idproveedor: item.idproveedor || ""
        });
        setIsEditing(true);
        setSelectedId(item.id);
        setOpenModal(true);
    };

    const handleDelete = async (id, nombre) => {
        if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/materias-primas/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const dataRes = await res.json();

            if (!res.ok) {
                throw new Error(dataRes.error || "Error al eliminar");
            }

            await fetchData();
            addToast({
                type: 'success',
                title: 'Materia Prima Eliminada',
                message: `${nombre} ha sido eliminada.`
            });
        } catch (error) {
            console.error("Error deleting:", error);
            addToast({ type: 'error', title: 'Error', message: error.message });
        }
    };

    const handleOpenStockModal = (item, action) => {
        setStockMateria(item);
        setStockAction(action);
        setStockCantidad("");
        setStockCosto("");
        setOpenStockModal(true);
    };

    const handleStockAdjustment = async () => {
        if (!stockCantidad || parseFloat(stockCantidad) <= 0) {
            addToast({ type: 'error', title: 'Error', message: 'Ingrese una cantidad válida' });
            return;
        }

        if (stockAction === 'increment' && (!stockCosto || parseFloat(stockCosto) <= 0)) {
            addToast({ type: 'error', title: 'Error', message: 'Ingrese el costo unitario para la compra' });
            return;
        }

        setIsLoading(true);
        try {
            const url = stockAction === 'increment'
                ? `${API_BASE_URL}/materias-primas/incrementStock/${stockMateria.id}`
                : `${API_BASE_URL}/materias-primas/decrementStock/${stockMateria.id}`;

            const payload = stockAction === 'increment'
                ? { cantidad: parseFloat(stockCantidad), costo_unitario: parseFloat(stockCosto) }
                : { cantidad: parseFloat(stockCantidad) };

            const res = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const dataRes = await res.json();

            if (!res.ok) {
                throw new Error(dataRes.error || dataRes.message || "Error al ajustar stock");
            }

            await fetchData();
            setOpenStockModal(false);
            addToast({
                type: 'success',
                title: stockAction === 'increment' ? 'Stock Incrementado' : 'Stock Decrementado',
                message: `${stockMateria.nombre}: Nuevo stock = ${dataRes.nuevoStock}`
            });
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-blue-100">
            <Toast toasts={toasts} removeToast={removeToast} />
            <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl text-blue-800 flex items-center gap-2">
                            <FaBoxOpen /> Inventario Materia Prima
                        </h1>
                        <button
                            onClick={() => {
                                resetForm();
                                setOpenModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
                        >
                            <FaPlus /> Nueva Materia Prima
                        </button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm mb-5 px-4 py-3 flex items-center gap-3">
                        <FaSearch className="text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Código</th>
                                        <th className="px-5 py-3 text-left">Nombre</th>
                                        <th className="px-5 py-3 text-left">Unidad</th>
                                        <th className="px-5 py-3 text-left">Stock</th>
                                        <th className="px-5 py-3 text-left">Costo Promedio</th>
                                        <th className="px-5 py-3 text-left">Stock Mínimo</th>
                                        <th className="px-5 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                                                No hay materias primas registradas
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-5 py-3 text-gray-600 font-mono text-xs">{item.codigo || '-'}</td>
                                                <td className="px-5 py-3 font-medium text-gray-800">{item.nombre}</td>
                                                <td className="px-5 py-3 text-gray-600">{getNombreUnidad(item.unidad)}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockColor(item.stock)}`}>
                                                        {Number(item.stock).toFixed(2)} {getNombreUnidad(item.unidad)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-gray-600">${Number(item.costo_promedio || 0).toFixed(4)}</td>
                                                <td className="px-5 py-3 text-gray-600">{Number(item.stock_minimo || 0).toFixed(2)}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenStockModal(item, 'increment')}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Agregar Stock (Compra)"
                                                        >
                                                            <FaPlusIcon className="text-sm" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenStockModal(item, 'decrement')}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Quitar Stock (Uso)"
                                                        >
                                                            <FaMinus className="text-sm" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <FaEdit className="text-sm" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id, item.nombre)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Eliminar"
                                                        >
                                                            <FaTrash className="text-sm" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>

            {/* MODAL PARA CREAR/EDITAR MATERIA PRIMA */}
            {openModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                                    <FaBoxOpen />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {isEditing ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {isEditing ? 'Modifica los datos de la materia prima' : 'Agrega un nuevo insumo al inventario'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { resetForm(); setOpenModal(false); }} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                                    <input
                                        name="codigo"
                                        value={form.codigo}
                                        onChange={handleChange}
                                        placeholder="Ej: MP-001"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        name="nombre"
                                        value={form.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Harina de trigo"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                                    <select
                                        name="unidad"
                                        value={form.unidad}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        required
                                    >
                                        {unidadesDisponibles.map(u => (
                                            <option key={u.codigo} value={u.codigo}>{u.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                    <select
                                        name="idproveedor"
                                        value={form.idproveedor}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar proveedor</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Promedio Inicial ($)</label>
                                    <input
                                        type="number"
                                        name="costo_promedio"
                                        value={form.costo_promedio}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Sugerido ($)</label>
                                    <input
                                        type="number"
                                        name="precio_sugerido"
                                        value={form.precio_sugerido}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        name="stock_minimo"
                                        value={form.stock_minimo}
                                        onChange={handleChange}
                                        placeholder="0"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                                    <FaInfoCircle className="text-blue-500 text-sm" />
                                    <p className="text-xs text-blue-700">El stock se gestiona desde compras y ajustes manuales</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Descripción opcional..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => { resetForm(); setOpenModal(false); }}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition-all flex items-center gap-2"
                                >
                                    {isLoading ? 'Guardando...' : <><FaSave /> Guardar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PARA AJUSTE DE STOCK */}
            {openStockModal && stockMateria && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {stockAction === 'increment' ? 'Agregar Stock' : 'Quitar Stock'}
                            </h2>
                            <button onClick={() => setOpenStockModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                            <p className="font-medium text-gray-800">{stockMateria.nombre}</p>
                            <p className="text-sm text-gray-500">Stock actual: {Number(stockMateria.stock || 0).toFixed(2)} {getNombreUnidad(stockMateria.unidad)}</p>
                            <p className="text-xs text-gray-400">Código: {stockMateria.codigo}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    value={stockCantidad}
                                    onChange={(e) => setStockCantidad(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0.01"
                                    autoFocus
                                />
                            </div>

                            {stockAction === 'increment' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
                                    <input
                                        type="number"
                                        value={stockCosto}
                                        onChange={(e) => setStockCosto(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Este costo actualizará el costo promedio</p>
                                </div>
                            )}

                            {stockAction === 'decrement' && (
                                <div className="bg-yellow-50 rounded-xl p-3">
                                    <p className="text-xs text-yellow-700 flex items-center gap-1">
                                        <FaInfoCircle /> Esta operación reducirá el stock sin actualizar costos
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button onClick={() => setOpenStockModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100">
                                Cancelar
                            </button>
                            <button
                                onClick={handleStockAdjustment}
                                                disabled={isLoading}
                                className={`px-4 py-2 rounded-xl text-white shadow-sm transition-all flex items-center gap-2 ${
                                    stockAction === 'increment' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                } ${isLoading ? 'opacity-50' : ''}`}
                            >
                                {isLoading ? 'Procesando...' : (stockAction === 'increment' ? 'Agregar Stock' : 'Quitar Stock')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}