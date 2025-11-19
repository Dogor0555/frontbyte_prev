"use client";
import { useState, useEffect, useMemo } from "react";
import { FaSearch, FaBars, FaPlus, FaTimes, FaEdit, FaShoppingCart, FaTrash, FaFilePdf, FaSave, FaTimes as FaClose, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

export default function Proveedores({ initialProveedores = [], user, hasHaciendaToken = false, haciendaStatus = {} }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [proveedores, setProveedores] = useState(initialProveedores || []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [nombreError, setNombreError] = useState("");
    const [codigoError, setCodigoError] = useState("");
    
    // Límites de caracteres para cada campo
    const LIMITES = {
        NOMBRE: 100,
        CODIGO: 20,
        DESCRIPCION: 255
    };

    const [formData, setFormData] = useState({
        codigo: "",
        nombre: "",
        descripcion: ""
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const proveedoresPorPagina = 10;

    // ✅ SIMPLIFICADO: Cálculo directo sin useMemo complejo
    const filteredProveedores = useMemo(() => {
        if (!proveedores.length) return [];
        if (!searchTerm.trim()) return proveedores;

        const term = searchTerm.toLowerCase();
        return proveedores.filter(proveedor =>
            proveedor.id.toString().includes(searchTerm) ||
            proveedor.codigo.toLowerCase().includes(term) ||
            proveedor.nombre.toLowerCase().includes(term) ||
            (proveedor.descripcion && proveedor.descripcion.toLowerCase().includes(term))
        );
    }, [searchTerm, proveedores]);

    // ✅ SIMPLIFICADO: Cálculo de paginación
    const { totalPaginas, proveedoresPagina } = useMemo(() => {
        const total = Math.ceil(filteredProveedores.length / proveedoresPorPagina);
        const paginated = filteredProveedores.slice(
            (currentPage - 1) * proveedoresPorPagina,
            currentPage * proveedoresPorPagina
        );
        return { totalPaginas: total, proveedoresPagina: paginated };
    }, [filteredProveedores, currentPage, proveedoresPorPagina]);

    // ✅ Validaciones simplificadas
    const validateNombre = (nombre) => nombre.length <= LIMITES.NOMBRE;
    const validateCodigo = (codigo) => codigo.length <= LIMITES.CODIGO;
    const validateDescripcion = (descripcion) => !descripcion || descripcion.length <= LIMITES.DESCRIPCION;

    const validateForm = () => {
        setNombreError("");
        setCodigoError("");
        setErrorMessage("");

        if (!validateNombre(formData.nombre)) {
            setNombreError(`El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`);
            return false;
        }

        if (!validateCodigo(formData.codigo)) {
            setCodigoError(`El código no puede exceder los ${LIMITES.CODIGO} caracteres.`);
            return false;
        }

        if (!validateDescripcion(formData.descripcion)) {
            setErrorMessage(`La descripción no puede exceder los ${LIMITES.DESCRIPCION} caracteres.`);
            return false;
        }

        return true;
    };

    // ✅ Handlers simplificados
    const handleNombreChange = (e) => {
        const value = e.target.value.slice(0, LIMITES.NOMBRE);
        setFormData(prev => ({ ...prev, nombre: value }));
        if (!validateNombre(value)) {
            setNombreError(`El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`);
        } else {
            setNombreError("");
        }
    };

    const handleCodigoChange = (e) => {
        const value = e.target.value.slice(0, LIMITES.CODIGO).toUpperCase();
        setFormData(prev => ({ ...prev, codigo: value }));
        if (!validateCodigo(value)) {
            setCodigoError(`El código no puede exceder los ${LIMITES.CODIGO} caracteres.`);
        } else {
            setCodigoError("");
        }
    };

    const handleDescripcionChange = (e) => {
        const value = e.target.value.slice(0, LIMITES.DESCRIPCION);
        setFormData(prev => ({ ...prev, descripcion: value }));
    };

    // ✅ useEffect simplificados
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
        setProveedores(initialProveedores || []);
    }, [initialProveedores]);

    // ✅ Resetear página cuando se filtra
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ✅ Funciones simplificadas
    const fetchProveedores = async () => {
        try {
            const response = await fetch("http://localhost:3000/proveedores/getAll", {
                method: "GET",
                headers: { Cookie: document.cookie },
                credentials: "include",
            });

            if (!response.ok) throw new Error("Error al obtener los proveedores");

            const data = await response.json();
            setProveedores(data);
        } catch (error) {
            console.error("Error al obtener los proveedores:", error);
            setErrorMessage("Error al cargar los proveedores");
            setShowErrorModal(true);
        }
    };

    const checkIfCodeExists = (codigo, id = null) => {
        return proveedores.some(proveedor => 
            proveedor.codigo.toUpperCase() === codigo.toUpperCase() && proveedor.id !== id
        );
    };

    const handleSaveNewProveedor = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setShowErrorModal(true);
            return;
        }

        if (checkIfCodeExists(formData.codigo)) {
            setErrorMessage("Este código ya pertenece a un proveedor. Por favor verifique los datos.");
            setShowErrorModal(true);
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/proveedores/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify({
                    ...formData,
                    codigo: formData.codigo.toUpperCase()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al agregar el proveedor");
            }

            setShowAddModal(false);
            setFormData({ codigo: "", nombre: "", descripcion: "" });
            fetchProveedores();
        } catch (error) {
            console.error("Error al agregar el proveedor:", error);
            setErrorMessage(error.message || "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleUpdateProveedor = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setShowErrorModal(true);
            return;
        }

        if (checkIfCodeExists(formData.codigo, formData.id)) {
            setErrorMessage("Este código ya pertenece a un proveedor. Por favor verifique los datos.");
            setShowErrorModal(true);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/proveedores/update/${formData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify({
                    ...formData,
                    codigo: formData.codigo.toUpperCase()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al actualizar el proveedor");
            }

            setShowEditModal(false);
            setFormData({ codigo: "", nombre: "", descripcion: "" });
            fetchProveedores();
        } catch (error) {
            console.error("Error al actualizar el proveedor:", error);
            setErrorMessage(error.message || "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleDeleteProveedor = async (proveedorId) => {
        try {
            const response = await fetch(`http://localhost:3000/proveedores/delete/${proveedorId}`, {
                method: "DELETE",
                headers: { Cookie: document.cookie },
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al eliminar el proveedor");
            }

            fetchProveedores();
        } catch (error) {
            console.error("Error al eliminar el proveedor:", error);
            setErrorMessage(error.message || "Error al eliminar el proveedor.");
            setShowErrorModal(true);
        }
    };

    const handleEditClick = (proveedor) => {
        setFormData(proveedor);
        setShowEditModal(true);
    };

    const handleDeleteClick = (proveedorId) => {
        setShowDeleteConfirmModal(true);
        // Guardar el ID temporalmente
        setTimeout(() => {
            handleDeleteProveedor(proveedorId);
            setShowDeleteConfirmModal(false);
        }, 0);
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const hasChanges = () => {
        return Object.values(formData).some(val => 
            typeof val === 'string' && val.trim() !== ''
        );
    };

    const handleSearch = () => {
        if (searchTerm.trim() !== "") {
            setShowSearchResultsModal(true);
        }
    };

    const handleViewProducts = () => router.push("/dashboard/productos");
    const handleManagePurchases = () => router.push("/dashboard/compras");
    const handleGenerateReport = () => alert("Funcionalidad de reporte para proveedores - Próximamente");

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <div className="flex flex-1 h-full overflow-hidden">
                {/* Sidebar fija con altura completa y scroll interno */}
                <div
                    className={`md:static fixed z-40 h-full transition-all duration-300 ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${!isMobile ? 'md:translate-x-0 md:w-64' : ''}`}
                >
                    <div className="h-full overflow-y-auto">
                        <Sidebar />
                    </div>
                </div>

                {/* Contenido principal con scroll */}
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
                                <FaBuilding className="text-2xl text-blue-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Proveedores</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaPlus className="mr-2" /> Agregar
                                </button>
                                <button
                                    onClick={handleViewProducts}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaBuilding className="mr-2" /> Productos
                                </button>
                                <button
                                    onClick={handleManagePurchases}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaShoppingCart className="mr-2" /> Compras
                                </button>
                                <button
                                    onClick={handleGenerateReport}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <FaFilePdf className="mr-2" /> Reporte
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, código, nombre o descripción"
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

                        {/* Tabla con scroll vertical */}
                        <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {proveedoresPagina && Array.isArray(proveedoresPagina) && proveedoresPagina.map((proveedor) => (
                                            <tr key={proveedor.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                                    {proveedor.codigo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{proveedor.nombre}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-center">
                                                    {proveedor.descripcion || "Sin descripción"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                    <div className="flex justify-center items-center space-x-2">
                                                        <button
                                                            onClick={() => handleEditClick(proveedor)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            aria-label="Editar"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(proveedor.id)}
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
                            {/* Paginación */}
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

                        {/* Vista móvil con scroll */}
                        <div className="md:hidden">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {proveedoresPagina && Array.isArray(proveedoresPagina) && proveedoresPagina.map((proveedor) => (
                                    <div key={proveedor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">{proveedor.nombre}</h3>
                                                <p className="text-sm text-gray-600">Código: {proveedor.codigo}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(proveedor)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(proveedor.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-sm text-gray-700">
                                                {proveedor.descripcion || "Sin descripción"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Paginación móvil */}
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
                    </div>

                    <Footer />
                </div>
            </div>

            {/* Modales (similar a productos) */}
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
                            {filteredProveedores && Array.isArray(filteredProveedores) && filteredProveedores.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredProveedores.map((proveedor) => (
                                        <div key={proveedor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">{proveedor.nombre}</h3>
                                                    <p className="text-sm text-gray-600">Código: {proveedor.codigo}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-700">
                                                    {proveedor.descripcion || "Sin descripción"}
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
                            <h3 className="text-lg font-medium text-gray-900">Agregar Proveedor</h3>
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
                            <form onSubmit={handleSaveNewProveedor}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codigo">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        id="codigo"
                                        name="codigo"
                                        value={formData.codigo}
                                        onChange={handleCodigoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.CODIGO}
                                        placeholder="Ej: PROV001"
                                    />
                                    {codigoError && <p className="text-red-500 text-sm mt-1">{codigoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.codigo.length}/{LIMITES.CODIGO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre del Proveedor *
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleNombreChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NOMBRE}
                                    />
                                    {nombreError && <p className="text-red-500 text-sm mt-1">{nombreError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.nombre.length}/{LIMITES.NOMBRE} caracteres</p>
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
                                        placeholder="Descripción opcional del proveedor..."
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
                            <h3 className="text-lg font-medium text-gray-900">Editar Proveedor</h3>
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
                            <form onSubmit={handleUpdateProveedor}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codigo">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        id="codigo"
                                        name="codigo"
                                        value={formData.codigo}
                                        onChange={handleCodigoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.CODIGO}
                                    />
                                    {codigoError && <p className="text-red-500 text-sm mt-1">{codigoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.codigo.length}/{LIMITES.CODIGO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre del Proveedor *
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleNombreChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NOMBRE}
                                    />
                                    {nombreError && <p className="text-red-500 text-sm mt-1">{nombreError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.nombre.length}/{LIMITES.NOMBRE} caracteres</p>
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
                                ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
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
                                        handleDeleteProveedor(proveedorToDelete);
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
                                            codigo: "",
                                            nombre: "",
                                            descripcion: ""
                                        });
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