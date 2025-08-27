"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaBars, FaPlus, FaTimes, FaEdit, FaTrash, FaFilePdf, FaSave, FaTimes as FaClose, FaBoxOpen } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { useRouter } from "next/navigation";

export default function Productos({ initialProductos = [], user }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [productos, setProductos] = useState(initialProductos || []);
    const [filteredProductos, setFilteredProductos] = useState(initialProductos || []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
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
        PRECIO: 10,
        STOCK: 10
    };

    const [formData, setFormData] = useState({
        nombre: "",
        codigo: "",
        unidad: "",
        precio: 0,
        preciooferta: 0,
        stock: 0
    });
    const [stockIncrement, setStockIncrement] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedUnidad, setSelectedUnidad] = useState("");
    const [unidades, setUnidades] = useState([
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
    ]);
    const [productToDelete, setProductToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const getNombreUnidad = (codigo) => {
        if (!codigo) return "Desconocido";
        const codigoNormalizado = codigo.toString().trim();
        const unidad = unidades.find(u => u.codigo === codigoNormalizado);
        return unidad ? unidad.nombre : "Desconocido";
    };

    const validateNumber = (value) => {
        return !isNaN(value) && value >= 0;
    };

    const validateStock = (value) => {
        return !isNaN(value) && Number(value) >= 0;
    };

    const validateNombre = (nombre) => {
        return nombre.length <= LIMITES.NOMBRE;
    };

    const validateCodigo = (codigo) => {
        return codigo.length <= LIMITES.CODIGO;
    };

    const validateForm = () => {
        if (!validateNombre(formData.nombre)) {
            setNombreError(`El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`);
            return false;
        } else {
            setNombreError("");
        }

        if (!validateCodigo(formData.codigo)) {
            setCodigoError(`El código no puede exceder los ${LIMITES.CODIGO} caracteres.`);
            return false;
        } else {
            setCodigoError("");
        }

        if (!validateNumber(formData.precio)) {
            setErrorMessage("El precio debe ser un número válido.");
            return false;
        }
        if (!validateNumber(formData.preciooferta)) {
            setErrorMessage("El precio de oferta debe ser un número válido.");
            return false;
        }
        if (!validateStock(formData.stock)) {
            setErrorMessage("El stock debe ser un número entero válido.");
            return false;
        }
        return true;
    };

    const handleNombreChange = (e) => {
        const { value } = e.target;
        const nombreValue = value.slice(0, LIMITES.NOMBRE);
        setFormData({ ...formData, nombre: nombreValue });
        
        if (!validateNombre(nombreValue)) {
            setNombreError(`El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`);
        } else {
            setNombreError("");
        }
    };

    const handleCodigoChange = (e) => {
        const { value } = e.target;
        const codigoValue = value.slice(0, LIMITES.CODIGO);
        setFormData({ ...formData, codigo: codigoValue });
        
        if (!validateCodigo(codigoValue)) {
            setCodigoError(`El código no puede exceder los ${LIMITES.CODIGO} caracteres.`);
        } else {
            setCodigoError("");
        }
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        if (validateNumber(value)) {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleStockChange = (e) => {
        const { name, value } = e.target;
        if (validateStock(value)) {
            setFormData({ ...formData, [name]: value });
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", checkMobile);
        };
    }, []);

    useEffect(() => {
        setProductos(initialProductos || []);
        setFilteredProductos(initialProductos || []);
    }, [initialProductos]);

    useEffect(() => {
        const results = productos && Array.isArray(productos) ? productos.filter(producto =>
            producto.id.toString().includes(searchTerm) ||
            producto.codigo.includes(searchTerm) ||
            producto.nombre.includes(searchTerm)
        ) : [];
        setFilteredProductos(results);
    }, [searchTerm, productos]);

    const handleSearch = () => {
        if (searchTerm.trim() !== "") {
            setShowSearchResultsModal(true);
        }
    };

    const checkIfCodeExists = (codigo, id = null) => {
        return productos && Array.isArray(productos) && productos.some(producto => producto.codigo === codigo && producto.id !== id);
    };

    const fetchProductos = async () => {
        try {
            const response = await fetch("http://localhost:3000/productos/getAll", {
                method: "GET",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Error al obtener los productos");
            }

            const data = await response.json();
            setProductos(data);
            setFilteredProductos(data);
        } catch (error) {
            console.error("Error al obtener los productos:", error);
        }
    };

    const handleGenerateReport = async () => {
        try {
            const userId = user?.id;

            if (!userId) {
                setErrorMessage("No se pudo obtener el ID del usuario.");
                setShowErrorModal(true);
                return;
            }

            const response = await fetch(`http://localhost:3000/reporte/productos/${userId}`, {
                method: "GET",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Error al generar el reporte");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al generar el reporte:", error);
            setErrorMessage("Ocurrió un error al generar el reporte. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleSaveNewProduct = async (e) => {
        e.preventDefault();

        if (formData.preciooferta > formData.precio) {
            setErrorMessage("El precio de oferta no puede ser mayor que el precio normal.");
            setShowErrorModal(true);
            return;
        }

        if (!validateForm()) {
            setShowErrorModal(true);
            return;
        }

        if (checkIfCodeExists(formData.codigo)) {
            setErrorMessage("Este código ya pertenece a un producto. Por favor verifique los datos.");
            setShowErrorModal(true);
            return;
        }

        const producto = {
            ...formData,
            unidad: selectedUnidad,
        };

        try {
            const response = await fetch("http://localhost:3000/productos/addPro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(producto),
            });

            if (!response.ok) {
                throw new Error("Error al agregar el producto");
            }

            setShowAddModal(false);
            setFormData({
                nombre: "",
                codigo: "",
                unidad: "",
                precio: 0,
                preciooferta: 0,
                stock: 0
            });
            setSelectedUnidad("");
            fetchProductos();
        } catch (error) {
            console.error("Error al agregar el producto:", error);
            setErrorMessage("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();

        if (formData.preciooferta > formData.precio) {
            setErrorMessage("El precio de oferta no puede ser mayor que el precio normal.");
            setShowErrorModal(true);
            return;
        }

        if (!validateForm()) {
            setShowErrorModal(true);
            return;
        }

        if (checkIfCodeExists(formData.codigo, formData.id)) {
            setErrorMessage("Este código ya pertenece a un producto. Por favor verifique los datos.");
            setShowErrorModal(true);
            return;
        }

        const producto = {
            ...formData,
            unidad: selectedUnidad,
        };

        try {
            const response = await fetch(`http://localhost:3000/productos/updatePro/${formData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(producto),
            });

            if (!response.ok) {
                throw new Error("Error al actualizar el producto");
            }

            setShowEditModal(false);
            setFormData({
                nombre: "",
                codigo: "",
                unidad: "",
                precio: 0,
                preciooferta: 0,
                stock: 0
            });
            setSelectedUnidad("");
            fetchProductos();
        } catch (error) {
            console.error("Error al actualizar el producto:", error);
            setErrorMessage("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleIncrementStock = async (e) => {
        e.preventDefault();
        
        if (!selectedProduct) return;
        
        if (!stockIncrement || isNaN(stockIncrement) || stockIncrement <= 0) {
            setErrorMessage("La cantidad debe ser un número positivo");
            setShowErrorModal(true);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/productos/incrementStock/${selectedProduct.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify({ cantidad: parseInt(stockIncrement) }),
            });

            if (!response.ok) {
                throw new Error("Error al incrementar el stock");
            }

            const updatedProductos = productos.map(p => 
                p.id === selectedProduct.id 
                    ? { ...p, stock: p.stock + parseInt(stockIncrement) } 
                    : p
            );
            
            setProductos(updatedProductos);
            setFilteredProductos(updatedProductos);
            setShowStockModal(false);
            setStockIncrement(0);
            setSelectedProduct(null);
        } catch (error) {
            console.error("Error al incrementar el stock:", error);
            setErrorMessage("Error al incrementar el stock");
            setShowErrorModal(true);
        }
    };

    const handleOpenStockModal = (producto) => {
        setSelectedProduct(producto);
        setStockIncrement(0);
        setShowStockModal(true);
    };

    const handleDeleteProduct = async (productoId) => {
        try {
            const response = await fetch(`http://localhost:3000/productos/deletePro/${productoId}`, {
                method: "DELETE",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                setErrorMessage("Error al eliminar el producto.");
                setShowErrorModal(true);
            }

            fetchProductos();
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
            setErrorMessage("Error al eliminar el producto.");
            setShowErrorModal(true);
        }
    };

    const handleEditClick = (producto) => {
        setFormData(producto);
        setSelectedUnidad(producto.unidad);
        setShowEditModal(true);
    };

    const handleDeleteClick = (productoId) => {
        setProductToDelete(productoId);
        setShowDeleteConfirmModal(true);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const hasChanges = () => {
        return Object.values(formData).some(val => {
            if (typeof val === 'string') {
                return val.trim() !== '';
            } else if (typeof val === 'number') {
                return val !== 0;
            }
            return false;
        });
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <div className="flex flex-1 h-full">
                <div
                    className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                        } ${!isMobile ? 'md:translate-x-0 md:w-64' : ''
                        }`}
                >
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col">
                    <header className="sticky top-0 bg-white backdrop-blur-md bg-opacity-90 shadow-sm z-20">
                        <div className="flex items-center justify-between h-16 px-4 md:px-6">
                            <div className="flex items-center">
                                <button
                                    className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                                    onClick={toggleSidebar}
                                    aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                                >
                                    {sidebarOpen ? (
                                        <FaTimes className="h-6 w-6" />
                                    ) : (
                                        <FaBars className="h-6 w-6" />
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center">
                                {user?.name && (
                                    <span className="mr-2 text-xs md:text-sm text-black font-medium truncate max-w-24 md:max-w-none">
                                        {user.name}
                                    </span>
                                )}
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white font-medium">
                                    {user?.name ? user.name.charAt(0) : "U"}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center">
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Productos</h2>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center w-full sm:w-auto justify-center"
                            >
                                <FaPlus className="mr-2" /> Agregar
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-sm flex items-center w-full sm:w-auto justify-center"
                            >
                                <FaFilePdf className="mr-2" /> Generar Reporte
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, código o nombre"
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

                        <div className="hidden md:block">
                            <div className="overflow-x-auto rounded-lg shadow">
                                <table className="min-w-full bg-white border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Oferta</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredProductos && Array.isArray(filteredProductos) && filteredProductos.slice(0, 10).map((producto) => (
                                            <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.nombre}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.codigo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {getNombreUnidad(producto.unidad)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.precio}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.preciooferta}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.stock}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditClick(producto)}
                                                        className="text-blue-600 hover:text-blue-800 mr-2"
                                                        aria-label="Editar"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenStockModal(producto)}
                                                        className="text-green-600 hover:text-green-800 mr-2"
                                                        aria-label="Añadir stock"
                                                    >
                                                        <FaBoxOpen />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(producto.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        aria-label="Eliminar"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="md:hidden">
                            <div className="space-y-4">
                                {filteredProductos && Array.isArray(filteredProductos) && filteredProductos.slice(0, 10).map((producto) => (
                                    <div key={producto.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-medium text-gray-900">{producto.nombre}</h3>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(producto)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenStockModal(producto)}
                                                    className="text-green-600 hover:text-green-800"
                                                    aria-label="Añadir stock"
                                                >
                                                    <FaBoxOpen />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(producto.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Código:</span>
                                                <span className="text-sm text-gray-900">{producto.codigo}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Unidad:</span>
                                                <span className="text-sm text-gray-900">{getNombreUnidad(producto.unidad)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Precio:</span>
                                                <span className="text-sm text-gray-900">{producto.precio}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Precio Oferta:</span>
                                                <span className="text-sm text-gray-900">{producto.preciooferta}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Stock:</span>
                                                <span className="text-sm text-gray-900">{producto.stock}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
            </div>

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
                            {filteredProductos && Array.isArray(filteredProductos) && filteredProductos.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredProductos.map((producto) => (
                                        <div key={producto.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-medium text-gray-900">{producto.nombre}</h3>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Código:</span>
                                                    <span className="text-sm text-gray-900">{producto.codigo}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Unidad:</span>
                                                    <span className="text-sm text-gray-900">{getNombreUnidad(producto.unidad)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Precio:</span>
                                                    <span className="text-sm text-gray-900">{producto.precio}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Precio Oferta:</span>
                                                    <span className="text-sm text-gray-900">{producto.preciooferta}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Stock:</span>
                                                    <span className="text-sm text-gray-900">{producto.stock}</span>
                                                </div>
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
                            <h3 className="text-lg font-medium text-gray-900">Agregar Producto</h3>
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
                            <form onSubmit={handleSaveNewProduct}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre del Producto
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codigo">
                                        Código
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unidad">
                                        Unidad
                                    </label>
                                    <select
                                        id="unidad"
                                        name="unidad"
                                        value={selectedUnidad}
                                        onChange={(e) => setSelectedUnidad(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione una unidad</option>
                                        {unidades.map((unidad) => (
                                            <option key={unidad.codigo} value={unidad.codigo}>
                                                {unidad.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="precio">
                                        Precio
                                    </label>
                                    <input
                                        type="number"
                                        id="precio"
                                        name="precio"
                                        value={formData.precio}
                                        onChange={handleNumberChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="preciooferta">
                                        Precio Oferta
                                    </label>
                                    <input
                                        type="number"
                                        id="preciooferta"
                                        name="preciooferta"
                                        value={formData.preciooferta}
                                        onChange={handleNumberChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="stock">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        id="stock"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleStockChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
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
                            <h3 className="text-lg font-medium text-gray-900">Editar Producto</h3>
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
                            <form onSubmit={handleUpdateProduct}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre del Producto
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codigo">
                                        Código
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unidad">
                                        Unidad
                                    </label>
                                    <select
                                        id="unidad"
                                        name="unidad"
                                        value={selectedUnidad}
                                        onChange={(e) => setSelectedUnidad(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione una unidad</option>
                                        {unidades.map((unidad) => (
                                            <option key={unidad.codigo} value={unidad.codigo}>
                                                {unidad.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="precio">
                                        Precio
                                    </label>
                                    <input
                                        type="number"
                                        id="precio"
                                        name="precio"
                                        value={formData.precio}
                                        onChange={handleNumberChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="preciooferta">
                                        Precio Oferta
                                    </label>
                                    <input
                                        type="number"
                                        id="preciooferta"
                                        name="preciooferta"
                                        value={formData.preciooferta}
                                        onChange={handleNumberChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="stock">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        id="stock"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleStockChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
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

            {showStockModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Añadir Stock</h3>
                            <button
                                onClick={() => setShowStockModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    Producto: <span className="font-medium">{selectedProduct.nombre}</span>
                                </p>
                                <p className="text-sm text-gray-700 mb-2">
                                    Código: <span className="font-medium">{selectedProduct.codigo}</span>
                                </p>
                                <p className="text-sm text-gray-700 mb-4">
                                    Stock actual: <span className="font-medium">{selectedProduct.stock}</span>
                                </p>
                            </div>

                            <form onSubmit={handleIncrementStock}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cantidad">
                                        Cantidad a añadir
                                    </label>
                                    <input
                                        type="number"
                                        id="cantidad"
                                        name="cantidad"
                                        value={stockIncrement}
                                        onChange={(e) => setStockIncrement(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        min="1"
                                        step="1"
                                    />
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-700">
                                        Nuevo stock: <span className="font-medium">{selectedProduct.stock + (parseInt(stockIncrement) || 0)}</span>
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowStockModal(false)}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                    >
                                        Añadir Stock
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
                                ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
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
                                        handleDeleteProduct(productToDelete);
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
                                            nombre: "",
                                            codigo: "",
                                            unidad: "",
                                            precio: 0,
                                            preciooferta: 0,
                                            stock: 0
                                        });
                                        setSelectedUnidad("");
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