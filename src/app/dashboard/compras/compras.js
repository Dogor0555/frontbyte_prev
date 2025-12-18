"use client";
import { useState, useEffect, useMemo } from "react";
import { FaSearch, FaBars, FaPlus, FaTimes, FaEdit, FaTrash, FaSave, FaTimes as FaClose, FaShoppingCart, FaCalendarAlt, FaBuilding, FaBox } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";
import ModalDetallesCompra from "./components/ModalDetallesCompra";
import { API_BASE_URL } from "@/lib/api";

export default function Compras({ initialCompras = [], initialProveedores = [], user, hasHaciendaToken = false, haciendaStatus = {} }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [compras, setCompras] = useState(initialCompras || []);
    const [proveedores, setProveedores] = useState(initialProveedores || []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fechaError, setFechaError] = useState("");
    
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [errorCargaProductos, setErrorCargaProductos] = useState(null);
    const [detallesCompra, setDetallesCompra] = useState([]);

    const LIMITES = {
        DESCRIPCION: 500
    };

    const [formData, setFormData] = useState({
        fecha: "",
        proveedor_id: "",
        descripcion: "",
        numero_documento: "",
        monto_exento: "",
        iva: "",
        retencion: "",
        percepcion: "",
        locales: "",
        importaciones: "",
        monto: "",
        tipo_compra: "local"
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const comprasPorPagina = 10;

    const cargarProductos = async () => {
        setCargandoProductos(true);
        setErrorCargaProductos(null);
        try {
            const response = await fetch(`${API_BASE_URL}/productos/getAll`, {
                method: "GET",
                headers: { Cookie: document.cookie },
                credentials: "include",
            });

            if (!response.ok) throw new Error("Error al obtener los productos");

            const data = await response.json();
            setProductos(data);
        } catch (error) {
            console.error("Error al cargar productos:", error);
            setErrorCargaProductos(error.message);
        } finally {
            setCargandoProductos(false);
        }
    };

    const handleOpenDetallesModal = () => {
        cargarProductos();
        setShowDetallesModal(true);
    };

    const handleCloseDetallesModal = () => {
        setShowDetallesModal(false);
        setErrorCargaProductos(null);
    };

    const handleAddDetalles = (nuevosDetalles) => {
        setDetallesCompra(nuevosDetalles);
        
        const montoTotal = nuevosDetalles.reduce((total, detalle) => total + detalle.subtotal, 0);
        const totalFixed = montoTotal.toFixed(2);
        
        setFormData(prev => ({
            ...prev,
            monto: totalFixed,
            locales: prev.tipo_compra === 'local' ? totalFixed : "0.00",
            importaciones: prev.tipo_compra === 'importacion' ? totalFixed : "0.00"
        }));
    };

    const handleTipoCompraChange = (e) => {
        const tipo = e.target.value;
        const montoTotal = detallesCompra.reduce((total, detalle) => total + detalle.subtotal, 0).toFixed(2);
        setFormData(prev => ({
            ...prev,
            tipo_compra: tipo,
            locales: tipo === 'local' ? montoTotal : "0.00",
            importaciones: tipo === 'importacion' ? montoTotal : "0.00"
        }));
    };

    const filteredCompras = useMemo(() => {
        if (!compras.length) return [];
        if (!searchTerm.trim()) return compras;

        const term = searchTerm.toLowerCase();
        return compras.filter(compra => // The total amount is now calculated
            compra.id.toString().includes(searchTerm) ||
            compra.proveedor?.nombre.toLowerCase().includes(term) ||
            compra.descripcion?.toLowerCase().includes(term) ||
            compra.monto.toString().includes(searchTerm)
        );
    }, [searchTerm, compras]);

    const { totalPaginas, comprasPagina } = useMemo(() => {
        const total = Math.ceil(filteredCompras.length / comprasPorPagina);
        const paginated = filteredCompras.slice(
            (currentPage - 1) * comprasPorPagina,
            currentPage * comprasPorPagina
        );
        return { totalPaginas: total, comprasPagina: paginated };
    }, [filteredCompras, currentPage, comprasPorPagina]);

    const validateFecha = (fecha) => {
        if (!fecha) return false;
        const selectedDate = new Date(fecha);
        const today = new Date();
        return selectedDate <= today;
    };

    const validateMonto = (monto) => {
        if (!monto) return true; // Allow empty/0 values
        const numMonto = parseFloat(monto); // Check if it's a valid number
        return !isNaN(numMonto) && numMonto >= 0;
    };

    const validateDescripcion = (descripcion) => !descripcion || descripcion.length <= LIMITES.DESCRIPCION;

    const validateForm = () => {
        setFechaError("");
        setErrorMessage("");

        if (!validateFecha(formData.fecha)) {
            setFechaError("La fecha no puede ser futura.");
            return false;
        }

        if (!formData.numero_documento || formData.numero_documento.trim() === "") {
            setErrorMessage("El número de documento es obligatorio.");
            return false;
        }

        const numericFields = ['monto_exento', 'iva', 'retencion', 'percepcion', 'locales', 'importaciones'];
        for (const field of numericFields) {
            if (formData[field] && !validateMonto(formData[field])) {
                setErrorMessage(`El campo '${field}' debe ser un número válido mayor o igual a 0.`);
                return false;
            }
        }

        if (!validateDescripcion(formData.descripcion)) {
            setErrorMessage(`La descripción no puede exceder los ${LIMITES.DESCRIPCION} caracteres.`);
            return false;
        }

        if (!validateDescripcion(formData.descripcion)) {
            setErrorMessage(`La descripción no puede exceder los ${LIMITES.DESCRIPCION} caracteres.`);
            return false;
        }

        return true;
    };

    const handleFechaChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, fecha: value }));
        if (!validateFecha(value)) {
            setFechaError("La fecha no puede ser futura.");
        } else {
            setFechaError("");
        }
    };

    const handleDescripcionChange = (e) => {
        const value = e.target.value.slice(0, LIMITES.DESCRIPCION);
        setFormData(prev => ({ ...prev, descripcion: value }));
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
        setCompras(initialCompras || []);
        setProveedores(initialProveedores || []);
    }, [initialCompras, initialProveedores]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchCompras = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/compras/getAll`, {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json",
                    Cookie: document.cookie 
                },
                credentials: "include",
            });

            const responseText = await response.text();
            let data;
            
            try {
                data = responseText ? JSON.parse(responseText) : [];
            } catch (parseError) {
                console.error("Error parseando JSON en fetchCompras:", parseError);
                throw new Error("Respuesta inválida del servidor al obtener compras");
            }

            if (!response.ok) {
                throw new Error(data.error || "Error al obtener las compras");
            }

            setCompras(data);
        } catch (error) {
            console.error("Error al obtener las compras:", error);
            setErrorMessage("Error al cargar las compras: " + error.message);
            setShowErrorModal(true);
        }
    };

    const handleSaveNewCompra = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setShowErrorModal(true);
            return;
        }

        setIsLoading(true);

        try {
            const compraData = {
                fecha: formData.fecha,
                proveedor_id: parseInt(formData.proveedor_id),
                descripcion: formData.descripcion,
                numero_documento: formData.numero_documento,
                monto: parseFloat(formData.monto || 0),
                monto_exento: parseFloat(formData.monto_exento || 0),
                iva: parseFloat(formData.iva || 0),
                retencion: parseFloat(formData.retencion || 0),
                percepcion: parseFloat(formData.percepcion || 0),
                locales: parseFloat(formData.locales || 0),
                importaciones: parseFloat(formData.importaciones || 0),
                detalles: detallesCompra.map(detalle => ({
                    producto_id: detalle.producto_id,
                    cantidad: parseFloat(detalle.cantidad),
                    precio_unitario: parseFloat(detalle.precio_unitario),
                    subtotal: parseFloat(detalle.subtotal) 
                }))
            };

            const response = await fetch(`${API_BASE_URL}/compras/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(compraData),
            });

            const responseText = await response.text();
            console.log("Respuesta del servidor:", responseText);

            let responseData;
            try {
                responseData = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error("Error parseando JSON:", parseError);
                throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(responseData.error || responseData.message || `Error ${response.status}: ${response.statusText}`);
            }

            console.log("Compra creada exitosamente:", responseData);

            console.log("Actualizando stock...");
            for (const detalle of detallesCompra) {
                try {
                    const stockResponse = await fetch(`${API_BASE_URL}/productos/incrementStock/${detalle.producto_id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: document.cookie,
                        },
                        credentials: "include",
                        body: JSON.stringify({
                            cantidad: parseFloat(detalle.cantidad)
                        }),
                    });

                    if (!stockResponse.ok) {
                        const stockError = await stockResponse.text();
                        console.warn(`No se pudo actualizar stock del producto ${detalle.producto_id}:`, stockError);
                    } else {
                        console.log(`Stock actualizado para producto ${detalle.producto_id}`);
                    }
                } catch (stockError) {
                    console.warn(`Error actualizando stock del producto ${detalle.producto_id}:`, stockError);
                }
            }

            console.log("Compra completada exitosamente");
            setShowAddModal(false);
            setFormData({
                fecha: "",
                proveedor_id: "",
                descripcion: "",
                numero_documento: "",
                monto_exento: "",
                iva: "",
                retencion: "",
                percepcion: "",
                locales: "",
                importaciones: "",
                monto: "",
                tipo_compra: "local"
            });
            setDetallesCompra([]);
            fetchCompras();
            
        } catch (error) {
            console.error("Error al agregar la compra:", error);
            setErrorMessage(error.message || "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCompra = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setShowErrorModal(true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/compras/update/${formData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify({
                    fecha: formData.fecha,
                    proveedor_id: parseInt(formData.proveedor_id),
                    descripcion: formData.descripcion,
                    numero_documento: formData.numero_documento,
                    monto: parseFloat(formData.monto || 0),
                    monto_exento: parseFloat(formData.monto_exento || 0),
                    iva: parseFloat(formData.iva || 0),
                    retencion: parseFloat(formData.retencion || 0),
                    percepcion: parseFloat(formData.percepcion || 0),
                    locales: parseFloat(formData.locales || 0),
                    importaciones: parseFloat(formData.importaciones || 0)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al actualizar la compra");
            }

            setShowEditModal(false);
            setFormData({
                fecha: "",
                proveedor_id: "",
                descripcion: "",
                numero_documento: "",
                monto_exento: "",
                iva: "",
                retencion: "",
                percepcion: "",
                locales: "",
                importaciones: "",
                monto: "",
                tipo_compra: "local"
            });
            fetchCompras();
        } catch (error) {
            console.error("Error al actualizar la compra:", error);
            setErrorMessage(error.message || "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleDeleteCompra = async (compraId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/compras/delete/${compraId}`, {
                method: "DELETE",
                headers: { Cookie: document.cookie },
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al eliminar la compra");
            }

            fetchCompras();
        } catch (error) {
            console.error("Error al eliminar la compra:", error);
            setErrorMessage(error.message || "Error al eliminar la compra.");
            setShowErrorModal(true);
        }
    };

    const handleEditClick = (compra) => {
        const isImportacion = parseFloat(compra.importaciones) > 0;
        setFormData({
            id: compra.id,
            fecha: compra.fecha.split('T')[0],
            proveedor_id: compra.proveedor_id,
            descripcion: compra.descripcion || "",
            numero_documento: compra.numero_documento || "",
            monto_exento: compra.monto_exento || "",
            iva: compra.iva || "",
            retencion: compra.retencion || "",
            percepcion: compra.percepcion || "",
            locales: compra.locales || "",
            importaciones: compra.importaciones || "",
            monto: compra.monto || (parseFloat(compra.locales || 0) + parseFloat(compra.importaciones || 0)).toFixed(2),
            tipo_compra: isImportacion ? 'importacion' : 'local'
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (compraId) => {
        setFormData({ ...formData, id: compraId });
        setShowDeleteConfirmModal(true);
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const hasChanges = () => {
        return Object.values(formData).some(val => 
            (typeof val === 'string' && val.trim() !== '') || (typeof val === 'number' && val !== 0)
        ) || detallesCompra.length > 0;
    };

    const handleSearch = () => {
        if (searchTerm.trim() !== "") {
            setShowSearchResultsModal(true);
        }
    };

    const handleViewDetails = (compraId) => {
        router.push(`/dashboard/compras/${compraId}`);
    };

    const handleManageProviders = () => router.push("/dashboard/proveedores");
    const handleManageProducts = () => router.push("/dashboard/productos");

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString("es-ES");
    };

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat("es-SV", {
            style: "currency",
            currency: "USD"
        }).format(monto);
    };

    const getNombreProveedor = (proveedorId) => {
        const proveedor = proveedores.find(p => p.id === proveedorId);
        return proveedor ? proveedor.nombre : "N/A";
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <div className="flex flex-1 h-full overflow-hidden">
                <div
                    className={`md:static fixed z-40 h-full transition-all duration-300 ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${!isMobile ? 'md:translate-x-0 md:w-64' : ''}`}
                >
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

                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center">
                                <FaShoppingCart className="text-2xl text-blue-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Compras</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => router.push('/dashboard/realizar_compra')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaPlus className="mr-2" /> Agregar
                                </button>
                                <button
                                    onClick={handleManageProviders}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaBuilding className="mr-2" /> Proveedores
                                </button>
                                <button
                                    onClick={handleManageProducts}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaBox className="mr-2" /> Productos
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, proveedor, descripción o monto"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="text-gray-900 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    <FaSearch />
                                </button>
                            </div>
                        </div>

                        <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {comprasPagina && Array.isArray(comprasPagina) && comprasPagina.map((compra) => (
                                            <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <FaCalendarAlt className="text-gray-400 mr-2" />
                                                        {formatearFecha(compra.fecha)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                    {getNombreProveedor(compra.proveedor_id)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-center">
                                                    {compra.descripcion || "Sin descripción"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                                    {formatearMoneda(
                                                        (parseFloat(compra.locales) || 0) +
                                                        (parseFloat(compra.importaciones) || 0) +
                                                        (parseFloat(compra.monto_exento) || 0) +
                                                        (parseFloat(compra.iva) || 0) +
                                                        (parseFloat(compra.retencion) || 0) +
                                                        (parseFloat(compra.percepcion) || 0)
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                    <div className="flex justify-center items-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(compra.id)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            aria-label="Ver detalles"
                                                        >
                                                            <FaSearch />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(compra)}
                                                            className="text-green-600 hover:text-green-800"
                                                            aria-label="Editar"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(compra.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                            aria-label="Eliminar"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-center items-center py-4 space-x-2 border-t border-gray-200">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Anterior
                                </button>
                                <span className="px-2 text-sm text-gray-700">
                                    Página {currentPage} de {totalPaginas}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPaginas, p + 1))}
                                    disabled={currentPage === totalPaginas || totalPaginas === 0}
                                    className={`px-3 py-1 rounded-md border ${currentPage === totalPaginas || totalPaginas === 0 ? 'bg-gray-200 text-gray-400' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>

                        <div className="md:hidden">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {comprasPagina && Array.isArray(comprasPagina) && comprasPagina.map((compra) => (
                                    <div key={compra.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {getNombreProveedor(compra.proveedor_id)}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    <FaCalendarAlt className="inline mr-1" />
                                                    {formatearFecha(compra.fecha)}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(compra.id)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Ver detalles"
                                                >
                                                    <FaSearch />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(compra)}
                                                    className="text-green-600 hover:text-green-800"
                                                    aria-label="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(compra.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-sm text-gray-700">
                                                {compra.descripcion || "Sin descripción"}
                                            </p>
                                            <p className="text-lg font-bold text-green-600 mt-2">
                                                {formatearMoneda(
                                                    (parseFloat(compra.locales) || 0) +
                                                    (parseFloat(compra.importaciones) || 0) +
                                                    (parseFloat(compra.monto_exento) || 0) +
                                                    (parseFloat(compra.iva) || 0) +
                                                    (parseFloat(compra.retencion) || 0) +
                                                    (parseFloat(compra.percepcion) || 0)
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center items-center py-4 space-x-2 mt-4">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Anterior
                                </button>
                                <span className="px-2 text-sm text-gray-700">
                                    Página {currentPage} de {totalPaginas}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPaginas, p + 1))}
                                    disabled={currentPage === totalPaginas || totalPaginas === 0}
                                    className={`px-3 py-1 rounded-md border ${currentPage === totalPaginas || totalPaginas === 0 ? 'bg-gray-200 text-gray-400' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-lg font-semibold text-gray-900">Total Compras</h3>
                                <p className="text-2xl font-bold text-blue-600">{compras.length}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-lg font-semibold text-gray-900">Monto Total</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatearMoneda(compras.reduce((total, compra) => total +
                                        (parseFloat(compra.locales) || 0) +
                                        (parseFloat(compra.importaciones) || 0) +
                                        (parseFloat(compra.monto_exento) || 0) +
                                        (parseFloat(compra.iva) || 0) +
                                        (parseFloat(compra.retencion) || 0) +
                                        (parseFloat(compra.percepcion) || 0)
                                    , 0))}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <h3 className="text-lg font-semibold text-gray-900">Proveedores</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    {new Set(compras.map(c => c.proveedor_id)).size}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
            </div>

            <ModalDetallesCompra
                isOpen={showDetallesModal}
                onClose={handleCloseDetallesModal}
                onAddDetalles={handleAddDetalles}
                productosCargados={productos}
                cargandoProductos={cargandoProductos}
                errorCargaProductos={errorCargaProductos}
                proveedorSeleccionado={formData.proveedor_id}
            />

            {showSearchResultsModal && ( 
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Resultados de la Búsqueda</h3>
                            <button
                                onClick={() => setShowSearchResultsModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            {filteredCompras && Array.isArray(filteredCompras) && filteredCompras.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredCompras.map((compra) => (
                                        <div key={compra.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {getNombreProveedor(compra.proveedor_id)}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        <FaCalendarAlt className="inline mr-1" />
                                                        {formatearFecha(compra.fecha)} | 
                                                        {formatearMoneda(compra.monto)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-700">
                                                    {compra.descripcion || "Sin descripción"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-700">No se encontraron resultados.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Agregar Compra</h3>
                            <button
                                onClick={() => {
                                    if (hasChanges()) {
                                        setShowCancelConfirmModal(true);
                                    } else {
                                        setShowAddModal(false);
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <form onSubmit={handleSaveNewCompra}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fecha">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        id="fecha"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleFechaChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                    {fechaError && <p className="text-red-500 text-sm mt-1">{fechaError}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="proveedor_id">
                                        Proveedor *
                                    </label>
                                    <select
                                        id="proveedor_id"
                                        name="proveedor_id"
                                        value={formData.proveedor_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, proveedor_id: e.target.value }))}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar proveedor</option>
                                        {proveedores.map(proveedor => (
                                            <option key={proveedor.id} value={proveedor.id}>
                                                {proveedor.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Detalles de la Compra
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleOpenDetallesModal}
                                        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center"
                                    >
                                        <FaBox className="mr-2" />
                                        {detallesCompra.length > 0 
                                            ? `Ver Detalles (${detallesCompra.length} productos)` 
                                            : "Agregar Productos"
                                        }
                                    </button>
                                    {detallesCompra.length > 0 && (
                                        <p className="text-sm text-green-600 mt-1">
                                            ✓ {detallesCompra.length} producto(s) agregado(s)
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="numero_documento">
                                        Número de Documento *
                                    </label>
                                    <input
                                        type="text"
                                        id="numero_documento"
                                        name="numero_documento"
                                        value={formData.numero_documento}
                                        onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        placeholder="Ej: Factura #123"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Compra</label>
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-blue-600"
                                                name="tipo_compra"
                                                value="local"
                                                checked={formData.tipo_compra === 'local'}
                                                onChange={handleTipoCompraChange}
                                            />
                                            <span className="ml-2">Local</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-blue-600"
                                                name="tipo_compra"
                                                value="importacion"
                                                checked={formData.tipo_compra === 'importacion'}
                                                onChange={handleTipoCompraChange}
                                            />
                                            <span className="ml-2">Importación</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="locales">
                                            Compras Locales
                                        </label>
                                        <input
                                            type="number"
                                            id="locales"
                                            name="locales"
                                            value={formData.locales}
                                            readOnly
                                            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="importaciones">
                                            Importaciones
                                        </label>
                                        <input
                                            type="number"
                                            id="importaciones"
                                            name="importaciones"
                                            value={formData.importaciones}
                                            readOnly
                                            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                            placeholder="0.00" min="0" step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="monto_exento">
                                            Monto Exento
                                        </label>
                                        <input type="number" id="monto_exento" name="monto_exento" value={formData.monto_exento} onChange={(e) => setFormData(prev => ({ ...prev, monto_exento: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="iva">
                                            IVA
                                        </label>
                                        <input type="number" id="iva" name="iva" value={formData.iva} onChange={(e) => setFormData(prev => ({ ...prev, iva: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="retencion">
                                            Retención
                                        </label>
                                        <input type="number" id="retencion" name="retencion" value={formData.retencion} onChange={(e) => setFormData(prev => ({ ...prev, retencion: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="percepcion">
                                            Percepción
                                        </label>
                                        <input type="number" id="percepcion" name="percepcion" value={formData.percepcion} onChange={(e) => setFormData(prev => ({ ...prev, percepcion: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="descripcion">
                                        Descripción
                                    </label>
                                    <textarea
                                        id="descripcion"
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleDescripcionChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        rows="3"
                                        maxLength={LIMITES.DESCRIPCION}
                                        placeholder="Descripción opcional de la compra..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.descripcion?.length || 0}/{LIMITES.DESCRIPCION} caracteres</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (hasChanges()) {
                                                setShowCancelConfirmModal(true);
                                            } else {
                                                setShowAddModal(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Editar Compra</h3>
                            <button
                                onClick={() => {
                                    if (hasChanges()) {
                                        setShowCancelConfirmModal(true);
                                    } else {
                                        setShowEditModal(false);
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <form onSubmit={handleUpdateCompra}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fecha">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        id="fecha"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleFechaChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                    {fechaError && <p className="text-red-500 text-sm mt-1">{fechaError}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="proveedor_id">
                                        Proveedor *
                                    </label>
                                    <select
                                        id="proveedor_id"
                                        name="proveedor_id"
                                        value={formData.proveedor_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, proveedor_id: e.target.value }))}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar proveedor</option>
                                        {proveedores.map(proveedor => (
                                            <option key={proveedor.id} value={proveedor.id}>
                                                {proveedor.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="numero_documento">
                                        Número de Documento *
                                    </label>
                                    <input
                                        type="text"
                                        id="numero_documento"
                                        name="numero_documento"
                                        value={formData.numero_documento}
                                        onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Compra</label>
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-blue-600"
                                                name="tipo_compra_edit"
                                                value="local"
                                                checked={formData.tipo_compra === 'local'}
                                                onChange={handleTipoCompraChange}
                                            />
                                            <span className="ml-2">Local</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-blue-600"
                                                name="tipo_compra_edit"
                                                value="importacion"
                                                checked={formData.tipo_compra === 'importacion'}
                                                onChange={handleTipoCompraChange}
                                            />
                                            <span className="ml-2">Importación</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="locales">
                                            Compras Locales
                                        </label>
                                        <input type="number" id="locales" name="locales" value={formData.locales} readOnly className="text-black w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="importaciones">
                                            Importaciones
                                        </label>
                                        <input type="number" id="importaciones" name="importaciones" value={formData.importaciones} readOnly className="text-black w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="monto_exento">
                                            Monto Exento
                                        </label>
                                        <input type="number" id="monto_exento" name="monto_exento" value={formData.monto_exento} onChange={(e) => setFormData(prev => ({ ...prev, monto_exento: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="iva">
                                            IVA
                                        </label>
                                        <input type="number" id="iva" name="iva" value={formData.iva} onChange={(e) => setFormData(prev => ({ ...prev, iva: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="retencion">
                                            Retención
                                        </label>
                                        <input type="number" id="retencion" name="retencion" value={formData.retencion} onChange={(e) => setFormData(prev => ({ ...prev, retencion: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="percepcion">
                                            Percepción
                                        </label>
                                        <input type="number" id="percepcion" name="percepcion" value={formData.percepcion} onChange={(e) => setFormData(prev => ({ ...prev, percepcion: e.target.value }))} className="text-black w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="descripcion">
                                        Descripción
                                    </label>
                                    <textarea
                                        id="descripcion"
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleDescripcionChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        rows="3"
                                        maxLength={LIMITES.DESCRIPCION}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.descripcion?.length || 0}/{LIMITES.DESCRIPCION} caracteres</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (hasChanges()) {
                                                setShowCancelConfirmModal(true);
                                            } else {
                                                setShowEditModal(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Confirmar Eliminación</h3>
                            <button
                                onClick={() => setShowDeleteConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                ¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteCompra(formData.id);
                                        setShowDeleteConfirmModal(false);
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCancelConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Confirmar Cancelación</h3>
                            <button
                                onClick={() => setShowCancelConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Tienes cambios sin guardar. ¿Estás seguro de que deseas cancelar?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCancelConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                >
                                    Continuar Editando
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCancelConfirmModal(false);
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setFormData({
                                            fecha: "",
                                            proveedor_id: "",
                                            descripcion: "",
                                            numero_documento: "",
                                            monto_exento: "",
                                            iva: "",
                                            retencion: "",
                                            percepcion: "",
                                            locales: "",
                                            importaciones: "",
                                            monto: "",
                                            tipo_compra: "local"
                                        });
                                        setDetallesCompra([]);
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                >
                                    Confirmar Cancelación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Error</h3>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">{errorMessage}</p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}