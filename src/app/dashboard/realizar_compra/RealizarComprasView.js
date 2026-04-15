"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import JsonDteUploader from "./JsonDteUploader";
import { 
    FaCalendarAlt, 
    FaSave, 
    FaTimes, 
    FaPlus, 
    FaTrash, 
    FaSearch, 
    FaBox, 
    FaShoppingCart,
    FaMoneyBillWave,
    FaCheckCircle,
    FaExclamationCircle,
    FaInfoCircle
} from "react-icons/fa";

// ========== TOAST NOTIFICATION SYSTEM ==========
const Toast = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none" style={{ maxWidth: 360 }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-lg border px-4 py-3"
                    style={{
                        borderColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#2563eb',
                        borderLeftWidth: 4,
                        borderLeftStyle: 'solid',
                        animation: 'slideIn 0.25s ease',
                        opacity: toast.leaving ? 0 : 1,
                        transform: toast.leaving ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease'
                    }}
                >
                    <div className="mt-0.5 flex-shrink-0" style={{
                        color: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#2563eb',
                        fontSize: 18
                    }}>
                        {toast.type === 'success' ? <FaCheckCircle /> : toast.type === 'error' ? <FaExclamationCircle /> : <FaInfoCircle />}
                    </div>
                    <div className="flex-1 min-w-0">
                        {toast.title && (
                            <p className="text-sm font-semibold text-gray-800 mb-0.5">{toast.title}</p>
                        )}
                        {toast.lines ? (
                            <div className="space-y-0.5">
                                {toast.lines.map((line, i) => (
                                    <p key={i} className="text-sm text-gray-600">{line}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">{toast.message}</p>
                        )}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
                        style={{ fontSize: 14 }}
                    >
                        <FaTimes />
                    </button>
                </div>
            ))}
            <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
    );
};

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, lines, duration = 4000 }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, message, lines, leaving: false }]);
        
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 350);
        }, duration);
        
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, []);

    return { toasts, addToast, removeToast };
};

