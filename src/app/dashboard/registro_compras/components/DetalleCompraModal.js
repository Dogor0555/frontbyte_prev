"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaBox, FaBuilding, FaFileAlt, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import { API_BASE_URL } from "@/lib/api";

const formatCurrency = (amount) =>
    new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(parseFloat(amount) || 0);

const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    if (dateString.includes("/")) return dateString;
    try {
        return new Date(dateString + "T00:00:00").toLocaleDateString("es-SV", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    } catch { return dateString; }
};

const Field = ({ label, value, mono = false, span = false }) => (
    <div className={span ? "col-span-2" : ""}>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm text-slate-800 ${mono ? "font-mono text-xs bg-slate-100 px-2 py-1 rounded" : "font-medium"}`}>
            {value || "—"}
        </p>
    </div>
);

export default function DetalleCompraModal({ isOpen, onClose, compraId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !compraId) return;
        setData(null);
        setError("");
        setLoading(true);

        console.log("🔍 Solicitando detalles para compra ID:", compraId);

        fetch(`${API_BASE_URL}/compras/detalles/${compraId}`, { credentials: "include" })
            .then(r => r.json())
            .then(d => {
                if (d.error) throw new Error(d.error);
                console.log("📦 Detalles recibidos:", d.detalles);
                setData(d);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [isOpen, compraId]);

    if (!isOpen) return null;

    const compra = data?.compra;
    const detalles = data?.detalles || [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center">
                            <FaFileAlt className="text-white" size={15} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Detalle de Compra</h2>
                            {compra && (
                                <p className="text-xs text-slate-500 font-mono">{compra.numero_documento}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
                        <FaTimes size={14} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-10 w-10 border-4 border-slate-300 border-t-slate-700 rounded-full" />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    {!loading && !error && compra && (
                        <>
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaBuilding className="text-slate-400" size={13} />
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Proveedor</h3>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Field label="Nombre" value={compra.nombre_proveedor} span />
                                    <Field label="NRC" value={compra.nrc} mono />
                                    <Field label="Tipo doc" value={compra.tipo_documento} />
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaCalendarAlt className="text-slate-400" size={13} />
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Documento</h3>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Field label="N° Documento" value={compra.numero_documento} mono />
                                    <Field label="Fecha Emisión" value={formatDate(compra.fecha_emision)} />
                                    <Field label="Fecha Registro" value={formatDate(compra.fecha)} />
                                    {compra.codigo_generacion && compra.codigo_generacion !== "N/A" && (
                                        <Field label="Código Generación" value={compra.codigo_generacion} mono span />
                                    )}
                                    {compra.sello_recepcion && compra.sello_recepcion !== "N/A" && (
                                        <Field label="Sello Recepción" value={compra.sello_recepcion} mono span />
                                    )}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaBox className="text-slate-400" size={13} />
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Productos / Servicios</h3>
                                    <span className="ml-auto text-xs bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                                        {detalles.length} ítem{detalles.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {detalles.length === 0 ? (
                                    <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 text-sm">
                                        Sin detalles de productos registrados
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-left">Código</th>
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-left">Producto / Descripción</th>
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Cant.</th>
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Precio Unit.</th>
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {detalles.map((det, i) => (
                                                    <tr key={det.id || i} className="hover:bg-slate-50">
                                                        <td className="px-4 py-2.5 text-xs font-mono text-slate-500">
                                                            {det.producto?.codigo ? (
                                                                det.producto.codigo
                                                            ) : (
                                                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-sans">
                                                                    Gasto
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm text-slate-800">
                                                            {det.producto?.nombre || det.descripcion || "Sin descripción"}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm text-slate-700 text-right">
                                                            {parseFloat(det.cantidad).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm text-slate-700 text-right">
                                                            {formatCurrency(det.precio_unitario)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-sm font-semibold text-slate-800 text-right">
                                                            {formatCurrency(det.subtotal)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaMoneyBillWave className="text-slate-400" size={13} />
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumen Financiero</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-blue-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500">Gravadas Int.</p>
                                        <p className="text-sm font-bold text-blue-700">{formatCurrency(compra.gravadas_internas)}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500">Crédito Fiscal</p>
                                        <p className="text-sm font-bold text-emerald-700">{formatCurrency(compra.credito_fiscal)}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500">FOVIAL</p>
                                        <p className="text-sm font-bold text-slate-700">{formatCurrency(compra.fovial)}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500">COTRANS</p>
                                        <p className="text-sm font-bold text-slate-700">{formatCurrency(compra.cotrans)}</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500">Retención</p>
                                        <p className="text-sm font-bold text-amber-700">{formatCurrency(compra.retencion)}</p>
                                    </div>
                                    <div className="bg-violet-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500">Percepción</p>
                                        <p className="text-sm font-bold text-violet-700">{formatCurrency(compra.percepcion)}</p>
                                    </div>
                                </div>

                                <div className="mt-3 bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-300">Total Compra</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(compra.total_compras || compra.monto)}</p>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}