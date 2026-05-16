"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import JsonDteUploader from "./JsonDteUploader";
import { 
    FaSave, 
    FaTimes, 
    FaPlus, 
    FaTrash, 
    FaSearch, 
    FaBoxOpen,
    FaShoppingCart,
    FaMoneyBillWave,
    FaCheckCircle,
    FaExclamationCircle,
    FaInfoCircle,
    FaEdit
} from "react-icons/fa";

// ========== UNIDADES DE MEDIDA ==========
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

    // ========== ESTADOS PARA MATERIA PRIMA ==========
    const [showMateriaPrimaModal, setShowMateriaPrimaModal] = useState(false);
    const [mpSearch, setMpSearch] = useState("");
    const [mpSelected, setMpSelected] = useState(null);
    const [mpCantidad, setMpCantidad] = useState("");
    const [mpCosto, setMpCosto] = useState("");
    const [mpUnidad, setMpUnidad] = useState("59");
    const [materiasPrimas, setMateriasPrimas] = useState([]);

    // ========== ESTADOS PARA PRODUCTO (MODAL UNIDAD) ==========
    const [showProductoUnidadModal, setShowProductoUnidadModal] = useState(false);
    const [tempProductData, setTempProductData] = useState(null);
    const [tempCantidad, setTempCantidad] = useState(1);
    const [tempPrecio, setTempPrecio] = useState("");
    const [tempUnidad, setTempUnidad] = useState("59");

    // ========== ESTADOS PARA EDITAR DETALLE ==========
    const [showEditModal, setShowEditModal] = useState(false);
    const [editDetailIndex, setEditDetailIndex] = useState(null);
    const [editDetailData, setEditDetailData] = useState({
        cantidad: 0,
        precio_unitario: 0,
        unidad: "59"
    });

    const [tipoInventario, setTipoInventario] = useState("producto");
    const [productosPendientesMP, setProductosPendientesMP] = useState([]);
    const [tempPrecioVenta, setTempPrecioVenta] = useState(0);
    
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        fecha_emision: new Date().toISOString().split('T')[0],
        proveedor_id: "",
        nombre_proveedor: "",
        numero_documento: "",
        tipo_documento: "CCF",
        nrc: "",
        nit: "",
        tipo_compra: "local",
        descripcion: "",
        exentas_internas: 0,
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

    // ========== FUNCIONES PARA MANEJO DE DETALLES ==========
    const crearDetalleBase = () => ({
        tipo: "",
        producto_id: null,
        materia_prima_id: null,
        producto_codigo: null,
        producto_nombre: null,
        descripcion: "",
        cantidad: 0,
        precio_unitario: 0,
        subtotal: 0,
        unidad: ""
    });

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

    const getNombreUnidad = (codigo) => {
        const unidad = unidadesDisponibles.find(u => u.codigo === codigo);
        return unidad ? unidad.nombre : "Unidad";
    };

    // ========== FUNCIÓN MEJORADA PARA MAPEAR UNIDADES ==========
    const mapearUnidadDesdeJson = (uniMedida) => {
        if (uniMedida === null || uniMedida === undefined || uniMedida === "") {
            console.log("⚠️ Unidad vacía, usando '59' (Unidad)");
            return "59";
        }
        
        let unidadStr = String(uniMedida).trim();
        
        if (/^\d+$/.test(unidadStr)) {
            console.log(`📏 Unidad numérica: ${unidadStr} → ${unidadStr}`);
            return unidadStr;
        }
        
        const unidadLower = unidadStr.toLowerCase();
        
        const mapeo = {
            "unidad": "59", "unidades": "59", "u": "59", "pza": "59", "pieza": "59", "piezas": "59",
            "kg": "34", "kilogramo": "34", "kilogramos": "34", "kilo": "34", "kilos": "34", "kgs": "34",
            "lb": "36", "libra": "36", "libras": "36",
            "litro": "23", "litros": "23", "l": "23",
            "ml": "26", "mililitro": "26", "mililitros": "26",
            "gal": "22", "galon": "22", "galones": "22",
            "m": "1", "metro": "1", "metros": "1",
            "m2": "13", "metro cuadrado": "13", "metros cuadrados": "13",
            "m3": "18", "metro cubico": "18", "metros cubicos": "18",
            "ton": "30", "tonelada": "30", "toneladas": "30",
            "qq": "32", "quintal": "32", "quintales": "32",
            "doc": "58", "docena": "58", "docenas": "58",
            "cj": "Caja", "caja": "Caja", "cajas": "Caja",
            "ciento": "57", "cientos": "57",
            "millar": "55", "millares": "55",
            "yarda": "2", "yardas": "2",
            "hectarea": "10", "hectareas": "10",
            "barril": "20", "barriles": "20",
            "botella": "24", "botellas": "24",
            "gramo": "39", "gramos": "39",
            "miligramo": "40", "miligramos": "40"
        };
        
        const resultado = mapeo[unidadLower];
        if (resultado) {
            console.log(`📏 Unidad mapeada: "${uniMedida}" → ${resultado}`);
            return resultado;
        }
        
        console.log(`📏 Unidad no mapeada: "${uniMedida}", usando: ${unidadStr}`);
        return unidadStr;
    };

 const consolidarDetalles = (detallesExistentes, nuevosDetalles) => {
    const mapaDetalles = new Map();
    
    // Primero, agregar los detalles existentes
    detallesExistentes.forEach(detalle => {
        let key;
        if (detalle.tipo === "producto" && detalle.producto_id) {
            key = `prod_${detalle.producto_id}`;
        } else if (detalle.tipo === "materia_prima" && detalle.materia_prima_id) {
            key = `mp_${detalle.materia_prima_id}`;
        } else {
            key = `gasto_${detalle.descripcion || Date.now()}`;
        }
        
        if (mapaDetalles.has(key)) {
            const existente = mapaDetalles.get(key);
            const nuevaCantidad = existente.cantidad + detalle.cantidad;
            existente.cantidad = parseFloat(nuevaCantidad.toFixed(4));
            existente.subtotal = parseFloat((existente.cantidad * existente.precio_unitario).toFixed(2));
        } else {
            mapaDetalles.set(key, { ...detalle });
        }
    });
    
    // Segundo, agregar o consolidar los nuevos detalles
    nuevosDetalles.forEach(detalle => {
        let key;
        if (detalle.tipo === "producto" && detalle.producto_id) {
            key = `prod_${detalle.producto_id}`;
        } else if (detalle.tipo === "materia_prima" && detalle.materia_prima_id) {
            key = `mp_${detalle.materia_prima_id}`;
        } else {
            key = `gasto_${detalle.descripcion || Date.now()}`;
        }
        
        if (mapaDetalles.has(key)) {
            const existente = mapaDetalles.get(key);
            const nuevaCantidad = existente.cantidad + detalle.cantidad;
            existente.cantidad = parseFloat(nuevaCantidad.toFixed(4));
            existente.subtotal = parseFloat((existente.cantidad * existente.precio_unitario).toFixed(2));
            
            if (detalle.unidad && detalle.unidad !== "59" && existente.unidad === "59") {
                existente.unidad = detalle.unidad;
            }
        } else {
            mapaDetalles.set(key, { ...detalle });
        }
    });
    
    return Array.from(mapaDetalles.values());
};

    // ========== FUNCIÓN PARA ACTUALIZAR STOCK ==========
    const actualizarStockProductos = async (detallesCompra) => {
        const actualizacionesStock = [];
        
        for (const detalle of detallesCompra) {
            if (detalle.tipo === "producto" && detalle.producto_id) {
                const producto = productos.find(p => p.id === detalle.producto_id);
                if (producto) {
                    const nuevoStock = (producto.stock || 0) + detalle.cantidad;
                    actualizacionesStock.push({
                        id: detalle.producto_id,
                        stock: nuevoStock,
                        cantidadAgregada: detalle.cantidad,
                        nombre: producto.nombre,
                        unidad: detalle.unidad
                    });
                }
            }
        }
        
        for (const actualizacion of actualizacionesStock) {
            try {
                await fetch(`${API_BASE_URL}/productos/update/${actualizacion.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ stock: actualizacion.stock })
                });
                console.log(`✅ Stock actualizado: ${actualizacion.nombre} +${actualizacion.cantidadAgregada} = ${actualizacion.stock}`);
            } catch (error) {
                console.error(`❌ Error actualizando stock de ${actualizacion.nombre}:`, error);
            }
        }
        
        return actualizacionesStock;
    };

    // Función para extraer sello de recepción del DTE
    const extraerSelloRecepcion = (dteData) => {
        console.log("🔍 Buscando sello de recepción en el DTE...");
        
        if (dteData.responseMH?.selloRecibido) {
            console.log("✅ Sello encontrado en responseMH.selloRecibido:", dteData.responseMH.selloRecibido);
            return dteData.responseMH.selloRecibido;
        }
        else if (dteData.responseMH?.selloRecepcion) {
            console.log("✅ Sello encontrado en responseMH.selloRecepcion:", dteData.responseMH.selloRecepcion);
            return dteData.responseMH.selloRecepcion;
        }
        else if (dteData.respuestaHacienda?.selloRecibido) {
            console.log("✅ Sello encontrado en respuestaHacienda.selloRecibido:", dteData.respuestaHacienda.selloRecibido);
            return dteData.respuestaHacienda.selloRecibido;
        }
        else if (dteData.respuestaHacienda?.selloRecepcion) {
            console.log("✅ Sello encontrado en respuestaHacienda.selloRecepcion:", dteData.respuestaHacienda.selloRecepcion);
            return dteData.respuestaHacienda.selloRecepcion;
        }
        else if (dteData.selloRecibido) {
            console.log("✅ Sello encontrado en raíz como selloRecibido:", dteData.selloRecibido);
            return dteData.selloRecibido;
        }
        else if (dteData.sello_recepcion) {
            console.log("✅ Sello encontrado en raíz como sello_recepcion:", dteData.sello_recepcion);
            return dteData.sello_recepcion;
        }
        else if (dteData.data?.selloRecibido) {
            console.log("✅ Sello encontrado en data.selloRecibido:", dteData.data.selloRecibido);
            return dteData.data.selloRecibido;
        }
        else if (dteData.documento?.selloRecibido) {
            console.log("✅ Sello encontrado en documento.selloRecibido:", dteData.documento.selloRecibido);
            return dteData.documento.selloRecibido;
        }
        else {
            const buscarSello = (obj, path = "") => {
                if (!obj || typeof obj !== "object") return null;
                for (const key in obj) {
                    if (key.toLowerCase().includes("sello") && typeof obj[key] === "string" && obj[key].length > 10) {
                        console.log(`🔍 Posible sello encontrado en ${path}.${key}:`, obj[key]);
                        return obj[key];
                    }
                    const resultado = buscarSello(obj[key], `${path}.${key}`);
                    if (resultado) return resultado;
                }
                return null;
            };
            const selloEncontrado = buscarSello(dteData);
            if (selloEncontrado) {
                console.log("✅ Sello encontrado mediante búsqueda recursiva:", selloEncontrado);
                return selloEncontrado;
            }
        }
        
        console.log("⚠️ No se encontró sello de recepción en ninguna ubicación");
        return null;
    };

    // Función para extraer tributos del DTE
    const extraerTributos = (dteData) => {
        let fovial = 0;
        let cotrans = 0;
        let iva = 0;
        let cesc = 0;

        if (dteData.resumen?.tributos && Array.isArray(dteData.resumen.tributos)) {
            console.log("📊 Tributos encontrados en DTE:", dteData.resumen.tributos);
            dteData.resumen.tributos.forEach(tributo => {
                const valor = parseFloat(tributo.valor) || 0;
                console.log(`  - ${tributo.codigo}: ${tributo.descripcion} = $${valor}`);
                switch(tributo.codigo) {
                    case 'D1': fovial = valor; break;
                    case 'C8': cotrans = valor; break;
                    case '20': iva = valor; break;
                    case '30': cesc = valor; break;
                }
            });
        }

        return { fovial, cotrans, iva, cesc };
    };

    // Función para abrir el modal de edición
    const handleOpenEditModal = (index) => {
        const detail = detalles[index];
        setEditDetailIndex(index);
        setEditDetailData({
            cantidad: detail.cantidad,
            precio_unitario: detail.precio_unitario,
            unidad: detail.unidad || "59"
        });
        setShowEditModal(true);
    };

    // Función para guardar los cambios editados
const handleSaveEdit = () => {
    if (editDetailIndex === null) return;
    const newDetalles = [...detalles];
    const detail = newDetalles[editDetailIndex];
    const nuevaCantidad = parseFloat(editDetailData.cantidad);
    // ✅ NUEVOS
    const nuevoPrecioCosto = parseFloat(editDetailData.precio_costo || 0);
    const nuevoPrecioVenta = parseFloat(editDetailData.precio_venta || 0);
    // ✅ SUBTOTAL BASADO EN COSTO
    const nuevoSubtotal = nuevaCantidad * nuevoPrecioCosto;
    newDetalles[editDetailIndex] = {
        ...detail,
        cantidad: nuevaCantidad,
        // ✅ COSTO
        precio_unitario: nuevoPrecioCosto,
        precio_costo: nuevoPrecioCosto,
        // ✅ VENTA
        precio_venta: nuevoPrecioVenta,
        subtotal: nuevoSubtotal,
        unidad: editDetailData.unidad
    };
    
    setDetalles(newDetalles);
    updateTotals(newDetalles, formData.tipo_compra);
    setShowEditModal(false);
    setEditDetailIndex(null);
    addToast({ 
        type: 'success', 
        message: `Detalle actualizado con unidad: ${getNombreUnidad(editDetailData.unidad)}` 
    });
};

    // Función para procesar el resto del DTE después de crear MPs
    const procesarRestoDteConMP = (dteData, foundProv, nombresMPCreados) => {
        const nuevosDetalles = [];
        let currentProductos = [...productos];

        const emisorNit = dteData.emisor?.nit || null;
        const emisorNrc = dteData.emisor?.nrc || null;

        const cuerpoDoc = dteData.cuerpoDocumento || [];
        const productosAcumulados = new Map();
        
        for (const item of cuerpoDoc) {
            if (nombresMPCreados.includes(item.descripcion)) {
                continue;
            }

            let foundProd = currentProductos.find(p => p.codigo === item.codigo);
            if (!foundProd) {
                foundProd = currentProductos.find(p => p.nombre?.toLowerCase() === item.descripcion?.toLowerCase());
            }
            
            if (foundProd) {
                const unidadDesdeJson = mapearUnidadDesdeJson(item.uniMedida);
                const key = foundProd.id;
                
                if (productosAcumulados.has(key)) {
                    const acumulado = productosAcumulados.get(key);
                    acumulado.cantidad += item.cantidad;
                    acumulado.subtotal = acumulado.cantidad * acumulado.precio_unitario;
                } else {
                    productosAcumulados.set(key, {
                        tipo: "producto",
                        producto_id: foundProd.id,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUni,
                        subtotal: item.ventaGravada,
                        unidad: unidadDesdeJson
                    });
                }
            }
        }

        const detallesProcesados = Array.from(productosAcumulados.values());
        const nuevosDetallesConsolidados = consolidarDetalles(detalles, detallesProcesados);

        const { fovial, cotrans, iva, cesc } = extraerTributos(dteData);
        const selloRecepcion = extraerSelloRecepcion(dteData);
        const codigoGeneracion = dteData.identificacion?.codigoGeneracion || dteData.codigoGeneracion || null;
        const exentasConTributos = (fovial + cotrans) || 0;

        setFormData(prev => {
            const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
            return {
                ...prev,
                fecha_emision: dteData.identificacion?.fecEmi || new Date().toISOString().split('T')[0],
                numero_documento: dteData.identificacion?.numeroControl || "",
                codigo_generacion: codigoGeneracion,
                sello_recepcion: selloRecepcion,
                nrc: emisorNrc || prev.nrc,
                nit: emisorNit || prev.nit,
                nombre_proveedor: dteData.emisor?.nombre || prev.nombre_proveedor,
                proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                tipo_documento: tipoMap[String(dteData.identificacion?.tipoDte || "").padStart(2, '0')] || "CCF",
                gravadas_internas: dteData.resumen?.totalGravada || 0,
                credito_fiscal: iva,
                fovial: fovial,
                cotrans: cotrans,
                cesc: cesc,
                exentas_internas: exentasConTributos,
                total_compras: dteData.resumen?.totalPagar || 0
            };
        });

        if (detallesProcesados.length > 0) {
            setDetalles(nuevosDetallesConsolidados);
        }

        // Mostrar resumen de productos cargados
        const resumenProductos = detallesProcesados.map(d => 
            `${d.producto_nombre}: ${d.cantidad} ${getNombreUnidad(d.unidad)} @ $${d.precio_unitario}`
        );
        
        addToast({ 
            type: 'success', 
            title: 'DTE Cargado', 
            lines: [
                `📄 Documento: ${dteData.identificacion?.numeroControl || "N/A"}`,
                `🏢 Proveedor: ${dteData.emisor?.nombre || "N/A"}`,
                `💰 Total: $${dteData.resumen?.totalPagar || 0}`,
                `📦 Productos: ${detallesProcesados.length}`,
                ...resumenProductos.slice(0, 3),
                ...(resumenProductos.length > 3 ? [`... y ${resumenProductos.length - 3} más`] : [])
            ],
            duration: 8000
        });
    };

 const handleAgregarMateriaPrimaDesdeDialog = async () => {
    const seleccionadosIndices = Object.keys(selectedProductosToCreate).filter(idx => selectedProductosToCreate[idx]);
    
    if (seleccionadosIndices.length === 0) {
        addToast({ type: 'error', message: 'Seleccione al menos un producto para agregar como materia prima' });
        return;
    }

    try {
        const idsucursal = user?.idsucursal;
        
        if (!idsucursal) {
            addToast({ type: 'error', message: 'No se pudo identificar la sucursal. Reinicie sesión.' });
            return;
        }

        const { dteData, itemsNoEncontrados, foundProv, currentProveedorId, itemsProcesados } = pendingDteData;
        
        const nuevosDetalles = [...(itemsProcesados || [])];
        
        for (const idx of seleccionadosIndices) {
            const itemData = itemsNoEncontrados[parseInt(idx)];
            if (!itemData) continue;
            
            const nombreLimpio = itemData.nombre;
            
            // Buscar si ya existe en materiasPrimas (estado local)
            let mp = materiasPrimas.find(mp => mp.nombre?.toLowerCase() === nombreLimpio?.toLowerCase());
            
            if (!mp) {
                // Crear nueva materia prima
                const res = await fetch(`${API_BASE_URL}/materias-primas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        nombre: nombreLimpio,
                        unidad: "59",
                        idsucursal: idsucursal
                    })
                });
                
                const data = await res.json();
                
                if (!res.ok) {
                    console.error("❌ Error creando MP:", data);
                    addToast({ type: 'error', message: `Error creando materia prima: ${nombreLimpio} - ${data.error || data.message}` });
                    continue;
                }
                
                mp = data.materia || data;
                
                if (!mp?.id) {
                    console.error("❌ Error: backend no devolvió ID");
                    addToast({ type: 'error', message: `Error: no se pudo crear ${nombreLimpio}` });
                    continue;
                }
                
                setMateriasPrimas(prev => [...prev, mp]);
                addToast({ type: 'success', message: `Materia prima "${mp.nombre}" creada` });
            }
            
            const cantidad = parseFloat(itemData.cantidad);
            const precioUnitario = parseFloat(itemData.precio);
            const subtotal = cantidad * precioUnitario;
            const unidadDesdeJson = mapearUnidadDesdeJson(itemData.unidad);
            
            const nuevoDetalle = {
                tipo: "materia_prima",
                producto_id: null,
                materia_prima_id: mp.id,
                producto_nombre: mp.nombre,
                producto_codigo: mp.codigo,
                descripcion: mp.nombre,
                cantidad: cantidad,
                precio_unitario: precioUnitario,
                subtotal: subtotal,
                unidad: mp.unidad || unidadDesdeJson,
                es_materia_prima: true
            };
            
            nuevosDetalles.push(nuevoDetalle);
        }
        
        // PROCESAR EL RESTO DE ÍTEMS (los que NO se seleccionaron) como GASTOS
        const indicesNoSeleccionados = itemsNoEncontrados
            .map((_, idx) => idx)
            .filter(idx => !selectedProductosToCreate[idx]);
        
        for (const idx of indicesNoSeleccionados) {
            const itemData = itemsNoEncontrados[idx];
            if (!itemData) continue;
            
            const cantidad = parseFloat(itemData.cantidad);
            const precioUnitario = parseFloat(itemData.precio);
            const subtotal = cantidad * precioUnitario;
            
            nuevosDetalles.push({
                tipo: "gasto",
                producto_id: null,
                materia_prima_id: null,
                producto_nombre: null,
                producto_codigo: null,
                descripcion: itemData.nombre,
                cantidad: cantidad,
                precio_unitario: precioUnitario,
                subtotal: subtotal,
                unidad: "",
                es_materia_prima: false
            });
        }
        
        setDetalles(nuevosDetalles);
        
        // Actualizar formData con los totales
        const totalGravado = parseFloat(nuevosDetalles.reduce((sum, d) => sum + d.subtotal, 0).toFixed(2));
        const { fovial, cotrans, iva, cesc } = extraerTributos(dteData);
        const fovialRedondeado = parseFloat(fovial.toFixed(2));
        const cotransRedondeado = parseFloat(cotrans.toFixed(2));
        const ivaRedondeado = parseFloat(iva.toFixed(2));
        const exentasInternas = parseFloat((fovialRedondeado + cotransRedondeado).toFixed(2));
        const totalCompras = parseFloat((totalGravado + ivaRedondeado + fovialRedondeado + cotransRedondeado).toFixed(2));
        
        setFormData(prev => {
            const tipoDteValue = String(dteData.identificacion?.tipoDte || "").padStart(2, '0');
            const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
            const selloRecepcion = extraerSelloRecepcion(dteData);
            const codigoGeneracion = dteData.identificacion?.codigoGeneracion || dteData.codigoGeneracion || null;
            
            return {
                ...prev,
                fecha_emision: dteData.identificacion?.fecEmi || new Date().toISOString().split('T')[0],
                numero_documento: dteData.identificacion?.numeroControl || "",
                codigo_generacion: codigoGeneracion,
                sello_recepcion: selloRecepcion,
                nrc: dteData.emisor?.nrc || prev.nrc,
                nit: dteData.emisor?.nit || prev.nit,
                nombre_proveedor: dteData.emisor?.nombre || prev.nombre_proveedor,
                proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                tipo_documento: tipoMap[tipoDteValue] || "CCF",
                gravadas_internas: totalGravado,
                credito_fiscal: ivaRedondeado,
                fovial: fovialRedondeado,
                cotrans: cotransRedondeado,
                exentas_internas: exentasInternas,
                total_compras: totalCompras
            };
        });
        
        updateTotals(nuevosDetalles, formData.tipo_compra);
        
        closeDialog(() => {
            setPendingDteData(null);
            setProductosNoEncontradosMsg([]);
            setSelectedProductosToCreate({});
            setIsLoading(false);
        });
        
        addToast({ 
            type: 'success', 
            title: 'Materias Primas Agregadas', 
            message: `Se agregaron ${seleccionadosIndices.length} materia(s) prima(s) correctamente.`
        });
        
    } catch (error) {
        console.error("❌ Error en handleAgregarMateriaPrimaDesdeDialog:", error);
        addToast({ type: 'error', message: error.message || 'Error al agregar materia prima' });
        setIsLoading(false);
    }
};

    const handleAgregarSeleccionados = () => {
        const seleccionados = productosNoEncontradosMsg.filter((_, idx) => selectedProductosToCreate[idx]);

        if (tipoInventario === "producto") {
            handleDialogYes();
        } else {
            setProductosPendientesMP(seleccionados);
            setShowDialog(false);
            setShowMateriaPrimaModal(true);
        }
    };

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
                const [provRes, prodRes, mpRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/proveedores/getAll`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/productos/getAll`, { credentials: "include" }),
                    fetch(`${API_BASE_URL}/materias-primas`, { credentials: "include" })
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
                if (mpRes.ok) {
                    const mpData = await mpRes.json();
                    setMateriasPrimas(Array.isArray(mpData) ? mpData : (mpData?.data || []));
                } else {
                    setMateriasPrimas([]);
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
        setTempProductData(prod);
        setTempCantidad(addQuantity);
        setTempPrecio(addPrice || prod.precio || "");
        setTempUnidad(prod.unidad || "59");
        setShowProductoUnidadModal(true);
        setProductSearch(prod.nombre);
        setSelectedProduct(prod);
    };

    const handleConfirmarProductoConUnidad = () => {
        if (!tempProductData) return;
        
        if (tempCantidad <= 0) {
            addToast({ type: 'error', message: 'La cantidad debe ser mayor a 0' });
            return;
        }
        if (tempPrecio < 0) {
            addToast({ type: 'error', message: 'El precio no puede ser negativo' });
            return;
        }

        const subtotal = parseFloat(tempCantidad) * parseFloat(tempPrecio || 0);
        
        const newDetail = {
            tipo: "producto",
            producto_id: tempProductData.id,
            producto_nombre: tempProductData.nombre,
            producto_codigo: tempProductData.codigo,
            // ✅ NUEVO
            codigo_barras: tempProductData.codigo_barras || null,
            cantidad: parseFloat(tempCantidad),
            // ✅ ESTE ES EL COSTO DEL DTE
            precio_unitario: parseFloat(tempPrecio || 0),
            // ✅ NUEVO
            precio_costo: parseFloat(tempPrecio || 0),
            // ✅ NUEVO
            precio_venta: parseFloat(tempPrecioVenta || 0),
            subtotal: subtotal,
            unidad: tempUnidad
        };

        const nuevosDetallesConsolidados = consolidarDetalles(detalles, [newDetail]);
        setDetalles(nuevosDetallesConsolidados);
        updateTotals(nuevosDetallesConsolidados, formData.tipo_compra);
        
        setSelectedProduct(null);
        setProductSearch("");
        setAddQuantity(1);
        setAddPrice("");
        setTempPrecioVenta(0);
        setTempProductData(null);
        setShowProductoUnidadModal(false);
        
        addToast({ type: 'success', message: `Producto agregado con unidad: ${getNombreUnidad(tempUnidad)}` });
    };

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
            tipo: "gasto",
            producto_id: null,
            producto_codigo: null,
            producto_nombre: null,
            descripcion: gastoData.descripcion,
            cantidad: gastoData.cantidad,
            precio_unitario: gastoData.precio_unitario,
            subtotal: subtotal,
            unidad: ""
        };

        const nuevosDetallesConsolidados = consolidarDetalles(detalles, [newDetail]);
        setDetalles(nuevosDetallesConsolidados);
        updateTotals(nuevosDetallesConsolidados, formData.tipo_compra);
        
        setGastoData({ descripcion: "", cantidad: 1, precio_unitario: 0 });
        setShowGastoModal(false);
        
        addToast({ type: 'success', message: 'Gasto/Servicio agregado correctamente' });
    };

    const handleAddMateriaPrima = async () => {
    if (!mpSearch || !mpCantidad || !mpCosto) {
        addToast({ type: 'error', message: 'Complete todos los campos' });
        return;
    }

    try {
        let mp = mpSelected;
        const idsucursal = user?.idsucursal;

        if (!mpSelected) {
            if (!idsucursal) {
                addToast({ type: 'error', message: 'No se pudo identificar la sucursal' });
                return;
            }

            const res = await fetch(`${API_BASE_URL}/materias-primas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    nombre: mpSearch,
                    unidad: mpUnidad,
                    idsucursal: idsucursal
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || "Error al crear materia prima");
            }

            mp = data.materia || data;
            
            if (!mp?.id) {
                throw new Error("El backend no devolvió el ID de la materia prima");
            }

            setMateriasPrimas(prev => [...prev, mp]);
            addToast({ type: 'success', message: `Materia prima "${mp.nombre}" creada` });
        }

        const cantidad = parseFloat(mpCantidad);
        const costo = parseFloat(mpCosto);
        const subtotal = cantidad * costo;

        const nuevoDetalle = {
            tipo: "materia_prima",
            materia_prima_id: mp.id,
            descripcion: mp.nombre,
            cantidad: cantidad,
            precio_unitario: costo,
            subtotal: subtotal,
            unidad: mp.unidad || mpUnidad,
            producto_id: null,
            producto_codigo: null,
            producto_nombre: null,
            es_materia_prima: true
        };

        const nuevosDetallesConsolidados = consolidarDetalles(detalles, [nuevoDetalle]);
        setDetalles(nuevosDetallesConsolidados);
        updateTotals(nuevosDetallesConsolidados, formData.tipo_compra);

        // Resetear el modal
        setMpSelected(null);
        setMpSearch("");
        setMpCantidad("");
        setMpCosto("");
        setMpUnidad("59");
        setShowMateriaPrimaModal(false);

        addToast({ 
            type: 'success', 
            message: `Materia prima "${mp.nombre}" agregada con unidad: ${getNombreUnidad(mp.unidad || mpUnidad)}` 
        });

    } catch (error) {
        console.error("❌ Error agregando materia prima:", error);
        addToast({ type: 'error', message: error.message || 'Error al agregar materia prima' });
    }
};

    const handleCreateMP = async () => {
        if (!mpSearch.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL}/materias-primas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    nombre: mpSearch,
                    unidad: mpUnidad
                })
            });

            const data = await res.json();

            setMpSelected(data);
            setMpSearch(data.nombre);
            setMateriasPrimas(prev => [...prev, data]);

            addToast({ type: 'success', message: 'Materia prima creada' });

        } catch (error) {
            console.error(error);
            addToast({ type: 'error', message: 'Error creando materia prima' });
        }
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = detalles.filter((_, i) => i !== index);
        setDetalles(newDetalles);
        updateTotals(newDetalles, formData.tipo_compra);
    };

    const updateTotals = (currentDetalles, tipo) => {
    // Solo calcular y actualizar formData, NO modificar detalles
    const totalMonto = currentDetalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalFixed = parseFloat(totalMonto.toFixed(2));
    
    setFormData(prev => {
        const newData = {
            ...prev,
            gravadas_internas: tipo === 'local' ? totalFixed : 0,
            gravadas_importaciones: tipo === 'importacion' ? totalFixed : 0,
            exentas_internas: tipo === 'local' ? 0 : totalFixed, // O ajusta según necesidad
        };
        const totalCompras = parseFloat(newData.gravadas_internas || 0) + 
                             parseFloat(newData.gravadas_importaciones || 0) +
                             parseFloat(newData.credito_fiscal || 0) +
                             parseFloat(newData.fovial || 0) +
                             parseFloat(newData.cotrans || 0);
        return { ...newData, total_compras: totalCompras };
    });
};

    const calculateTotal = (data) => {
        return parseFloat((
            parseFloat(data.exentas_internas || 0) +
            parseFloat(data.exentas_importaciones || 0) +
            parseFloat(data.gravadas_internas || 0) +
            parseFloat(data.gravadas_internaciones || 0) +
            parseFloat(data.gravadas_importaciones || 0) +
            parseFloat(data.compras_sujetos_excluidos || 0) +
            parseFloat(data.credito_fiscal || 0) +
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

// ========== FUNCIÓN PRINCIPAL CORREGIDA - PROCESA PRODUCTOS Y MATERIAS PRIMAS ==========
const procesarDteActual = async (dteData) => {
    setIsLoading(true);
    try {
        setCurrentDteData(dteData);
        
        console.log("📄 PROCESANDO DTE:");
        const cuerpoDoc = dteData.cuerpoDocumento || [];
        console.log(`  - Total de líneas en DTE: ${cuerpoDoc.length}`);
        
        const emisorNit = dteData.emisor?.nit;
        const emisorNrc = dteData.emisor?.nrc;
        
        // Buscar o crear proveedor
        let foundProv = proveedores.find(p => 
            (p.nit && p.nit === emisorNit) || 
            (p.nrc && p.nrc === emisorNrc) ||
            (p.nombre && p.nombre.toLowerCase().includes(dteData.emisor?.nombre?.toLowerCase() || ""))
        );

        if (!foundProv && emisorNit) {
            try {
                const newProvData = {
                    nombre: dteData.emisor?.nombre || "Proveedor sin nombre",
                    codigo: emisorNrc || emisorNit || `PROV-${Date.now()}`,
                    descripcion: dteData.emisor?.descActividad || "Creado automáticamente desde DTE",
                    nit: emisorNit,
                    nrc: emisorNrc
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

        // Extraer datos del DTE
        let codigoGeneracion = dteData.identificacion?.codigoGeneracion || dteData.codigoGeneracion || null;
        const selloRecepcion = extraerSelloRecepcion(dteData);
        const { fovial, cotrans, iva, cesc } = extraerTributos(dteData);

        // ========== CLASIFICAR ÍTEMS DEL DTE ==========
        const itemsNoEncontrados = [];
        const itemsProcesados = new Map(); // Para acumular productos y MPs existentes
        
        for (const item of cuerpoDoc) {
            // PRIMERO: Buscar si existe como PRODUCTO
            let foundProd = productos.find(p => p.codigo === item.codigo);
            if (!foundProd) {
                foundProd = productos.find(p => p.nombre?.toLowerCase() === item.descripcion?.toLowerCase());
            }
            
            if (foundProd) {
                // Es un producto existente ✅
                const unidadDesdeJson = mapearUnidadDesdeJson(item.uniMedida);
                const key = `prod_${foundProd.id}`;
                
                if (itemsProcesados.has(key)) {
                    const existente = itemsProcesados.get(key);
                    existente.cantidad += parseFloat(item.cantidad);
                    existente.subtotal = existente.cantidad * existente.precio_unitario;
                } else {
                    itemsProcesados.set(key, {
                        tipo: "producto",
                        producto_id: foundProd.id,
                        materia_prima_id: null,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        descripcion: foundProd.nombre,
                        cantidad: parseFloat(item.cantidad),
                        precio_unitario: parseFloat(item.precioUni),
                        subtotal: parseFloat(item.ventaGravada),
                        unidad: unidadDesdeJson,
                        es_materia_prima: false
                    });
                }
                continue;
            }
            
            // SEGUNDO: Buscar si existe como MATERIA PRIMA
            let foundMP = materiasPrimas.find(mp => mp.nombre?.toLowerCase() === item.descripcion?.toLowerCase());
            if (!foundMP && item.codigo) {
                foundMP = materiasPrimas.find(mp => mp.codigo === item.codigo);
            }
            
            if (foundMP) {
                // Es una materia prima existente ✅
                const unidadDesdeJson = mapearUnidadDesdeJson(item.uniMedida);
                const key = `mp_${foundMP.id}`;
                
                if (itemsProcesados.has(key)) {
                    const existente = itemsProcesados.get(key);
                    existente.cantidad += parseFloat(item.cantidad);
                    existente.subtotal = existente.cantidad * existente.precio_unitario;
                } else {
itemsProcesados.set(key, {
    tipo: "producto",
    producto_id: foundProd.id,
    materia_prima_id: null,

    producto_nombre: foundProd.nombre,
    producto_codigo: foundProd.codigo,

    // ✅ NUEVO
    codigo_barras: foundProd.codigo_barras || null,

    descripcion: foundProd.nombre,

    cantidad: parseFloat(item.cantidad),

    // ✅ COSTO
    precio_unitario: parseFloat(item.precioUni),

    // ✅ NUEVOS CAMPOS
    precio_costo: parseFloat(item.precioUni),
    precio_venta: parseFloat(foundProd.precio || 0),

    subtotal: parseFloat(item.ventaGravada),

    unidad: unidadDesdeJson,
    es_materia_prima: false
});
                }
                continue;
            }
            
            // TERCERO: No existe ni como producto ni como materia prima
itemsNoEncontrados.push({
    nombre: item.descripcion,
    codigo: item.codigo || 'S/C',

    // ✅ NUEVO
    codigo_barras: item.codigo_barras || null,

    cantidad: item.cantidad,

    // ✅ COSTO REAL DEL DTE
    precio_costo: parseFloat(item.precioUni || 0),

    // ✅ PRECIO VENTA MANUAL
    precio_venta: 0,

    subtotal: item.ventaGravada,
    unidad: item.uniMedida,
    item: item
});
        }
        
        // ========== SI HAY ÍTEMS NO ENCONTRADOS, MOSTRAR DIÁLOGO ==========
        if (itemsNoEncontrados.length > 0) {
            const nombresNoEncontrados = itemsNoEncontrados.map(i => `${i.codigo} - ${i.nombre}`);
            setProductosNoEncontradosMsg(nombresNoEncontrados);
            setPendingDteData({ 
                dteData, 
                itemsNoEncontrados,  // Guardar los items completos
                foundProv, 
                currentProveedorId,
                itemsProcesados: Array.from(itemsProcesados.values()) // Guardar los ya procesados
            });
            setShowDialog(true);
            setIsLoading(false);
            return;
        }
        
        // ========== SI NO HAY ÍTEMS NO ENCONTRADOS, PROCESAR DIRECTAMENTE ==========
        const nuevosDetalles = Array.from(itemsProcesados.values());
        
        console.log("📊 RESULTADO FINAL:");
        nuevosDetalles.forEach(d => {
            console.log(`  ✅ ${d.tipo === "materia_prima" ? "MP" : "Producto"}: ${d.producto_nombre}, Cantidad: ${d.cantidad}, Subtotal: $${d.subtotal.toFixed(2)}`);
        });
        
        setDetalles(nuevosDetalles);
        
        const totalGravado = parseFloat(nuevosDetalles.reduce((sum, d) => sum + d.subtotal, 0).toFixed(2));
        const fovialRedondeado = parseFloat(fovial.toFixed(2));
        const cotransRedondeado = parseFloat(cotrans.toFixed(2));
        const ivaRedondeado = parseFloat(iva.toFixed(2));
        const exentasInternas = parseFloat((fovialRedondeado + cotransRedondeado).toFixed(2));
        const totalCompras = parseFloat((totalGravado + ivaRedondeado + fovialRedondeado + cotransRedondeado).toFixed(2));
        
        setFormData(prev => {
            const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
            const tipoDteValue = String(dteData.identificacion?.tipoDte || "").padStart(2, '0');
            
            return {
                ...prev,
                fecha_emision: dteData.identificacion?.fecEmi || new Date().toISOString().split('T')[0],
                numero_documento: dteData.identificacion?.numeroControl || "",
                codigo_generacion: codigoGeneracion,
                sello_recepcion: selloRecepcion,
                nrc: emisorNrc || "",
                nit: emisorNit || "",
                nombre_proveedor: dteData.emisor?.nombre || "",
                proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                tipo_documento: tipoMap[tipoDteValue] || "CCF",
                gravadas_internas: totalGravado,
                credito_fiscal: ivaRedondeado,
                fovial: fovialRedondeado,
                cotrans: cotransRedondeado,
                exentas_internas: exentasInternas,
                total_compras: totalCompras
            };
        });
        
        addToast({ 
            type: 'success', 
            title: 'DTE Cargado Correctamente', 
            message: `Documento: ${dteData.identificacion?.numeroControl || "N/A"} - Total: $${totalCompras}`,
            duration: 5000
        });
        
        setIsLoading(false);
    } catch (error) {
        console.error("Error procesando DTE:", error);
        setError("Error al procesar el archivo DTE: " + error.message);
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
        } else if (name === 'fovial' || name === 'cotrans') {
            setFormData(prev => {
                const newData = { ...prev, [name]: parseFloat(value) || 0 };
                const fovialVal = parseFloat(newData.fovial) || 0;
                const cotransVal = parseFloat(newData.cotrans) || 0;
                newData.exentas_internas = fovialVal + cotransVal;
                newData.total_compras = calculateTotal(newData);
                return newData;
            });
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: parseFloat(value) || 0 };
                if ([
                    'exentas_internas', 'exentas_importaciones',
                    'gravadas_internas', 'gravadas_internaciones', 'gravadas_importaciones',
                    'compras_sujetos_excluidos', 'credito_fiscal', 'cesc',
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
            nit: "",
            tipo_compra: "local",
            descripcion: "",
            exentas_internas: 0,
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
            // Asegurar que cada detalle tenga unidad
            const detallesConUnidad = detalles.map(d => ({
                ...d,
                unidad: d.unidad && d.unidad !== "" ? d.unidad : "59"
            }));
            
            const payload = {
                ...formData,
                proveedor_id: parseInt(formData.proveedor_id),
                monto: parseFloat(formData.total_compras),
                monto_exento: parseFloat(formData.exentas_internas || 0),
                iva: parseFloat(formData.credito_fiscal || 0),
                locales: parseFloat(formData.gravadas_internas || 0),
                importaciones: parseFloat(formData.gravadas_importaciones || 0),
                exentas_internas: parseFloat(formData.exentas_internas || 0),
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
                detalles: detallesConUnidad.map(d => ({
                    producto_id: d.producto_id || null,
                    materia_prima_id: d.materia_prima_id || null,
                    es_materia_prima: d.es_materia_prima || false,
                    producto_codigo: d.producto_codigo || "",
                    producto_nombre: d.producto_nombre || "",
                    descripcion: d.descripcion || "",
                    cantidad: parseFloat(d.cantidad || 0),
                    precio_unitario: parseFloat(d.precio_unitario || 0),
                    subtotal: parseFloat(d.subtotal || 0),
                    tipo: d.tipo || "gasto",
                    unidad: d.unidad || "59"
                })),
                dteData: currentDteData
            };

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

            // Actualizar stock después de guardar la compra
            const actualizaciones = await actualizarStockProductos(detallesConUnidad);
            
            const stockMessages = actualizaciones.map(a => 
                `📦 ${a.nombre}: +${a.cantidadAgregada} ${getNombreUnidad(a.unidad)} → ${a.stock}`
            );

            const fechaActual = new Date().toLocaleDateString('es-SV', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            addToast({
                type: 'success',
                title: '¡Compra registrada y stock actualizado!',
                lines: [
                    `📄 Documento: ${data.numero_documento}`,
                    `💰 Total: ${formatCurrency(data.monto)}`,
                    `📦 Stock actualizado: ${actualizaciones.length} productos`,
                    ...stockMessages.slice(0, 3),
                    ...(stockMessages.length > 3 ? [`... y ${stockMessages.length - 3} más`] : []),
                    `🕐 ${fechaActual}`
                ],
                duration: 10000
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
        
        const emisorNit = dteData.emisor?.nit || null;
        const emisorNrc = dteData.emisor?.nrc || null;
        
        const productosAcumulados = new Map();

        const cuerpoDoc = dteData.cuerpoDocumento || [];
        for (const item of cuerpoDoc) {
            let foundProd = productos.find(p => p.codigo === item.codigo);
            if (!foundProd) {
                foundProd = productos.find(p => p.nombre?.toLowerCase() === item.descripcion?.toLowerCase());
            }
            
            if (foundProd) {
                const unidadDesdeJson = mapearUnidadDesdeJson(item.uniMedida);
                const key = foundProd.id;
                
                if (productosAcumulados.has(key)) {
                    const acumulado = productosAcumulados.get(key);
                    acumulado.cantidad += item.cantidad;
                    acumulado.subtotal = acumulado.cantidad * acumulado.precio_unitario;
                } else {
                    productosAcumulados.set(key, {
                        tipo: "producto",
                        producto_id: foundProd.id,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUni,
                        subtotal: item.ventaGravada,
                        unidad: unidadDesdeJson
                    });
                }
            } else {
                const key = `gasto_${item.descripcion}`;
                if (productosAcumulados.has(key)) {
                    const acumulado = productosAcumulados.get(key);
                    acumulado.cantidad += item.cantidad;
                    acumulado.subtotal = acumulado.cantidad * acumulado.precio_unitario;
                } else {
                    productosAcumulados.set(key, {
                        tipo: "gasto",
                        producto_id: null,
                        producto_codigo: null,
                        producto_nombre: null,
                        descripcion: item.descripcion,
                        cantidad: item.cantidad,
                        precio_unitario: item.precioUni,
                        subtotal: item.ventaGravada,
                        unidad: ""
                    });
                }
            }
        }

        const nuevosDetalles = Array.from(productosAcumulados.values());
        const nuevosDetallesConsolidados = consolidarDetalles(detalles, nuevosDetalles);

        if (nuevosDetalles.length > 0) {
            setDetalles(nuevosDetallesConsolidados);
            addToast({ 
                type: 'success', 
                title: 'Productos cargados', 
                message: `Se cargaron ${nuevosDetalles.filter(d => d.producto_id).length} productos y ${nuevosDetalles.filter(d => !d.producto_id).length} gastos.` 
            });
        }

        const { fovial, cotrans, iva, cesc } = extraerTributos(dteData);
        const totalProductos = dteData.resumen?.totalGravada || 0;
        const exentasConTributos = (fovial + cotrans) || 0;
        const selloRecepcion = extraerSelloRecepcion(dteData);
        const codigoGeneracion = dteData.identificacion?.codigoGeneracion || dteData.codigoGeneracion || null;

        setFormData(prev => {
            const tipoDteValue = String(dteData.identificacion?.tipoDte || "").padStart(2, '0');
            const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
            return {
                ...prev,
                fecha_emision: dteData.identificacion?.fecEmi || new Date().toISOString().split('T')[0],
                numero_documento: dteData.identificacion?.numeroControl || "",
                codigo_generacion: codigoGeneracion,
                sello_recepcion: selloRecepcion,
                nrc: emisorNrc || prev.nrc,
                nit: emisorNit || prev.nit,
                nombre_proveedor: dteData.emisor?.nombre || prev.nombre_proveedor,
                proveedor_id: pendingDteData.foundProv ? pendingDteData.foundProv.id : prev.proveedor_id,
                tipo_documento: tipoMap[tipoDteValue] || "CCF",
                gravadas_internas: totalProductos,
                credito_fiscal: iva,
                fovial: fovial,
                cotrans: cotrans,
                cesc: cesc,
                exentas_internas: exentasConTributos,
                total_compras: dteData.resumen?.totalPagar || 0
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
        // ✅ Usa itemsNoEncontrados en lugar de productosACrear
        const { dteData, itemsNoEncontrados, foundProv, currentProveedorId } = pendingDteData;
        
        const emisorNit = dteData.emisor?.nit || null;
        const emisorNrc = dteData.emisor?.nrc || null;
        
        let currentProductos = [...productos];
        const productosAcumulados = new Map();

        // 🔥 PASO 1: Crear SOLO los productos seleccionados que NO existen
        // ✅ itemsNoEncontrados es un array de objetos, no de strings
        for (let i = 0; i < itemsNoEncontrados.length; i++) {
            if (selectedProductosToCreate[i]) {
                const itemData = itemsNoEncontrados[i]; // ✅ Esto es un objeto con nombre, codigo, cantidad, precio, etc.
                
                try {
                    console.log(`📦 Creando nuevo producto: ${itemData.nombre}`);
                    
                    const precioUnitario = parseFloat(itemData.precio);
                    const cantidadOriginal = parseFloat(itemData.cantidad);
                    
                    // Determinar la unidad
                    let unidad = mapearUnidadDesdeJson(itemData.unidad);
                    
                    const response = await fetch(`${API_BASE_URL}/productos/addPro`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            nombre: itemData.nombre,
                            codigo: itemData.codigo || `PROD-${Date.now()}`,
                            // ✅ NUEVO
                            codigo_barras: itemData.codigo_barras || null,
                            unidad: unidad,
                            // ✅ PRECIO VENTA
                            precio: parseFloat(itemData.precio_venta || 0),
                            // ✅ PRECIO COSTO
                            precio_costo: parseFloat(itemData.precio_costo || precioUnitario),
                            preciooferta: 0,
                            stock: 0,
                            es_servicio: false,
                            idproveedor: currentProveedorId
                        }),
                    });

                    if (response.ok) {
                        const resJson = await response.json();
                        const newProd = resJson.producto;
                        currentProductos.push(newProd);
                        setProductos(prev => [...prev, newProd]);

                        // ✅ Agregar al acumulador con la cantidad correcta
                        const key = `prod_${newProd.id}`;
                        const subtotalOriginal = cantidadOriginal * precioUnitario;
                        
                        console.log(`   ✅ Producto creado: ${newProd.nombre}, cantidad: ${cantidadOriginal}`);
                        
                        productosAcumulados.set(key, {
                            tipo: "producto",
                            producto_id: foundProd.id,
                            producto_nombre: foundProd.nombre,
                            producto_codigo: foundProd.codigo,
                            // ✅ NUEVO
                            codigo_barras: foundProd.codigo_barras || null,
                            cantidad: parseFloat(item.cantidad.toFixed(4)),
                            // ✅ COSTO DEL DTE
                            precio_unitario: parseFloat(item.precioUni.toFixed(4)),
                            // ✅ NUEVOS CAMPOS
                            precio_costo: parseFloat(item.precioUni.toFixed(4)),
                            // ✅ ESTE ES EL PRECIO DE VENTA
                            precio_venta: parseFloat(foundProd.precio || 0),
                            subtotal: parseFloat(item.ventaGravada.toFixed(2)),
                            unidad: unidadDesdeJson
                        });
                    } else {
                        console.error("Error creando producto:", await response.text());
                    }
                } catch (err) {
                    console.error("Error creando producto:", err);
                }
            }
        }

        // 🔥 PASO 2: Procesar el resto de items (los que YA existían)
        const cuerpoDoc = dteData.cuerpoDocumento || [];
        for (const item of cuerpoDoc) {
            // Buscar el producto en currentProductos (incluye los nuevos creados)
            let foundProd = currentProductos.find(p => p.codigo === item.codigo);
            if (!foundProd) {
                foundProd = currentProductos.find(p => p.nombre?.toLowerCase() === item.descripcion?.toLowerCase());
            }
            
            if (foundProd) {
                const key = `prod_${foundProd.id}`;
                
                if (!productosAcumulados.has(key)) {
                    const unidadDesdeJson = mapearUnidadDesdeJson(item.uniMedida);
                    productosAcumulados.set(key, {
                        tipo: "producto",
                        producto_id: foundProd.id,
                        producto_nombre: foundProd.nombre,
                        producto_codigo: foundProd.codigo,
                        cantidad: parseFloat(item.cantidad.toFixed(4)),
                        precio_unitario: parseFloat(item.precioUni.toFixed(4)),
                        subtotal: parseFloat(item.ventaGravada.toFixed(2)),
                        unidad: unidadDesdeJson
                    });
                }
            } else {
                // Si no es producto, procesar como gasto
                const key = `gasto_${item.descripcion}`;
                if (!productosAcumulados.has(key)) {
                    productosAcumulados.set(key, {
                        tipo: "gasto",
                        descripcion: item.descripcion,
                        cantidad: parseFloat(item.cantidad),
                        precio_unitario: parseFloat(item.precioUni),
                        subtotal: parseFloat(item.ventaGravada),
                        unidad: ""
                    });
                }
            }
        }

        // Convertir el Map a array de detalles
        const nuevosDetalles = Array.from(productosAcumulados.values());

        console.log("📊 RESULTADO FINAL:");
        nuevosDetalles.forEach(d => {
            console.log(`  ✅ ${d.producto_nombre || d.descripcion}: Cantidad = ${d.cantidad}, Subtotal = $${d.subtotal.toFixed(2)}`);
        });

        setDetalles(nuevosDetalles);

        // Extraer tributos y actualizar formData
        const { fovial, cotrans, iva, cesc } = extraerTributos(dteData);
        const totalGravado = parseFloat(nuevosDetalles.reduce((sum, d) => sum + d.subtotal, 0).toFixed(2));
        const fovialRedondeado = parseFloat(fovial.toFixed(2));
        const cotransRedondeado = parseFloat(cotrans.toFixed(2));
        const ivaRedondeado = parseFloat(iva.toFixed(2));
        const exentasInternas = parseFloat((fovialRedondeado + cotransRedondeado).toFixed(2));
        const totalCompras = parseFloat((totalGravado + ivaRedondeado + fovialRedondeado + cotransRedondeado).toFixed(2));

        setFormData(prev => {
            const tipoMap = { "01": "FCF", "03": "CCF", "05": "NC", "06": "ND", "14": "FSE" };
            const tipoDteValue = String(dteData.identificacion?.tipoDte || "").padStart(2, '0');
            const selloRecepcion = extraerSelloRecepcion(dteData);
            const codigoGeneracion = dteData.identificacion?.codigoGeneracion || dteData.codigoGeneracion || null;
            
            return {
                ...prev,
                fecha_emision: dteData.identificacion?.fecEmi || new Date().toISOString().split('T')[0],
                numero_documento: dteData.identificacion?.numeroControl || "",
                codigo_generacion: codigoGeneracion,
                sello_recepcion: selloRecepcion,
                nrc: emisorNrc || prev.nrc,
                nit: emisorNit || prev.nit,
                nombre_proveedor: dteData.emisor?.nombre || prev.nombre_proveedor,
                proveedor_id: foundProv ? foundProv.id : prev.proveedor_id,
                tipo_documento: tipoMap[tipoDteValue] || "CCF",
                gravadas_internas: totalGravado,
                credito_fiscal: ivaRedondeado,
                fovial: fovialRedondeado,
                cotrans: cotransRedondeado,
                exentas_internas: exentasInternas,
                total_compras: totalCompras
            };
        });

        closeDialog(() => {
            setPendingDteData(null);
            setProductosNoEncontradosMsg([]);
            setSelectedProductosToCreate({});
            setIsLoading(false);
        });

        addToast({ 
            type: 'success', 
            title: 'Productos creados y cargados', 
            message: `Se crearon ${Object.values(selectedProductosToCreate).filter(v => v).length} productos nuevos. Total productos: ${nuevosDetalles.length}`,
            duration: 5000
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">NRC</label>
                                            <input 
                                                type="text" name="nrc" value={formData.nrc} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="NRC del proveedor"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                                            <input 
                                                type="text" name="nit" value={formData.nit} onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="NIT del proveedor"
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
                                        <div className="md:col-span-2">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    if (selectedProduct) {
                                                        handleSelectProduct(selectedProduct);
                                                    }
                                                }}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                                                disabled={!selectedProduct}
                                            >
                                                <FaPlus className="mr-2" /> Agregar Producto
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
                                        <div className="md:col-span-1">
                                            <button 
                                                type="button" 
                                                onClick={() => setShowMateriaPrimaModal(true)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                                            >
                                                <FaBoxOpen className="mr-2" /> MP
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 border">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto / Descripción</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Venta</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {detalles.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                                            No hay productos agregados.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    detalles.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 text-sm">
                                                                {item.tipo === "producto" && (
                                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Producto</span>
                                                                )}
                                                                {item.tipo === "materia_prima" && (
                                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">MP</span>
                                                                )}
                                                                {item.tipo === "gasto" && (
                                                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Gasto</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {item.producto_nombre || item.descripcion || "Sin descripción"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                {item.unidad ? getNombreUnidad(item.unidad) : "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidad}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">${parseFloat(item.precio_costo || item.precio_unitario || 0).toFixed(2)}</td>
<td className="px-4 py-3 text-sm text-right">
    <input
        type="number"
        min="0"
        step="0.01"
        value={item.precio_venta || 0}
        onChange={(e) => {const nuevosDetalles = [...detalles];nuevosDetalles[idx] = {...nuevosDetalles[idx],precio_venta: parseFloat(e.target.value) || 0};setDetalles(nuevosDetalles);}}className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-green-600 font-medium"/></td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${parseFloat(item.subtotal || 0).toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => handleOpenEditModal(idx)} 
                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                        title="Editar"
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => handleRemoveDetail(idx)} 
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                        title="Eliminar"
                                                                    >
                                                                        <FaTrash />
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
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Crédito Fiscal (IVA)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="credito_fiscal" 
                                                        value={formData.credito_fiscal} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01" 
                                                        placeholder="IVA 13%"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">FOVIAL</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="fovial" 
                                                        value={formData.fovial} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01" 
                                                        placeholder="Fondo de vialidad"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">COTRANS</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="cotrans" 
                                                        value={formData.cotrans} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01" 
                                                        placeholder="Contribución transporte"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">CESC</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="cesc" 
                                                        value={formData.cesc} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01" 
                                                        placeholder="CESC"
                                                    />
                                                </div>
                                            </div>
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

            {/* MODAL PARA SELECCIONAR UNIDAD DEL PRODUCTO */}
            {showProductoUnidadModal && tempProductData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Seleccionar Unidad para {tempProductData.nombre}
                            </h2>
                            <button
                                onClick={() => setShowProductoUnidadModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                            <div className="bg-gray-100 rounded-xl px-4 py-3">
                                <p className="font-medium text-gray-800">{tempProductData.nombre}</p>
                                <p className="text-xs text-gray-500">Código: {tempProductData.codigo}</p>
                            </div>
                        </div>

<div className="grid grid-cols-2 gap-3 mb-4">
    {/* CANTIDAD */}
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
        <input
            type="number"
            value={tempCantidad}
            onChange={(e) =>
                setTempCantidad(parseFloat(e.target.value) || 0)
            }
            className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
            min="0.01"
            step="0.01"
        />
    </div>
    {/* COSTO */}
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
        <input
            type="number"
            value={tempPrecio}
            onChange={(e) =>
                setTempPrecio(parseFloat(e.target.value) || 0)
            }
            className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
            min="0"
            step="0.01"
        />
    </div>
    {/* NUEVO PRECIO VENTA */}
    <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta ($)</label>
        <input
            type="number"
            value={tempPrecioVenta || 0}
            onChange={(e) =>
                setTempPrecioVenta(parseFloat(e.target.value) || 0)
            }
            className="w-full border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl px-3 py-2 outline-none transition-all"
            min="0"
            step="0.01"
        />
    </div>
</div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                            <select
                                value={tempUnidad}
                                onChange={(e) => setTempUnidad(e.target.value)}
                                className="w-full border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                            >
                                {unidadesDisponibles.map(unidad => (
                                    <option key={unidad.codigo} value={unidad.codigo}>
                                        {unidad.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-gray-50 border rounded-xl p-3 flex justify-between text-sm mb-4">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold text-gray-900">
                                ${((tempCantidad || 0) * (tempPrecio || 0)).toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowProductoUnidadModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarProductoConUnidad}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-2"
                            >
                                <FaPlus /> Agregar Producto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA EDITAR DETALLE (Cantidad, Precio y Unidad) */}
            {showEditModal && editDetailIndex !== null && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Editar Detalle
                            </h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Descripción</label>
                            <div className="bg-gray-100 rounded-xl px-4 py-3">
                                <p className="font-medium text-gray-800">
                                    {detalles[editDetailIndex]?.producto_nombre || detalles[editDetailIndex]?.descripcion || "Sin descripción"}
                                </p>
                                {detalles[editDetailIndex]?.tipo === "producto" && (
                                    <p className="text-xs text-gray-500">Código: {detalles[editDetailIndex]?.producto_codigo}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    value={editDetailData.cantidad}
                                    onChange={(e) => setEditDetailData({...editDetailData, cantidad: parseFloat(e.target.value) || 0})}
                                    className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
<div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
        Precio Costo ($)
    </label>

    <input
        type="number"
        value={editDetailData.precio_costo || 0}
        onChange={(e) =>
            setEditDetailData({
                ...editDetailData,
                precio_costo: parseFloat(e.target.value) || 0
            })
        }
        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
        min="0"
        step="0.01"
    />
</div>

<div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
        Precio Venta ($)
    </label>

    <input
        type="number"
        value={editDetailData.precio_venta || 0}
        onChange={(e) =>
            setEditDetailData({
                ...editDetailData,
                precio_venta: parseFloat(e.target.value) || 0
            })
        }
        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
        min="0"
        step="0.01"
    />
</div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                            <select
                                value={editDetailData.unidad}
                                onChange={(e) => setEditDetailData({...editDetailData, unidad: e.target.value})}
                                className="w-full border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                            >
                                {unidadesDisponibles.map(unidad => (
                                    <option key={unidad.codigo} value={unidad.codigo}>
                                        {unidad.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-gray-50 border rounded-xl p-3 flex justify-between text-sm mb-4">
                            <span className="text-gray-600">Nuevo Subtotal:</span>
                            <span className="font-semibold text-gray-900">
                                ${((editDetailData.cantidad || 0) * (editDetailData.precio_unitario || 0)).toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition flex items-center gap-2"
                            >
                                <FaSave /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA AGREGAR GASTO/SERVICIO */}
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

            {/* DIALOG PRODUCTOS NO ENCONTRADOS */}
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
                                <h2 className="text-base font-semibold text-blue-800">
                                    Productos no registrados
                                </h2>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    {productosNoEncontradosMsg.length} producto(s) del DTE no están en el inventario
                                </p>
                            </div>
                            <button onClick={handleDialogNo} className="text-blue-400 hover:text-blue-600 transition-colors">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600 mb-3">
                                Selecciona cuáles deseas agregar:
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
                                        <span className="text-sm text-gray-700 leading-tight">
                                            {item}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={handleDialogNo}
                                className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Agregar como gasto
                            </button>

                            <button
                                onClick={handleDialogYes}
                                disabled={!Object.values(selectedProductosToCreate).some(v => v)}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                            >
                                Agregar como producto
                            </button>

                            <button
                                onClick={handleAgregarMateriaPrimaDesdeDialog}
                                disabled={!Object.values(selectedProductosToCreate).some(v => v)}
                                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                            >
                                Agregar como MP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MATERIA PRIMA CON UNIDADES */}
            {showMateriaPrimaModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Agregar Materia Prima
                            </h2>
                            <button
                                onClick={() => setShowMateriaPrimaModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={mpSearch}
                                onChange={(e) => setMpSearch(e.target.value)}
                                placeholder="Buscar o crear materia prima..."
                                className="w-full border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                            />
                        </div>

                        {mpSearch && !mpSelected && (
                            <div className="border border-gray-200 rounded-xl max-h-44 overflow-y-auto mb-4 shadow-sm">
                                {materiasPrimas
                                    .filter(mp => mp.nombre.toLowerCase().includes(mpSearch.toLowerCase()))
                                    .map(mp => (
                                        <div
                                            key={mp.id}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition flex justify-between items-center"
                                            onClick={() => {
                                                setMpSelected(mp);
                                                setMpSearch(mp.nombre);
                                            }}
                                        >
                                            <span className="text-gray-800">{mp.nombre}</span>
                                            <span className="text-xs text-gray-400">Seleccionar</span>
                                        </div>
                                    ))}

                                {materiasPrimas.filter(mp => mp.nombre.toLowerCase().includes(mpSearch.toLowerCase())).length === 0 && (
                                    <div
                                        className="px-3 py-2 text-green-600 cursor-pointer hover:bg-green-50 text-sm transition"
                                        onClick={handleCreateMP}
                                    >
                                        ➕ Crear "<span className="font-medium">{mpSearch}</span>"
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            <input
                                type="number"
                                placeholder="Cantidad"
                                value={mpCantidad}
                                onChange={(e) => setMpCantidad(e.target.value)}
                                className="border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                            />

                            <input
                                type="number"
                                placeholder="Costo ($)"
                                value={mpCosto}
                                onChange={(e) => setMpCosto(e.target.value)}
                                className="border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                            />
                        </div>

                        <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                            <select
                                value={mpUnidad}
                                onChange={(e) => setMpUnidad(e.target.value)}
                                className="w-full border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all"
                            >
                                {unidadesDisponibles.map(unidad => (
                                    <option key={unidad.codigo} value={unidad.codigo}>
                                        {unidad.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4 bg-gray-50 border rounded-xl p-3 flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold text-gray-900">
                                ${((parseFloat(mpCantidad) || 0) * (parseFloat(mpCosto) || 0)).toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => setShowMateriaPrimaModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleAddMateriaPrima}
                                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition flex items-center gap-2"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}