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
    FaMoneyBillWave
} from "react-icons/fa";

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
        total_compras: 0
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

    const procesarDteActual = async (dteData) => {
        setIsLoading(true);
        try {
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
                const iva = dteData.resumen.tributos?.find(t => t.codigo === '20')?.valor || 0;
                
                const tipoDteValue = String(dteData.identificacion.tipoDte).padStart(2, '0');
                
                const tipoMap = {
                    "01": "FCF",
                    "03": "CCF",
                    "05": "NC",
                    "06": "ND",
                    "14": "FSE"
                };
                
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
                
                const tipoMap = {
                    "01": "FCF",
                    "03": "CCF",
                    "05": "NC",
                    "06": "ND",
                    "14": "FSE"
                };
                
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
                setSuccessMessage(`Se cargaron ${nuevosDetalles.length} productos correctamente.`);
                setTimeout(() => setSuccessMessage(""), 3000);
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
                detalles: detalles
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

            for (const detalle of detalles) {
                await fetch(`${API_BASE_URL}/productos/incrementStock/${detalle.producto_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ cantidad: detalle.cantidad }),
                });
            }

            setSuccessMessage("Compra registrada exitosamente.");
            
            window.scrollTo(0, 0);
            

            if (isProcessingMultiple && currentDteIndex < pendingDtes.length - 1) {
                const nextIndex = currentDteIndex + 1;
                setCurrentDteIndex(nextIndex);
                
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
                    total_compras: 0
                });
                setDetalles([]);
                
                setTimeout(() => {
                    procesarDteActual(pendingDtes[nextIndex]);
                }, 1000);
                
            } else {
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
                    total_compras: 0
                });
                setDetalles([]);
                setPendingDtes([]);
                setCurrentDteIndex(0);
                setIsProcessingMultiple(false);
            }
            
            setTimeout(() => setSuccessMessage(""), 3000);

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
                }
            }

            setFormData(prev => {
                const iva = dteData.resumen.tributos?.find(t => t.codigo === '20')?.valor || 0;
                
                const tipoDteValue = String(dteData.identificacion.tipoDte).padStart(2, '0');
                
                const tipoMap = {
                    "01": "FCF",
                    "03": "CCF",
                    "05": "NC",
                    "06": "ND",
                    "14": "FSE"
                };
                
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

            setShowDialog(false);
            setPendingDteData(null);
            setProductosNoEncontradosMsg([]);
            setSelectedProductosToCreate({});
            setIsLoading(false);

        } catch (error) {
            console.error("Error:", error);
            setError("Error al crear los productos.");
            setIsLoading(false);
        }
    };

    const handleDialogNo = () => {
        if (!pendingDteData) return;

        const { dteData } = pendingDteData;
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

        if (nuevosDetalles.length > 0) {
            setDetalles(prev => [...prev, ...nuevosDetalles]);
        }

        setShowDialog(false);
        setPendingDteData(null);
        setProductosNoEncontradosMsg([]);
        setSelectedProductosToCreate({});

        setFormData(prev => {
            const iva = dteData.resumen.tributos?.find(t => t.codigo === '20')?.valor || 0;
            
            const tipoDteValue = String(dteData.identificacion.tipoDte).padStart(2, '0');
            
            const tipoMap = {
                "01": "FCF",
                "03": "CCF",
                "05": "NC",
                "06": "ND",
                "14": "FSE"
            };
            
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

        setIsLoading(false);
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

                            {successMessage && (
                                <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">
                                    <p className="font-medium">Éxito</p>
                                    <p>{successMessage}</p>
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Registro</label>
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión Doc.</label>
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
                                                <label className="block text-xs font-medium text-gray-600 mb-1">COTRANS / CESC</label>
                                                <div className="flex space-x-2">
                                                    <input 
                                                        type="number" 
                                                        name="cotrans"
                                                        value={formData.cotrans} 
                                                        onChange={handleChange}
                                                        className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="COTRANS"
                                                        min="0" step="0.01"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        name="cesc"
                                                        value={formData.cesc} 
                                                        onChange={handleChange}
                                                        className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="CESC"
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-800">Retenciones / Percepciones</h3>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Anticipo IVA / Percepción</label>
                                                <div className="flex space-x-2">
                                                    <input 
                                                        type="number" 
                                                        name="anticipo_iva_percibido"
                                                        value={formData.anticipo_iva_percibido} 
                                                        onChange={handleChange}
                                                        className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Anticipo"
                                                        min="0" step="0.01"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        name="percepcion"
                                                        value={formData.percepcion} 
                                                        onChange={handleChange}
                                                        className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Percep."
                                                        min="0" step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Retención (1% / Terceros)</label>
                                                <div className="flex space-x-2">
                                                    <input 
                                                        type="number" 
                                                        name="retencion"
                                                        value={formData.retencion} 
                                                        onChange={handleChange}
                                                        className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Ret. 1%"
                                                        min="0" step="0.01"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        name="retencion_terceros"
                                                        value={formData.retencion_terceros} 
                                                        onChange={handleChange}
                                                        className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Terceros"
                                                        min="0" step="0.01"
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

            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                            <h2 className="text-lg font-bold text-blue-700">Productos no registrados</h2>
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
                                disabled={!Object.values(selectedProductosToCreate).some(v => v)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed"
                            >
                                Agregar al Inventario
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}