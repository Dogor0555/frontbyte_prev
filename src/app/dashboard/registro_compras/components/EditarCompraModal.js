"use client";
import { useState, useEffect } from "react";
import { FaTimes, FaSave, FaTrash, FaPlus, FaEdit, FaCheck } from "react-icons/fa";
import { API_BASE_URL } from "@/lib/api";

export default function EditarCompraModal({ isOpen, onClose, compraId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQuantity, setAddQuantity] = useState(1);
    const [addPrice, setAddPrice] = useState("");
    
    const [editingRow, setEditingRow] = useState(null);
    const [editValues, setEditValues] = useState({
        cantidad: 0,
        precio_unitario: 0
    });
    
    const [formData, setFormData] = useState({
        id: "",
        fecha: "",
        fecha_emision: "",
        proveedor_id: "",
        nombre_proveedor: "",
        numero_documento: "",
        tipo_documento: "CCF",
        nrc: "",
        nit_dui_sujeto_excluido: "",
        tipo_compra: "local",
        descripcion: "",
        exentas_internas: 0,
        exentas_internaciones: 0,
        exentas_importaciones: 0,
        gravadas_internas: 0,
        gravadas_internaciones: 0,
        gravadas_importaciones: 0,
        compras_sujetos_excluidos: 0,
        credito_fiscal: 0,
        fovial: 0,
        cotrans: 0,
        cesc: 0,
        anticipo_iva_percibido: 0,
        retencion: 0,
        percepcion: 0,
        retencion_terceros: 0,
        total_compras: 0
    });

    const [detalles, setDetalles] = useState([]);

    useEffect(() => {
        if (isOpen && compraId) {
            cargarDatosIniciales();
            cargarCompra();
        }
    }, [isOpen, compraId]);

    const cargarDatosIniciales = async () => {
        try {
            const [provRes, prodRes] = await Promise.all([
                fetch(`${API_BASE_URL}/proveedores/getAll`, { credentials: "include" }),
                fetch(`${API_BASE_URL}/productos/getAll`, { credentials: "include" })
            ]);

            if (provRes.ok) {
                const provData = await provRes.json();
                setProveedores(Array.isArray(provData) ? provData : (provData.data || []));
            }
            if (prodRes.ok) {
                const prodData = await prodRes.json();
                setProductos(Array.isArray(prodData) ? prodData : (prodData.data || []));
            }
        } catch (err) {
            console.error("Error cargando datos:", err);
        }
    };

    // ⚠️ FUNCIÓN CARGAR COMPRA COMPLETAMENTE CORREGIDA
    const cargarCompra = async () => {
        try {
            setLoading(true);
            setError("");
            
            console.log("🔄 Cargando compra ID:", compraId);
            console.log("📡 URL:", `${API_BASE_URL}/compras/${compraId}/detalles`);
            
            const response = await fetch(`${API_BASE_URL}/compras/${compraId}/detalles`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            
            console.log("📊 Response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Error response:", errorText);
                throw new Error(`Error al cargar la compra: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("📦 Datos recibidos completos:", JSON.stringify(data, null, 2));
            
            if (!data.compra) {
                throw new Error("La respuesta no contiene datos de compra");
            }
            
            // Función para formatear fecha para input type="date"
            const formatDateForInput = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return "";
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // ⚠️ MAPEO CORREGIDO - Todos los campos mapeados correctamente
            const compraData = {
                id: data.compra.id || "",
                fecha: formatDateForInput(data.compra.fecha),
                fecha_emision: formatDateForInput(data.compra.fecha_emision) || formatDateForInput(data.compra.fecha),
                proveedor_id: data.compra.proveedor?.id || data.compra.proveedor_id || "",
                nombre_proveedor: data.compra.nombre_proveedor || data.compra.proveedor?.nombre || "",
                numero_documento: data.compra.numero_documento || "",
                tipo_documento: data.compra.tipo_documento || "CCF",
                nrc: data.compra.nrc || "",
                nit_dui_sujeto_excluido: data.compra.nit_dui_sujeto_excluido || "",
                tipo_compra: data.compra.gravadas_importaciones > 0 ? "importacion" : "local",
                descripcion: data.compra.descripcion || "",
                exentas_internas: data.compra.exentas_internas || 0,
                exentas_internaciones: data.compra.exentas_internaciones || 0,
                exentas_importaciones: data.compra.exentas_importaciones || 0,
                gravadas_internas: data.compra.gravadas_internas || 0,
                gravadas_internaciones: data.compra.gravadas_internaciones || 0,
                gravadas_importaciones: data.compra.gravadas_importaciones || 0,
                compras_sujetos_excluidos: data.compra.compras_sujetos_excluidos || 0,
                credito_fiscal: data.compra.credito_fiscal || 0,
                fovial: data.compra.fovial || 0,
                cotrans: data.compra.cotrans || 0,
                cesc: data.compra.cesc || 0,
                anticipo_iva_percibido: data.compra.anticipo_iva_percibido || 0,
                retencion: data.compra.retencion || 0,
                percepcion: data.compra.percepcion || 0,
                retencion_terceros: data.compra.retencion_terceros || 0,
                total_compras: data.compra.total_compras || data.compra.monto || 0
            };

            console.log("✅ Datos mapeados para el formulario:", compraData);
            setFormData(compraData);

            // ⚠️ MAPEO DE DETALLES CORREGIDO
            if (data.detalles && data.detalles.length > 0) {
                const detallesMapeados = data.detalles.map(p => ({
                    id: p.id,
                    producto_id: p.producto_id,
                    producto_nombre: p.producto?.nombre || p.producto_nombre || "",
                    producto_codigo: p.producto?.codigo || p.producto_codigo || "",
                    cantidad: parseFloat(p.cantidad) || 0,
                    precio_unitario: parseFloat(p.precio_unitario) || 0,
                    subtotal: parseFloat(p.subtotal) || 0
                }));
                
                console.log("📦 Detalles mapeados:", detallesMapeados);
                setDetalles(detallesMapeados);
            } else {
                console.log("ℹ️ No hay detalles para esta compra");
                setDetalles([]);
            }

        } catch (err) {
            console.error("❌ Error en cargarCompra:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'proveedor_id') {
            const prov = proveedores.find(p => p.id.toString() === value);
            setFormData(prev => ({ 
                ...prev,
                [name]: value,
                nombre_proveedor: prov ? prov.nombre : ""
            }));
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: value };
                if ([
                    'exentas_internas', 'exentas_internaciones', 'exentas_importaciones',
                    'gravadas_internas', 'gravadas_internaciones', 'gravadas_importaciones',
                    'compras_sujetos_excluidos', 'credito_fiscal', 'fovial', 'cotrans', 'cesc',
                    'anticipo_iva_percibido', 'percepcion'
                ].includes(name)) {
                    newData.total_compras = calculateTotal(newData);
                }
                return newData;
            });
        }
    };

    const calculateTotal = (data) => {
        return parseFloat((
            parseFloat(data.exentas_internas || 0) +
            parseFloat(data.exentas_internaciones || 0) +
            parseFloat(data.exentas_importaciones || 0) +
            parseFloat(data.gravadas_internas || 0) +
            parseFloat(data.gravadas_internaciones || 0) +
            parseFloat(data.gravadas_importaciones || 0) +
            parseFloat(data.compras_sujetos_excluidos || 0) +
            parseFloat(data.credito_fiscal || 0) +
            parseFloat(data.fovial || 0) +
            parseFloat(data.cotrans || 0) +
            parseFloat(data.cesc || 0) +
            parseFloat(data.anticipo_iva_percibido || 0) +
            parseFloat(data.percepcion || 0)
        ).toFixed(2));
    };

    const filteredProducts = productos.filter(p => 
        p.nombre?.toLowerCase().includes(productSearch.toLowerCase()) || 
        p.codigo?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 5);

    const handleSelectProduct = (prod) => {
        setSelectedProduct(prod);
        setProductSearch(prod.nombre);
        setAddPrice(prod.precio || "");
        setAddQuantity(1);
    };

    const handleAddDetail = () => {
        if (!selectedProduct) return;
        if (addQuantity <= 0) return alert("La cantidad debe ser mayor a 0");

        const cantidad = parseFloat(addQuantity) || 0;
        const precio = parseFloat(addPrice) || 0;
        const subtotal = cantidad * precio;
        
        const newDetail = {
            producto_id: selectedProduct.id,
            producto_nombre: selectedProduct.nombre,
            producto_codigo: selectedProduct.codigo,
            cantidad: cantidad,
            precio_unitario: precio,
            subtotal: subtotal
        };

        const newDetalles = [...detalles, newDetail];
        setDetalles(newDetalles);
        updateTotalsFromDetalles(newDetalles);
        
        setSelectedProduct(null);
        setProductSearch("");
        setAddQuantity(1);
        setAddPrice("");
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = detalles.filter((_, i) => i !== index);
        setDetalles(newDetalles);
        updateTotalsFromDetalles(newDetalles);
    };

    const handleEditRow = (index) => {
        const item = detalles[index];
        setEditingRow(index);
        setEditValues({
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
        });
    };

    const handleSaveRow = (index) => {
        const updatedDetalles = [...detalles];
        updatedDetalles[index] = {
            ...updatedDetalles[index],
            cantidad: parseFloat(editValues.cantidad) || 0,
            precio_unitario: parseFloat(editValues.precio_unitario) || 0,
            subtotal: (parseFloat(editValues.cantidad) || 0) * (parseFloat(editValues.precio_unitario) || 0)
        };
        
        setDetalles(updatedDetalles);
        updateTotalsFromDetalles(updatedDetalles);
        setEditingRow(null);
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
    };

    const handleEditChange = (field, value) => {
        setEditValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateTotalsFromDetalles = (currentDetalles) => {
        const totalMonto = currentDetalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        
        setFormData(prev => ({
            ...prev,
            gravadas_internas: totalMonto,
            credito_fiscal: parseFloat((totalMonto * 0.13).toFixed(2)),
            total_compras: totalMonto
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const payload = {
                ...formData,
                proveedor_id: parseInt(formData.proveedor_id),
                monto: parseFloat(formData.total_compras),
                monto_exento: parseFloat(formData.exentas_internas || 0),
                iva: parseFloat(formData.credito_fiscal || 0),
                locales: parseFloat(formData.gravadas_internas || 0),
                importaciones: parseFloat(formData.gravadas_importaciones || 0),
                detalles: detalles.map(d => ({
                    ...d,
                    cantidad: parseFloat(d.cantidad) || 0,
                    precio_unitario: parseFloat(d.precio_unitario) || 0,
                    subtotal: parseFloat(d.subtotal) || 0
                }))
            };

            console.log("📤 Enviando actualización:", payload);

            const response = await fetch(`${API_BASE_URL}/compras/update/${compraId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al actualizar");
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar esta compra? Esta acción no se puede deshacer.")) {
            return;
        }

        setDeleting(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/compras/delete/${compraId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al eliminar");
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const formatNumber = (value) => {
        const num = parseFloat(value) || 0;
        return num.toFixed(2);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Editar Compra</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando compra...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                                {error}
                            </div>
                        )}

                        {/* Datos Generales
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Datos Generales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Registro</label>
                                    <input 
                                        type="date" 
                                        name="fecha" 
                                        value={formData.fecha} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
                                    <input 
                                        type="date" 
                                        name="fecha_emision" 
                                        value={formData.fecha_emision} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                    <select 
                                        name="proveedor_id" 
                                        value={formData.proveedor_id} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Documento</label>
                                    <input 
                                        type="text" 
                                        name="numero_documento" 
                                        value={formData.numero_documento} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                                    <select 
                                        name="tipo_documento" 
                                        value={formData.tipo_documento} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="CCF">CCF</option>
                                        <option value="FCF">FCF</option>
                                        <option value="FSE">FSE</option>
                                        <option value="NC">NC</option>
                                        <option value="ND">ND</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NRC/NIT</label>
                                    <input 
                                        type="text" 
                                        name="nrc" 
                                        value={formData.nrc} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                    />
                                </div>
                            </div>
                        </div>  */}

                        {/* Productos */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Productos</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                                <div className="md:col-span-5 relative">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar producto..." 
                                        value={productSearch} 
                                        onChange={(e) => {
                                            setProductSearch(e.target.value);
                                            if(selectedProduct && e.target.value !== selectedProduct.nombre) setSelectedProduct(null);
                                        }} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                    />
                                    {productSearch && !selectedProduct && filteredProducts.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {filteredProducts.map(prod => (
                                                <div 
                                                    key={prod.id} 
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm" 
                                                    onClick={() => handleSelectProduct(prod)}
                                                >
                                                    <span className="font-bold">{prod.codigo}</span> - {prod.nombre}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <input 
                                        type="number" 
                                        placeholder="Cantidad" 
                                        value={addQuantity} 
                                        onChange={(e) => setAddQuantity(e.target.value)} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        min="0.01" 
                                        step="0.01" 
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <input 
                                        type="number" 
                                        placeholder="Precio" 
                                        value={addPrice} 
                                        onChange={(e) => setAddPrice(e.target.value)} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        min="0" 
                                        step="0.01" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <button 
                                        type="button" 
                                        onClick={handleAddDetail} 
                                        disabled={!selectedProduct} 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50"
                                    >
                                        <FaPlus className="mr-2" /> Agregar
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Código</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Producto</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Cantidad</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Precio</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Subtotal</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {detalles.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm">{item.producto_codigo}</td>
                                                <td className="px-4 py-2 text-sm">{item.producto_nombre}</td>
                                                
                                                <td className="px-4 py-2 text-sm text-right">
                                                    {editingRow === idx ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.cantidad}
                                                            onChange={(e) => handleEditChange('cantidad', e.target.value)}
                                                            className="w-20 px-2 py-1 border border-blue-500 rounded text-right"
                                                            min="0"
                                                            step="0.01"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        formatNumber(item.cantidad)
                                                    )}
                                                </td>
                                                
                                                <td className="px-4 py-2 text-sm text-right">
                                                    {editingRow === idx ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.precio_unitario}
                                                            onChange={(e) => handleEditChange('precio_unitario', e.target.value)}
                                                            className="w-24 px-2 py-1 border border-blue-500 rounded text-right"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    ) : (
                                                        `$${formatNumber(item.precio_unitario)}`
                                                    )}
                                                </td>
                                                
                                                <td className="px-4 py-2 text-sm text-right">${formatNumber(item.subtotal)}</td>
                                                
                                                <td className="px-4 py-2 text-sm text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        {editingRow === idx ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveRow(idx)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                    title="Guardar"
                                                                >
                                                                    <FaCheck size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancelEdit}
                                                                    className="text-gray-600 hover:text-gray-800"
                                                                    title="Cancelar"
                                                                >
                                                                    <FaTimes size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditRow(idx)}
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                    title="Editar"
                                                                >
                                                                    <FaEdit size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveDetail(idx)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Eliminar"
                                                                >
                                                                    <FaTrash size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Totales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Exentas Internas</label>
                                    <input 
                                        type="number" 
                                        name="exentas_internas" 
                                        value={formData.exentas_internas} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        step="0.01" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Exentas Importación</label>
                                    <input 
                                        type="number" 
                                        name="exentas_importaciones" 
                                        value={formData.exentas_importaciones} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        step="0.01" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Gravadas Internas</label>
                                    <input 
                                        type="number" 
                                        name="gravadas_internas" 
                                        value={formData.gravadas_internas} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        step="0.01" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Gravadas Importación</label>
                                    <input 
                                        type="number" 
                                        name="gravadas_importaciones" 
                                        value={formData.gravadas_importaciones} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        step="0.01" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Crédito Fiscal</label>
                                    <input 
                                        type="number" 
                                        name="credito_fiscal" 
                                        value={formData.credito_fiscal} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                                        step="0.01" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-600">Total</label>
                                    <div className="text-2xl font-bold text-green-600">${formatNumber(formData.total_compras)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-between pt-4">
                            <button 
                                type="button" 
                                onClick={handleDelete} 
                                disabled={deleting} 
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash className="mr-2" /> Eliminar Compra
                                    </>
                                )}
                            </button>
                            <div className="flex space-x-3">
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving} 
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="mr-2" /> Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}