export default function RealizarComprasView({ user, hasHaciendaToken, haciendaStatus }) {
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState("");

    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    
    const [currentDteData, setCurrentDteData] = useState(null);
    
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        fecha_emision: new Date().toISOString().split('T')[0],
        proveedor_id: "",
        nombre_proveedor: "",
        numero_documento: "",
        tipo_documento: "CCF",
        nrc: "",
        nit_dui_sujeto_excluido: "",
        tipo_compra: "local",
        descripcion: "",
        exentas_internas: 0,
//        exentas_internaciones: 0,
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
        total_compras: 0,
        codigo_generacion: null,
        sello_recepcion: null
    });

    const [detalles, setDetalles] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQuantity, setAddQuantity] = useState(1);
    const [addPrice, setAddPrice] = useState("");

    // ========== ESTADOS PARA GASTOS SIN INVENTARIO ==========
    const [showGastoModal, setShowGastoModal] = useState(false);
    const [gastoData, setGastoData] = useState({
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0
    });

    const [showDialog, setShowDialog] = useState(false);
    const [dialogClosing, setDialogClosing] = useState(false);
    const [productosNoEncontradosMsg, setProductosNoEncontradosMsg] = useState([]);
    const [pendingDteData, setPendingDteData] = useState(null);
    const [selectedProductosToCreate, setSelectedProductosToCreate] = useState({});
    
    const [pendingDtes, setPendingDtes] = useState([]);
    const [currentDteIndex, setCurrentDteIndex] = useState(0);
    const [isProcessingMultiple, setIsProcessingMultiple] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [provRes, prodRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/proveedores/getAll`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/productos/getAll`, { credentials: "include" })
                ]);

                if (provRes.ok) {
                    const provData = await provRes.json();
                    if (Array.isArray(provData)) {
                        setProveedores(provData);
                    } else if (provData && Array.isArray(provData.data)) {
                        setProveedores(provData.data);
                    } else {
                        setProveedores([]);
                    }
                } else {
                    setProveedores([]);
                }
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProductos(Array.isArray(prodData) ? prodData : (prodData && Array.isArray(prodData.data) ? prodData.data : []));
                } else {
                    setProductos([]);
                }
            } catch (err) {
                console.error("Error cargando datos:", err);
                setError("No se pudieron cargar los datos necesarios.");
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        const term = productSearch.toLowerCase();
        return productos.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            p.codigo.toLowerCase().includes(term)
        ).slice(0, 5);
    }, [productSearch, productos]);

    const handleSelectProduct = (prod) => {
        setSelectedProduct(prod);
        setProductSearch(prod.nombre);
        setAddPrice(prod.precio || "");
        setAddQuantity(1);
    };

    const handleAddDetail = () => {
        if (!selectedProduct) return;
        if (addQuantity <= 0) return addToast({ type: 'error', message: 'La cantidad debe ser mayor a 0' });
        if (addPrice < 0) return addToast({ type: 'error', message: 'El precio no puede ser negativo' });

        const subtotal = parseFloat(addQuantity) * parseFloat(addPrice || 0);
        
        const newDetail = {
            producto_id: selectedProduct.id,
            producto_nombre: selectedProduct.nombre,
            producto_codigo: selectedProduct.codigo,
            cantidad: parseFloat(addQuantity),
            precio_unitario: parseFloat(addPrice || 0),
            subtotal: subtotal
        };

        const newDetalles = [...detalles, newDetail];
        setDetalles(newDetalles);
        updateTotals(newDetalles, formData.tipo_compra);
        
        setSelectedProduct(null);
        setProductSearch("");
        setAddQuantity(1);
        setAddPrice("");
    };

    // ========== FUNCIÓN PARA AGREGAR GASTO SIN INVENTARIO ==========
    const handleAddGasto = () => {
        if (!gastoData.descripcion.trim()) {
            addToast({ type: 'error', message: 'Ingrese una descripción para el gasto/servicio' });
            return;
        }
        if (gastoData.cantidad <= 0) {
            addToast({ type: 'error', message: 'La cantidad debe ser mayor a 0' });
            return;
        }
        if (gastoData.precio_unitario < 0) {
            addToast({ type: 'error', message: 'El precio no puede ser negativo' });
            return;
        }

        const subtotal = gastoData.cantidad * gastoData.precio_unitario;
        
        const newDetail = {
            producto_id: null,
            producto_codigo: null,
            producto_nombre: null,
            descripcion: gastoData.descripcion,
            cantidad: gastoData.cantidad,
            precio_unitario: gastoData.precio_unitario,
            subtotal: subtotal,
            sin_inventario: true
        };

        const newDetalles = [...detalles, newDetail];
        setDetalles(newDetalles);
        updateTotals(newDetalles, formData.tipo_compra);
        
        setGastoData({ descripcion: "", cantidad: 1, precio_unitario: 0 });
        setShowGastoModal(false);
        
        addToast({ type: 'success', message: 'Gasto/Servicio agregado correctamente' });
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = detalles.filter((_, i) => i !== index);
        setDetalles(newDetalles);
        updateTotals(newDetalles, formData.tipo_compra);
    };

    const updateTotals = (currentDetalles, tipo) => {
        const totalMonto = currentDetalles.reduce((sum, item) => sum + item.subtotal, 0);
        const totalFixed = parseFloat(totalMonto.toFixed(2));
        const ivaSugerido = parseFloat((totalFixed * 0.13).toFixed(2));

        setFormData(prev => {
            const newData = {
                ...prev,
                gravadas_internas: tipo === 'local' ? totalFixed : 0,
                gravadas_importaciones: tipo === 'importacion' ? totalFixed : 0,
                credito_fiscal: ivaSugerido,
                exentas_internas: 0,
                exentas_importaciones: 0
            };
            return { ...newData, total_compras: calculateTotal(newData) };
        });
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

    const handleDteLoaded = async (dtesData) => {
        setIsLoading(true);
        setIsProcessingMultiple(true);
        
        const dtes = Array.isArray(dtesData) ? dtesData : [dtesData];

        if (dtes.length > 0) {
            setPendingDtes(dtes);
            setCurrentDteIndex(0);
            await procesarDteActual(dtes[0]);
        }
    };

    const closeDialog = (callback) => {
        setDialogClosing(true);
        setTimeout(() => {
            setShowDialog(false);
            setDialogClosing(false);
            if (callback) callback();
        }, 280);
    };

    const procesarDteActual = async (dteData) => {
        setIsLoading(true);
        try {
            setCurrentDteData(dteData);
            
            const emisorNit = dteData.emisor.nit;
            const emisorNrc = dteData.emisor.nrc;
            
            let foundProv = proveedores.find(p => 
                (p.nit && p.nit === emisorNit) || 
                (p.nrc && p.nrc === emisorNrc) ||
                (p.nombre && p.nombre.toLowerCase().includes(dteData.emisor.nombre.toLowerCase()))
            );

            if (!foundProv) {
                try {
                    const newProvData = {
                        nombre: dteData.emisor.nombre,
                        codigo: emisorNrc || emisorNit || `PROV-${Date.now()}`,
                        descripcion: dteData.emisor.descActividad || "Creado automáticamente desde DTE"
                    };

                    const response = await fetch(`${API_BASE_URL}/proveedores/add`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(newProvData),
                    });

                    if (response.ok) {
                        const resJson = await response.json();
                        foundProv = resJson.proveedor;
                        setProveedores(prev => [...prev, foundProv]);
                    }
                } catch (err) {
                    console.error("Error creando proveedor automático:", err);
                }
            }

            const currentProveedorId = foundProv ? foundProv.id : null;

            let codigoGeneracion = null;
            let selloRecepcion = null;

            if (dteData.identificacion?.codigoGeneracion) {
                codigoGeneracion = dteData.identificacion.codigoGeneracion;
            } else if (dteData.codigoGeneracion) {
                codigoGeneracion = dteData.codigoGeneracion;
            }

            if (dteData.respuestaHacienda?.selloRecibido) {
                selloRecepcion = dteData.respuestaHacienda.selloRecibido;
            } else if (dteData.selloRecibido) {
                selloRecepcion = dteData.selloRecibido;
            } else if (dteData.sello_recepcion) {
                selloRecepcion = dteData.sello_recepcion;
            }

            let fovial = 0;
            let cotrans = 0;
            let iva = 0;

            if (dteData.resumen?.tributos && Array.isArray(dteData.resumen.tributos)) {
                dteData.resumen.tributos.forEach(tributo => {
                    const valor = parseFloat(tributo.valor) || 0;
                    switch(tributo.codigo) {
                        case 'D1': fovial = valor; break;
                        case 'C8': cotrans = valor; break;
                        case '20': iva = valor; break;
                    }
                });
            }

            const productosNoEncontrados = [];
            const productosACrear = [];
            let currentProductos = [...productos];

            for (const item of dteData.cuerpoDocumento) {
                let foundProd = currentProductos.find(p => p.codigo === item.codigo);
                if (!foundProd) {
                    foundProd = currentProductos.find(p => p.nombre.toLowerCase() === item.descripcion.toLowerCase());
                }
                if (!foundProd) {
                    productosNoEncontrados.push(`${item.codigo} - ${item.descripcion}`);
                    productosACrear.push({
                        item,
                        nombre: item.descripcion,
                        codigo: item.codigo || `GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        unidad: item.uniMedida || "Unidad",
                        precio: item.precioUni,
                        preciooferta: 0,
                        stock: 0,
                        es_servicio: item.tipoItem === 2,
                        idproveedor: currentProveedorId
                    });
                }
            }

            if (productosNoEncontrados.length > 0) {
                setProductosNoEncontradosMsg(productosNoEncontrados);
                setPendingDteData({ dteData, productosACrear, foundProv, currentProveedorId });
                setShowDialog(true);
                setIsLoading(false);
                return;
            }

            const nuevosDetalles = [];

            for (const item of dteData.cuerpoDocumento) {
                let foundProd = currentProductos.find(p => p.codigo === item.codigo);
                if (!foundProd) {
                    foundProd = currentProductos.find(p => p.nombre.toLowerCase() === item.descripcion.toLowerCase());
                }
                if (foundProd) {
                    nuevosDetalles.push({
                        producto_id: foundProd.id,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUni,
                        subtotal: item.ventaGravada
                    });
                }
            }

            setFormData(prev => {
                const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
                const newData = {
                    ...prev,
                    fecha_emision: dteData.identificacion.fecEmi,
                    numero_documento: dteData.identificacion.numeroControl,
                    codigo_generacion: codigoGeneracion,
                    sello_recepcion: selloRecepcion,
                    nrc: dteData.emisor.nrc,
                    nombre_proveedor: dteData.emisor.nombre,
                    proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                    tipo_documento: tipoMap[String(dteData.identificacion?.tipoDte).padStart(2, '0')] || "CCF",
                    gravadas_internas: dteData.resumen.totalGravada || 0,
                    credito_fiscal: iva,
                    fovial: fovial,
                    cotrans: cotrans,
                    total_compras: dteData.resumen.totalPagar || 0
                };
                return newData;
            });

            if (nuevosDetalles.length > 0) {
                setDetalles(prev => [...prev, ...nuevosDetalles]);
            }

            setIsLoading(false);
        } catch (error) {
            console.error("Error procesando DTE:", error);
            setError("Error al procesar el archivo DTE.");
            setIsLoading(false);
        }
    };

    const procesarDte = async (dteData, foundProv) => {
        try {
            const nuevosDetalles = [];
            let currentProductos = [...productos];

            for (const item of dteData.cuerpoDocumento) {
                let foundProd = currentProductos.find(p => p.codigo === item.codigo);
                if (!foundProd) {
                    foundProd = currentProductos.find(p => p.nombre.toLowerCase() === item.descripcion.toLowerCase());
                }
                if (foundProd) {
                    nuevosDetalles.push({
                        producto_id: foundProd.id,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUni,
                        subtotal: item.ventaGravada
                    });
                }
            }

            setFormData(prev => {
                const iva = dteData.resumen.tributos?.find(t => t.codigo === '20')?.valor || 0;
                const tipoDteValue = String(dteData.identificacion.tipoDte).padStart(2, '0');
                const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
                return {
                    ...prev,
                    fecha_emision: dteData.identificacion.fecEmi,
                    numero_documento: dteData.identificacion.numeroControl,
                    nrc: dteData.emisor.nrc,
                    nombre_proveedor: dteData.emisor.nombre,
                    proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                    tipo_documento: tipoMap[tipoDteValue] || "CCF",
                    gravadas_internas: dteData.resumen.totalGravada,
                    credito_fiscal: iva,
                    total_compras: dteData.resumen.totalPagar
                };
            });

            if (nuevosDetalles.length > 0) {
                setDetalles(prev => [...prev, ...nuevosDetalles]);
                addToast({ type: 'success', title: 'Productos cargados', message: `Se cargaron ${nuevosDetalles.length} productos correctamente.` });
            }
        } catch (error) {
            console.error("Error procesando DTE:", error);
            setError("Error al procesar el archivo DTE.");
        } finally {
            setIsLoading(false);
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
        } else if (name === 'tipo_compra') {
            setFormData(prev => {
                const totalGravado = prev.gravadas_internas + prev.gravadas_importaciones;
                const newData = {
                    ...prev,
                    tipo_compra: value,
                    gravadas_internas: value === 'local' ? totalGravado : 0,
                    gravadas_importaciones: value === 'importacion' ? totalGravado : 0
                };
                return { ...newData, total_compras: calculateTotal(newData) };
            });
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-SV', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const resetForm = () => {
        setFormData({
            fecha: new Date().toISOString().split('T')[0],
            fecha_emision: new Date().toISOString().split('T')[0],
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
            total_compras: 0,
            codigo_generacion: null,
            sello_recepcion: null
        });
        setDetalles([]);
        setCurrentDteData(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.proveedor_id) return setError("Seleccione un proveedor.");
        if (!formData.numero_documento) return setError("Ingrese el número de documento.");

        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                proveedor_id: parseInt(formData.proveedor_id),
                monto: parseFloat(formData.total_compras),
                monto_exento: parseFloat(formData.exentas_internas || 0),
                iva: parseFloat(formData.credito_fiscal || 0),
                locales: parseFloat(formData.gravadas_internas || 0),
                importaciones: parseFloat(formData.gravadas_importaciones || 0),
                exentas_internas: parseFloat(formData.exentas_internas || 0),
                exentas_internaciones: parseFloat(formData.exentas_internaciones || 0),
                exentas_importaciones: parseFloat(formData.exentas_importaciones || 0),
                gravadas_internas: parseFloat(formData.gravadas_internas || 0),
                gravadas_internaciones: parseFloat(formData.gravadas_internaciones || 0),
                gravadas_importaciones: parseFloat(formData.gravadas_importaciones || 0),
                compras_sujetos_excluidos: parseFloat(formData.compras_sujetos_excluidos || 0),
                credito_fiscal: parseFloat(formData.credito_fiscal || 0),
                fovial: parseFloat(formData.fovial || 0),
                cotrans: parseFloat(formData.cotrans || 0),
                cesc: parseFloat(formData.cesc || 0),
                anticipo_iva_percibido: parseFloat(formData.anticipo_iva_percibido || 0),
                retencion: parseFloat(formData.retencion || 0),
                percepcion: parseFloat(formData.percepcion || 0),
                retencion_terceros: parseFloat(formData.retencion_terceros || 0),
detalles: detalles.map(d => ({
    producto_id: d.producto_id || null,
    producto_codigo: d.producto_codigo || "",
    producto_nombre: d.producto_nombre || "",
    descripcion: d.descripcion || "",
    cantidad: parseFloat(d.cantidad || 0),
    precio_unitario: parseFloat(d.precio_unitario || 0),
    subtotal: parseFloat(d.subtotal || 0),
    sin_inventario: d.sin_inventario || false
})),
                dteData: currentDteData
            };
console.log("📦 PAYLOAD:", payload);
            const response = await fetch(`${API_BASE_URL}/compras/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || "Error al guardar la compra");
            }

            const fechaActual = new Date().toLocaleDateString('es-SV', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            addToast({
                type: 'success',
                title: '¡Compra registrada!',
                lines: [
                    `📄 Documento: ${data.numero_documento}`,
                    `💰 Total: ${formatCurrency(data.monto)}`,
                    `📦 Productos: ${detalles.length}`,
                    `🕐 ${fechaActual}`
                ],
                duration: 6000
            });

            if (isProcessingMultiple && currentDteIndex < pendingDtes.length - 1) {
                const nextIndex = currentDteIndex + 1;
                setCurrentDteIndex(nextIndex);
                resetForm();
                setTimeout(() => {
                    procesarDteActual(pendingDtes[nextIndex]);
                }, 500);
            } else {
                resetForm();
                setPendingDtes([]);
                setCurrentDteIndex(0);
                setIsProcessingMultiple(false);
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const handleCheckboxChange = (index) => {
        setSelectedProductosToCreate(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleDialogNo = () => {
    if (!pendingDteData) return;

    const { dteData, foundProv, currentProveedorId } = pendingDteData;
    const nuevosDetalles = [];

    console.log("🔄 Procesando productos NO agregados al inventario como GASTOS");

    for (const item of dteData.cuerpoDocumento) {
        let foundProd = productos.find(p => p.codigo === item.codigo);
        if (!foundProd) {
            foundProd = productos.find(p => p.nombre.toLowerCase() === item.descripcion.toLowerCase());
        }
        
        if (foundProd) {
            nuevosDetalles.push({
                producto_id: foundProd.id,
                producto_nombre: foundProd.nombre,
                producto_codigo: foundProd.codigo,
                cantidad: item.cantidad,
                precio_unitario: item.precioUni,
                subtotal: item.ventaGravada
            });
        } else {
            nuevosDetalles.push({
                producto_id: null,
                producto_codigo: null,
                producto_nombre: null,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precio_unitario: item.precioUni,
                subtotal: item.ventaGravada,
                sin_inventario: true
            });
        }
    }

    if (nuevosDetalles.length > 0) {
        setDetalles(prev => [...prev, ...nuevosDetalles]);
        addToast({ 
            type: 'success', 
            title: 'Productos cargados', 
            message: `Se cargaron ${nuevosDetalles.filter(d => d.producto_id).length} productos y ${nuevosDetalles.filter(d => !d.producto_id).length} gastos.` 
        });
    }

    setFormData(prev => {
        const iva = dteData.resumen.tributos?.find(t => t.codigo === '20')?.valor || 0;
        const tipoDteValue = String(dteData.identificacion.tipoDte).padStart(2, '0');
        const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
        return {
            ...prev,
            fecha_emision: dteData.identificacion.fecEmi,
            numero_documento: dteData.identificacion.numeroControl,
            nrc: dteData.emisor.nrc,
            nombre_proveedor: dteData.emisor.nombre,
            proveedor_id: pendingDteData.foundProv ? pendingDteData.foundProv.id : prev.proveedor_id,
            tipo_documento: tipoMap[tipoDteValue] || "CCF",
            gravadas_internas: dteData.resumen.totalGravada,
            credito_fiscal: iva,
            total_compras: dteData.resumen.totalPagar
        };
    });

    closeDialog(() => {
        setPendingDteData(null);
        setProductosNoEncontradosMsg([]);
        setSelectedProductosToCreate({});
        setIsLoading(false);
    });
};

const handleDialogYes = async () => {
    if (!pendingDteData) return;

    setIsLoading(true);
    try {
        const { dteData, productosACrear, foundProv, currentProveedorId } = pendingDteData;
        let currentProductos = [...productos];
        const nuevosDetalles = [];

        for (let i = 0; i < productosACrear.length; i++) {
            if (selectedProductosToCreate[i]) {
                const prodData = productosACrear[i];
                try {
                    const response = await fetch(`${API_BASE_URL}/productos/addPro`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            nombre: prodData.nombre,
                            codigo: prodData.codigo,
                            unidad: prodData.unidad,
                            precio: prodData.precio,
                            preciooferta: prodData.preciooferta,
                            stock: prodData.stock,
                            es_servicio: prodData.es_servicio,
                            idproveedor: currentProveedorId
                        }),
                    });

                    if (response.ok) {
                        const resJson = await response.json();
                        const newProd = resJson.producto;
                        currentProductos.push(newProd);
                        setProductos(prev => [...prev, newProd]);

                        nuevosDetalles.push({
                            producto_id: newProd.id,
                            producto_nombre: newProd.nombre,
                            producto_codigo: newProd.codigo,
                            cantidad: prodData.item.cantidad,
                            precio_unitario: prodData.item.precioUni,
                            subtotal: prodData.item.ventaGravada
                        });
                    }
                } catch (err) {
                    console.error("Error creando producto:", err);
                }
            }
        }

        for (const item of dteData.cuerpoDocumento) {
            let foundProd = currentProductos.find(p => p.codigo === item.codigo);
            if (!foundProd) {
                foundProd = currentProductos.find(p => p.nombre.toLowerCase() === item.descripcion.toLowerCase());
            }
            
            if (foundProd) {
                const yaExiste = nuevosDetalles.some(d => d.producto_id === foundProd.id);
                if (!yaExiste) {
                    nuevosDetalles.push({
                        producto_id: foundProd.id,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUni,
                        subtotal: item.ventaGravada
                    });
                }
            } else {
                nuevosDetalles.push({
                    producto_id: null,
                    producto_codigo: null,
                    producto_nombre: null,
                    descripcion: item.descripcion,
                    cantidad: item.cantidad,
                    precio_unitario: item.precioUni,
                    subtotal: item.ventaGravada,
                    sin_inventario: true
                });
            }
        }

        setFormData(prev => {
            const iva = dteData.resumen.tributos?.find(t => t.codigo === '20')?.valor || 0;
            const tipoDteValue = String(dteData.identificacion.tipoDte).padStart(2, '0');
            const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
            return {
                ...prev,
                fecha_emision: dteData.identificacion.fecEmi,
                numero_documento: dteData.identificacion.numeroControl,
                nrc: dteData.emisor.nrc,
                nombre_proveedor: dteData.emisor.nombre,
                proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                tipo_documento: tipoMap[tipoDteValue] || "CCF",
                gravadas_internas: dteData.resumen.totalGravada,
                credito_fiscal: iva,
                total_compras: dteData.resumen.totalPagar
            };
        });

        if (nuevosDetalles.length > 0) {
            setDetalles(prev => [...prev, ...nuevosDetalles]);
        }

        closeDialog(() => {
            setPendingDteData(null);
            setProductosNoEncontradosMsg([]);
            setSelectedProductosToCreate({});
            setIsLoading(false);
        });

    } catch (error) {
        console.error("Error:", error);
        setError("Error al crear los productos.");
        setIsLoading(false);
    }
};

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="text-black flex flex-col h-screen bg-gray-50">
            {isMobile && sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)}></div>
            )}

            <Toast toasts={toasts} removeToast={removeToast} />

            <div className="flex flex-1 h-full overflow-hidden">
                <div className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!isMobile ? 'md:translate-x-0 md:w-64' : ''}`}>
                    <div className="h-full overflow-y-auto">
                        <Sidebar />
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar 
                        user={user} 
                        hasHaciendaToken={hasHaciendaToken} 
                        haciendaStatus={haciendaStatus} 
                        onToggleSidebar={toggleSidebar} 
                        sidebarOpen={sidebarOpen} 
                    />

                    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center mb-6">
                                <FaShoppingCart className="text-2xl text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Realizar Nueva Compra</h1>
                                    {isProcessingMultiple && pendingDtes.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Procesando {currentDteIndex + 1} de {pendingDtes.length} archivos
                                        </p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
                                    <p className="font-medium">Error</p>
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Carga Automática</h2>
                                    <JsonDteUploader onDataLoaded={handleDteLoaded} />
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Datos Generales</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Registro en Sistema</label>
                                            <input 
                                                type="date" name="fecha" value={formData.fecha} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión del Documento</label>
                                            <input 
                                                type="date" name="fecha_emision" value={formData.fecha_emision} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                            <select 
                                                name="proveedor_id" value={formData.proveedor_id} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Seleccione un proveedor</option>
                                                {(Array.isArray(proveedores) ? proveedores : []).map(p => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Proveedor (Doc)</label>
                                            <input 
                                                type="text" name="nombre_proveedor" value={formData.nombre_proveedor} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Nombre en documento"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">N° Documento</label>
                                            <input 
                                                type="text" name="numero_documento" value={formData.numero_documento} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Ej: FAC-001" required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                                            <select 
                                                name="tipo_documento" value={formData.tipo_documento} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="CCF">Comprobante Crédito Fiscal</option>
                                                <option value="FCF">Factura Consumidor Final</option>
                                                <option value="FSE">Factura Sujeto Excluido</option>
                                                <option value="NC">Nota de Crédito</option>
                                                <option value="ND">Nota de Débito</option>
                                                <option value="DUA">Declaración de Mercancías (Importación)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">NRC / NIT</label>
                                            <input 
                                                type="text" name="nrc" value={formData.nrc} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Registro o NIT"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Compra</label>
                                            <div className="flex space-x-4 mt-2">
                                                <label className="inline-flex items-center">
                                                    <input type="radio" name="tipo_compra" value="local" checked={formData.tipo_compra === 'local'} onChange={handleChange} className="text-blue-600" />
                                                    <span className="ml-2 text-gray-700">Local</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input type="radio" name="tipo_compra" value="importacion" checked={formData.tipo_compra === 'importacion'} onChange={handleChange} className="text-blue-600" />
                                                    <span className="ml-2 text-gray-700">Importación</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                            <input 
                                                type="text" name="descripcion" value={formData.descripcion} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Agregar Productos</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-5 relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Producto</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" value={productSearch}
                                                    onChange={(e) => {
                                                        setProductSearch(e.target.value);
                                                        if(selectedProduct && e.target.value !== selectedProduct.nombre) setSelectedProduct(null);
                                                    }}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Nombre o código..."
                                                />
                                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                            </div>
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                            <input 
                                                type="number" value={addQuantity} onChange={(e) => setAddQuantity(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                min="0.01" step="0.01"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
                                            <input 
                                                type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                min="0" step="0.01" placeholder="0.00"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <button 
                                                type="button" onClick={handleAddDetail}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                                                disabled={!selectedProduct}
                                            >
                                                <FaPlus className="mr-2" /> Agregar
                                            </button>
                                        </div>
                                        <div className="md:col-span-1">
                                            <button 
                                                type="button" 
                                                onClick={() => setShowGastoModal(true)}
                                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                                            >
                                                <FaMoneyBillWave className="mr-2" /> Gasto
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 border">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto / Descripción</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {detalles.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                                            No hay productos agregados.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    detalles.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 text-sm">
                                                                {item.producto_id ? (
                                                                    <span className="text-gray-900 font-mono text-xs">{item.producto_codigo || "—"}</span>
                                                                ) : (
                                                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-sans">
                                                                        Gasto
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {item.producto_nombre || item.descripcion || "Sin descripción"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidad}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.precio_unitario.toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${item.subtotal.toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button type="button" onClick={() => handleRemoveDetail(idx)} className="text-red-600 hover:text-red-800">
                                                                    <FaTrash />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Totales y Retenciones</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Compras Gravadas</h3>
                                            {[
                                                { label: 'Internas', name: 'gravadas_internas' },
                                                { label: 'Importaciones', name: 'gravadas_importaciones' },
                                                { label: 'Internaciones', name: 'gravadas_internaciones' }
                                            ].map(f => (
                                                <div key={f.name}>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                        <input type="number" name={f.name} value={formData[f.name]} onChange={handleChange}
                                                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            min="0" step="0.01" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Compras Exentas</h3>
                                            {[
                                                { label: 'Internas', name: 'exentas_internas' },
                                                { label: 'Importaciones', name: 'exentas_importaciones' },
                                                { label: 'Sujetos Excluidos', name: 'compras_sujetos_excluidos' }
                                            ].map(f => (
                                                <div key={f.name}>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                        <input type="number" name={f.name} value={formData[f.name]} onChange={handleChange}
                                                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            min="0" step="0.01" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Impuestos</h3>
                                            {[
                                                { label: 'Crédito Fiscal (IVA)', name: 'credito_fiscal' },
                                                { label: 'FOVIAL', name: 'fovial' },
                                                { label: 'COTRANS', name: 'cotrans' },
                                                { label: 'CESC', name: 'cesc' }
                                            ].map(f => (
                                                <div key={f.name}>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                        <input type="number" name={f.name} value={formData[f.name]} onChange={handleChange}
                                                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            min="0" step="0.01" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Retenciones / Percepciones</h3>
                                            {[
                                                { label: 'Anticipo IVA', name: 'anticipo_iva_percibido', ph: 'Anticipo' },
                                                { label: 'Percepción', name: 'percepcion', ph: 'Percep.' },
                                                { label: 'Retención (1%)', name: 'retencion', ph: 'Ret. 1%' },
                                                { label: 'Retención Terceros', name: 'retencion_terceros', ph: 'Terceros' }
                                            ].map(f => (
                                                <div key={f.name}>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                        <input type="number" name={f.name} value={formData[f.name]} onChange={handleChange}
                                                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            min="0" step="0.01" placeholder={f.ph} />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-6">
                                                <div className="text-right">
                                                    <span className="text-sm text-gray-500">Total Compras:</span>
                                                    <div className="text-3xl font-bold text-green-600">
                                                        ${formData.total_compras.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => router.push('/dashboard/compras')}
                                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="mr-2" /> Guardar Compra
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>

            {/* ========== MODAL PARA AGREGAR GASTO/SERVICIO SIN INVENTARIO ========== */}
            {showGastoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Agregar Gasto / Servicio</h2>
                            <button onClick={() => setShowGastoModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                                <input 
                                    type="text"
                                    value={gastoData.descripcion}
                                    onChange={(e) => setGastoData({...gastoData, descripcion: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Ej: Gasolina Super, Servicio de Internet, Luz, Agua..."
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                <input 
                                    type="number"
                                    value={gastoData.cantidad}
                                    onChange={(e) => setGastoData({...gastoData, cantidad: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    step="0.01"
                                    min="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario ($)</label>
                                <input 
                                    type="number"
                                    value={gastoData.precio_unitario}
                                    onChange={(e) => setGastoData({...gastoData, precio_unitario: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">Subtotal: <span className="font-bold text-gray-900">${(gastoData.cantidad * gastoData.precio_unitario).toFixed(2)}</span></p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                            <button onClick={() => setShowGastoModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button onClick={handleAddGasto} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
                                Agregar Gasto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== DIALOG PRODUCTOS NO ENCONTRADOS ========== */}
            {showDialog && (
                <div
                    className="fixed inset-0 bg-black flex items-center justify-center z-50"
                    style={{
                        backgroundColor: dialogClosing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.5)',
                        transition: 'background-color 0.28s ease'
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4"
                        style={{
                            opacity: dialogClosing ? 0 : 1,
                            transform: dialogClosing ? 'scale(0.96) translateY(8px)' : 'scale(1) translateY(0)',
                            transition: 'opacity 0.28s ease, transform 0.28s ease'
                        }}
                    >
                        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 rounded-t-xl flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-blue-800">Productos no registrados</h2>
                                <p className="text-xs text-blue-600 mt-0.5">{productosNoEncontradosMsg.length} producto(s) del DTE no están en el inventario</p>
                            </div>
                            <button onClick={handleDialogNo} className="text-blue-400 hover:text-blue-600 transition-colors">
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600 mb-3">
                                Selecciona cuáles deseas agregar al inventario:
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-56 overflow-y-auto space-y-1">
                                {productosNoEncontradosMsg.map((item, idx) => (
                                    <label key={idx} className="flex items-center p-2 hover:bg-white rounded-lg cursor-pointer transition-colors gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedProductosToCreate[idx] || false}
                                            onChange={() => handleCheckboxChange(idx)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-700 leading-tight">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                            <button 
                                onClick={handleDialogNo}
                                className="px-4 py-2 text-sm bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
                            >
                                Continuar sin agregar
                            </button>
                            <button 
                                onClick={handleDialogYes}
                                disabled={!Object.values(selectedProductosToCreate).some(v => v)}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                            >
                                Agregar seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}