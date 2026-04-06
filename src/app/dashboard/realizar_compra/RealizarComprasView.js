"use client";
import { useState, useEffect, useMemo } from "react";
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
    FaSpinner
} from "react-icons/fa";

// ========== MODAL DE ÉXITO ==========
const SuccessModal = ({ message, onClose, totalProcessed, totalFiles }) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [onClose]);

    const lines = message.split('\n').filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {totalFiles > 1 ? `¡${totalProcessed} Compras Registradas!` : "¡Compra Registrada!"}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {totalFiles > 1 
                            ? `Se procesaron ${totalProcessed} de ${totalFiles} archivos exitosamente` 
                            : "La compra se guardó exitosamente"}
                    </p>
                </div>

                <div className="px-8 py-6 space-y-3 max-h-60 overflow-y-auto">
                    {lines.map((line, i) => (
                        <div key={i} className="flex items-center text-gray-700 text-sm bg-gray-50 rounded-lg px-4 py-2">
                            <span>{line}</span>
                        </div>
                    ))}
                </div>

                <div className="px-8 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                    >
                        Aceptar ({countdown}s)
                    </button>
                </div>

                <div className="h-1 w-full bg-green-100">
                    <div
                        className="h-full bg-green-500"
                        style={{
                            width: `${(countdown / 5) * 100}%`,
                            transition: 'width 1s linear'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

// ========== MODAL DE PROCESAMIENTO ==========
const ProcessingModal = ({ current, total, fileName }) => {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Procesando compras...</h3>
                <p className="text-gray-600 mb-4">
                    Procesando archivo {current} de {total}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(current / total) * 100}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-500 truncate">{fileName}</p>
            </div>
        </div>
    );
};

export default function RealizarComprasView({ user, hasHaciendaToken, haciendaStatus }) {
    const router = useRouter();
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    
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

    const [detalles, setDetalles] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addQuantity, setAddQuantity] = useState(1);
    const [addPrice, setAddPrice] = useState("");

    const [showDialog, setShowDialog] = useState(false);
    const [productosNoEncontradosMsg, setProductosNoEncontradosMsg] = useState([]);
    const [pendingDteData, setPendingDteData] = useState(null);
    const [selectedProductosToCreate, setSelectedProductosToCreate] = useState({});
    
    // Variables para el procesamiento en cola
    const [pendingDtes, setPendingDtes] = useState([]);
    const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0); // Cuál vamos procesando (0-based)
    const [isProcessingMultiple, setIsProcessingMultiple] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const [finalSuccessMessage, setFinalSuccessMessage] = useState("");
    const [showFinalSuccess, setShowFinalSuccess] = useState(false);
    const [savedCompraIds, setSavedCompraIds] = useState([]);

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
        if (addQuantity <= 0) return alert("La cantidad debe ser mayor a 0");
        if (addPrice < 0) return alert("El precio no puede ser negativo");

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

    // ========== MANEJADOR PRINCIPAL ==========
    const handleDteLoaded = async (dtesData) => {
        const dtes = Array.isArray(dtesData) ? dtesData : [dtesData];
        
        if (dtes.length === 0) return;
        
        console.log(`📦 Se cargaron ${dtes.length} archivos para procesar`);
        
        setPendingDtes(dtes);
        setCurrentProcessingIndex(0);
        setProcessedCount(0);
        setSavedCompraIds([]);
        setIsProcessingMultiple(true);
        setShowProcessingModal(true);
        setFinalSuccessMessage("");
        setShowFinalSuccess(false);
        
        // Iniciar procesamiento del primer DTE
        await procesarDteEnCola(dtes, 0);
    };

    // ========== PROCESAR DTE EN COLA ==========
    const procesarDteEnCola = async (dtesArray, index) => {
        if (index >= dtesArray.length) {
            // Terminamos todos
            console.log("✅ Todos los archivos procesados");
            finalizarProcesamientoMultiple();
            return;
        }

        const dteData = dtesArray[index];
        const currentFileNum = index + 1;
        const totalFiles = dtesArray.length;
        
        console.log(`🔄 Procesando archivo ${currentFileNum} de ${totalFiles}: ${dteData.identificacion?.numeroControl || 'sin número'}`);
        
        setCurrentProcessingIndex(currentFileNum);
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

            // Extraer código de generación y sello de recepción
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

            // Extraer impuestos
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

            // Verificar productos no encontrados
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
                // Guardar el estado actual y mostrar diálogo
                setPendingDteData({ 
                    dteData, 
                    productosACrear, 
                    foundProv, 
                    currentProveedorId,
                    currentIndex: index,
                    dtesArray,
                    fovial,
                    cotrans,
                    iva,
                    codigoGeneracion,
                    selloRecepcion
                });
                setProductosNoEncontradosMsg(productosNoEncontrados);
                setSelectedProductosToCreate({});
                setShowDialog(true);
                setIsLoading(false);
                return;
            }

            // Si no hay productos faltantes, procesar directamente
            await guardarCompraActual(dteData, foundProv, currentProveedorId, {
                fovial, cotrans, iva, codigoGeneracion, selloRecepcion
            }, dtesArray, index);

        } catch (error) {
            console.error("Error procesando DTE:", error);
            setError(`Error al procesar el archivo ${currentFileNum}: ${error.message}`);
            setIsLoading(false);
            setShowProcessingModal(false);
            setIsProcessingMultiple(false);
        }
    };

    // ========== GUARDAR COMPRA ACTUAL ==========
    const guardarCompraActual = async (dteData, foundProv, currentProveedorId, impuestos, dtesArray, currentIndex) => {
        const { fovial, cotrans, iva, codigoGeneracion, selloRecepcion } = impuestos;
        
        // Construir detalles
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

        const tipoMap = {
            "01": "FCF",
            "03": "CCF",
            "05": "NC",
            "06": "ND",
            "14": "FSE"
        };

        const compraData = {
            fecha: new Date().toISOString().split('T')[0],
            fecha_emision: dteData.identificacion.fecEmi,
            proveedor_id: foundProv ? foundProv.id : "",
            nombre_proveedor: dteData.emisor.nombre,
            numero_documento: dteData.identificacion.numeroControl,
            tipo_documento: tipoMap[String(dteData.identificacion?.tipoDte).padStart(2, '0')] || "CCF",
            nrc: dteData.emisor.nrc,
            tipo_compra: "local",
            descripcion: "",
            exentas_internas: 0,
            exentas_internaciones: 0,
            exentas_importaciones: 0,
            gravadas_internas: dteData.resumen.totalGravada || 0,
            gravadas_internaciones: 0,
            gravadas_importaciones: 0,
            compras_sujetos_excluidos: 0,
            credito_fiscal: iva,
            fovial: fovial,
            cotrans: cotrans,
            cesc: 0,
            anticipo_iva_percibido: 0,
            retencion: 0,
            percepcion: 0,
            retencion_terceros: 0,
            total_compras: dteData.resumen.totalPagar || 0,
            codigo_generacion: codigoGeneracion,
            sello_recepcion: selloRecepcion,
            detalles: nuevosDetalles,
            dteData: dteData
        };

        try {
            console.log(`💾 Guardando compra ${currentIndex + 1}...`);
            
            const response = await fetch(`${API_BASE_URL}/compras/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(compraData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || "Error al guardar la compra");
            }

            const newProcessedCount = processedCount + 1;
            setProcessedCount(newProcessedCount);
            setSavedCompraIds(prev => [...prev, data.id]);
            
            console.log(`✅ Compra ${currentIndex + 1} guardada correctamente. ID: ${data.id}`);
            
            // Procesar el siguiente DTE
            const nextIndex = currentIndex + 1;
            await procesarDteEnCola(dtesArray, nextIndex);

        } catch (err) {
            console.error("Error guardando compra:", err);
            setError(`Error al guardar compra ${currentIndex + 1}: ${err.message}`);
            setShowProcessingModal(false);
            setIsProcessingMultiple(false);
            setIsLoading(false);
        }
    };

    // ========== FINALIZAR PROCESAMIENTO MÚLTIPLE ==========
    const finalizarProcesamientoMultiple = () => {
        console.log(`🏁 Finalizado. ${processedCount + 1} compras guardadas de ${pendingDtes.length}`);
        
        setShowProcessingModal(false);
        setIsProcessingMultiple(false);
        setIsLoading(false);
        
        // Mostrar modal de éxito final
        const fechaActual = new Date().toLocaleDateString('es-SV', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const totalGuardadas = processedCount + 1;
        const totalArchivos = pendingDtes.length;
        
        setFinalSuccessMessage(
            `✅ Procesados: ${totalGuardadas} de ${totalArchivos} archivos\n` +
            `📄 Documentos guardados: ${totalGuardadas}\n` +
            `🕐 Finalizado: ${fechaActual}`
        );
        setShowFinalSuccess(true);
        
        // Limpiar estado
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
        setPendingDtes([]);
        setCurrentProcessingIndex(0);
        setCurrentDteData(null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

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
                detalles: detalles,
                dteData: currentDteData
            };

            const response = await fetch(`${API_BASE_URL}/compras/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || "Error al guardar la compra");
            }

            const fechaActual = new Date().toLocaleDateString('es-SV', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            setSuccessMessage(
                `📄 Documento: ${data.numero_documento}\n` +
                `💰 Total: ${formatCurrency(data.monto)}\n` +
                `📦 Productos: ${detalles.length}\n` +
                `🕐 ${fechaActual}`
            );

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

    // ========== MANEJADOR DEL DIÁLOGO "SÍ" ==========
    const handleDialogYes = async () => {
        if (!pendingDteData) return;

        setIsLoading(true);
        setShowDialog(false);
        
        try {
            const { 
                dteData, 
                productosACrear, 
                foundProv, 
                currentProveedorId, 
                currentIndex,
                dtesArray,
                fovial, 
                cotrans, 
                iva, 
                codigoGeneracion, 
                selloRecepcion 
            } = pendingDteData;
            
            let currentProductos = [...productos];
            const nuevosDetalles = [];

            // Crear productos seleccionados
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

            // Agregar productos existentes que no se crearon
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
                }
            }

            // Actualizar productos globales
            setProductos(currentProductos);
            
            // Guardar la compra
            const tipoMap = {
                "01": "FCF",
                "03": "CCF",
                "05": "NC",
                "06": "ND",
                "14": "FSE"
            };

            const compraData = {
                fecha: new Date().toISOString().split('T')[0],
                fecha_emision: dteData.identificacion.fecEmi,
                proveedor_id: foundProv ? foundProv.id : "",
                nombre_proveedor: dteData.emisor.nombre,
                numero_documento: dteData.identificacion.numeroControl,
                tipo_documento: tipoMap[String(dteData.identificacion?.tipoDte).padStart(2, '0')] || "CCF",
                nrc: dteData.emisor.nrc,
                tipo_compra: "local",
                descripcion: "",
                exentas_internas: 0,
                exentas_internaciones: 0,
                exentas_importaciones: 0,
                gravadas_internas: dteData.resumen.totalGravada || 0,
                gravadas_internaciones: 0,
                gravadas_importaciones: 0,
                compras_sujetos_excluidos: 0,
                credito_fiscal: iva,
                fovial: fovial,
                cotrans: cotrans,
                cesc: 0,
                anticipo_iva_percibido: 0,
                retencion: 0,
                percepcion: 0,
                retencion_terceros: 0,
                total_compras: dteData.resumen.totalPagar || 0,
                codigo_generacion: codigoGeneracion,
                sello_recepcion: selloRecepcion,
                detalles: nuevosDetalles,
                dteData: dteData
            };

            const response = await fetch(`${API_BASE_URL}/compras/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(compraData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || errData.message || "Error al guardar la compra");
            }

            const data = await response.json();
            
            const newProcessedCount = processedCount + 1;
            setProcessedCount(newProcessedCount);
            setSavedCompraIds(prev => [...prev, data.id]);
            
            console.log(`✅ Compra ${currentIndex + 1} guardada con productos nuevos. ID: ${data.id}`);
            
            setPendingDteData(null);
            setProductosNoEncontradosMsg([]);
            setSelectedProductosToCreate({});

            // Procesar el siguiente DTE
            const nextIndex = currentIndex + 1;
            await procesarDteEnCola(dtesArray, nextIndex);

        } catch (error) {
            console.error("Error:", error);
            setError(`Error al crear productos/guardar compra: ${error.message}`);
            setShowProcessingModal(false);
            setIsProcessingMultiple(false);
            setIsLoading(false);
            setShowDialog(false);
        }
    };

    // ========== MANEJADOR DEL DIÁLOGO "NO" ==========
    const handleDialogNo = () => {
        if (!pendingDteData) return;

        const { 
            dteData, 
            foundProv, 
            currentIndex,
            dtesArray,
            fovial, 
            cotrans, 
            iva, 
            codigoGeneracion, 
            selloRecepcion 
        } = pendingDteData;
        
        const nuevosDetalles = [];

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
            }
        }

        setShowDialog(false);
        
        // Guardar la compra solo con los productos existentes
        const tipoMap = {
            "01": "FCF",
            "03": "CCF",
            "05": "NC",
            "06": "ND",
            "14": "FSE"
        };

        const guardarCompraSinProductosNuevos = async () => {
            setIsLoading(true);
            
            try {
                const compraData = {
                    fecha: new Date().toISOString().split('T')[0],
                    fecha_emision: dteData.identificacion.fecEmi,
                    proveedor_id: foundProv ? foundProv.id : "",
                    nombre_proveedor: dteData.emisor.nombre,
                    numero_documento: dteData.identificacion.numeroControl,
                    tipo_documento: tipoMap[String(dteData.identificacion?.tipoDte).padStart(2, '0')] || "CCF",
                    nrc: dteData.emisor.nrc,
                    tipo_compra: "local",
                    descripcion: "",
                    exentas_internas: 0,
                    exentas_internaciones: 0,
                    exentas_importaciones: 0,
                    gravadas_internas: dteData.resumen.totalGravada || 0,
                    gravadas_internaciones: 0,
                    gravadas_importaciones: 0,
                    compras_sujetos_excluidos: 0,
                    credito_fiscal: iva,
                    fovial: fovial,
                    cotrans: cotrans,
                    cesc: 0,
                    anticipo_iva_percibido: 0,
                    retencion: 0,
                    percepcion: 0,
                    retencion_terceros: 0,
                    total_compras: dteData.resumen.totalPagar || 0,
                    codigo_generacion: codigoGeneracion,
                    sello_recepcion: selloRecepcion,
                    detalles: nuevosDetalles,
                    dteData: dteData
                };

                const response = await fetch(`${API_BASE_URL}/compras/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(compraData),
                });

                if (!response.ok) {
                    throw new Error("Error al guardar la compra");
                }

                const data = await response.json();
                
                const newProcessedCount = processedCount + 1;
                setProcessedCount(newProcessedCount);
                setSavedCompraIds(prev => [...prev, data.id]);
                
                console.log(`✅ Compra ${currentIndex + 1} guardada (sin productos nuevos). ID: ${data.id}`);
                
                setPendingDteData(null);
                setProductosNoEncontradosMsg([]);
                setSelectedProductosToCreate({});

                // Procesar el siguiente DTE
                const nextIndex = currentIndex + 1;
                await procesarDteEnCola(dtesArray, nextIndex);

            } catch (err) {
                console.error("Error:", err);
                setError(`Error al guardar compra: ${err.message}`);
                setShowProcessingModal(false);
                setIsProcessingMultiple(false);
                setIsLoading(false);
            }
        };

        guardarCompraSinProductosNuevos();
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

            {/* MODAL DE ÉXITO FINAL */}
            {showFinalSuccess && (
                <SuccessModal
                    message={finalSuccessMessage}
                    onClose={() => {
                        setShowFinalSuccess(false);
                        setFinalSuccessMessage("");
                    }}
                    totalProcessed={processedCount + 1}
                    totalFiles={pendingDtes.length}
                />
            )}

            {/* MODAL DE PROCESAMIENTO */}
            {showProcessingModal && pendingDtes.length > 0 && (
                <ProcessingModal 
                    current={currentProcessingIndex}
                    total={pendingDtes.length}
                    fileName={pendingDtes[currentProcessingIndex - 1]?.identificacion?.numeroControl || `Archivo ${currentProcessingIndex}`}
                />
            )}

            {/* MODAL DE ÉXITO INDIVIDUAL (solo para compras manuales) */}
            {successMessage && !isProcessingMultiple && (
                <SuccessModal
                    message={successMessage}
                    onClose={() => setSuccessMessage("")}
                    totalProcessed={1}
                    totalFiles={1}
                />
            )}

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
                                    {isProcessingMultiple && pendingDtes.length > 0 && !showProcessingModal && (
                                        <p className="text-sm text-green-600 mt-1">
                                            ✅ Procesados: {processedCount + 1} de {pendingDtes.length} archivos
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

                                {/* Resto del formulario igual... */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Datos Generales</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Registro en Sistema</label>
                                            <input 
                                                type="date" 
                                                name="fecha" 
                                                value={formData.fecha} 
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión del Documento</label>
                                            <input 
                                                type="date" 
                                                name="fecha_emision" 
                                                value={formData.fecha_emision} 
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                            <select 
                                                name="proveedor_id" 
                                                value={formData.proveedor_id} 
                                                onChange={handleChange}
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
                                                type="text" 
                                                name="nombre_proveedor" 
                                                value={formData.nombre_proveedor} 
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Nombre en documento"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">N° Documento</label>
                                            <input 
                                                type="text" 
                                                name="numero_documento" 
                                                value={formData.numero_documento} 
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Ej: FAC-001"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                                            <select 
                                                name="tipo_documento" 
                                                value={formData.tipo_documento} 
                                                onChange={handleChange}
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
                                                type="text" 
                                                name="nrc" 
                                                value={formData.nrc} 
                                                onChange={handleChange}
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
                                                type="text" 
                                                name="descripcion" 
                                                value={formData.descripcion} 
                                                onChange={handleChange}
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
                                                    type="text" 
                                                    value={productSearch} 
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
                                                type="number" 
                                                value={addQuantity} 
                                                onChange={(e) => setAddQuantity(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                min="0.01" step="0.01"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
                                            <input 
                                                type="number" 
                                                value={addPrice} 
                                                onChange={(e) => setAddPrice(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                min="0" step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <button 
                                                type="button"
                                                onClick={handleAddDetail}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                                                disabled={!selectedProduct}
                                            >
                                                <FaPlus className="mr-2" /> Agregar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 border">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
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
                                                            <td className="px-4 py-3 text-sm text-gray-900">{item.producto_codigo}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{item.producto_nombre}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidad}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.precio_unitario.toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${item.subtotal.toFixed(2)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleRemoveDetail(idx)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
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

                                {/* Totales y Retenciones */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Totales y Retenciones</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Compras Gravadas</h3>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Internas</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="gravadas_internas"
                                                        value={formData.gravadas_internas} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Importaciones</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="gravadas_importaciones"
                                                        value={formData.gravadas_importaciones} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Internaciones</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="gravadas_internaciones"
                                                        value={formData.gravadas_internaciones} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Compras Exentas</h3>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Internas</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="exentas_internas"
                                                        value={formData.exentas_internas} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Importaciones</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="exentas_importaciones"
                                                        value={formData.exentas_importaciones} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Sujetos Excluidos</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="compras_sujetos_excluidos"
                                                        value={formData.compras_sujetos_excluidos} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
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
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Retenciones / Percepciones</h3>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Anticipo IVA</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="anticipo_iva_percibido"
                                                        value={formData.anticipo_iva_percibido} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                        placeholder="Anticipo"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Percepción</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="percepcion"
                                                        value={formData.percepcion} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                        placeholder="Percep."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Retención (1%)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="retencion"
                                                        value={formData.retencion} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                        placeholder="Ret. 1%"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Retención Terceros</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        name="retencion_terceros"
                                                        value={formData.retencion_terceros} 
                                                        onChange={handleChange}
                                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        min="0" step="0.01"
                                                        placeholder="Terceros"
                                                    />
                                                </div>
                                            </div>

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
                                        disabled={isLoading || isProcessingMultiple}
                                        className={`px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center ${(isLoading || isProcessingMultiple) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {(isLoading || isProcessingMultiple) ? (
                                            <>
                                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                {isProcessingMultiple ? "Procesando..." : "Guardando..."}
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

            {/* Diálogo de productos no registrados */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                            <h2 className="text-lg font-bold text-blue-700">Productos no registrados</h2>
                            <p className="text-sm text-blue-600 mt-1">
                                Archivo {currentProcessingIndex} de {pendingDtes.length}
                            </p>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Los siguientes productos del DTE no están registrados en el inventario. Selecciona cuáles deseas agregar:
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-y-auto space-y-2">
                                {productosNoEncontradosMsg.map((item, idx) => (
                                    <label key={idx} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedProductosToCreate[idx] || false}
                                            onChange={() => handleCheckboxChange(idx)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="ml-3 text-sm text-gray-700">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                            <button 
                                onClick={handleDialogNo}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium transition-colors"
                            >
                                No agregar
                            </button>
                            <button 
                                onClick={handleDialogYes}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
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