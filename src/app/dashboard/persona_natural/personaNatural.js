"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaBars, FaUser, FaPlus, FaTimes, FaEdit, FaTrash, FaSave, FaTimes as FaClose } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { useRouter } from "next/navigation";

export default function PersonaNatural({ initialPersonas = [], user }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [personas, setPersonas] = useState(initialPersonas || []);
    const [filteredPersonas, setFilteredPersonas] = useState(initialPersonas || []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [telefonoError, setTelefonoError] = useState("");
    const [complementoError, setComplementoError] = useState("");
    const [documentoError, setDocumentoError] = useState("");
    const [nombreError, setNombreError] = useState("");
    const [correoError, setCorreoError] = useState("");
    const [formData, setFormData] = useState({
        nombre: "",
        tipodocumento: "",
        documento: "",
        correo: "",
        telefono: "",
        complemento: "",
        departamento: "",
        municipio: "",
    });
    const [personaToDelete, setPersonaToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Límites de caracteres para cada campo
    const LIMITES = {
        NOMBRE: 100,
        DOCUMENTO: 20,
        CORREO: 100,
        TELEFONO: 8,
        COMPLEMENTO: 100
    };

    const [selectedDepartamento, setSelectedDepartamento] = useState("");
    const [selectedMunicipio, setSelectedMunicipio] = useState("");
    const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

    const tiposDocumento = [
        { codigo: "36", nombre: "NIT" },
        { codigo: "13", nombre: "DUI" },
        { codigo: "37", nombre: "Otro" },
        { codigo: "03", nombre: "Pasaporte" },
        { codigo: "02", nombre: "Carnet de Residentes" },
    ];

    const departamentos = [
        { codigo: "00", nombre: "Otro (Para extranjeros)" },
        { codigo: "01", nombre: "Ahuachapán" },
        { codigo: "02", nombre: "Santa Ana" },
        { codigo: "03", nombre: "Sonsonate" },
        { codigo: "04", nombre: "Chalatenango" },
        { codigo: "05", nombre: "La Libertad" },
        { codigo: "06", nombre: "San Salvador" },
        { codigo: "07", nombre: "Cuscatlán" },
        { codigo: "08", nombre: "La Paz" },
        { codigo: "09", nombre: "Cabañas" },
        { codigo: "10", nombre: "San Vicente" },
        { codigo: "11", nombre: "Usulután" },
        { codigo: "12", nombre: "San Miguel" },
        { codigo: "13", nombre: "Morazán" },
        { codigo: "14", nombre: "La Unión" }
    ];

    const municipios = [
        { codigo: "00", nombre: "Otro (Para extranjeros)", departamento: "00" },
        { codigo: "13", nombre: "AHUACHAPAN NORTE", departamento: "01" },
        { codigo: "14", nombre: "AHUACHAPAN CENTRO", departamento: "01" },
        { codigo: "15", nombre: "AHUACHAPAN SUR", departamento: "01" },
        { codigo: "14", nombre: "SANTA ANA NORTE", departamento: "02" },
        { codigo: "15", nombre: "SANTA ANA CENTRO", departamento: "02" },
        { codigo: "16", nombre: "SANTA ANA ESTE", departamento: "02" },
        { codigo: "17", nombre: "SANTA ANA OESTE", departamento: "02" },
        { codigo: "17", nombre: "SONSONATE NORTE", departamento: "03" },
        { codigo: "18", nombre: "SONSONATE CENTRO", departamento: "03" },
        { codigo: "19", nombre: "SONSONATE ESTE", departamento: "03" },
        { codigo: "20", nombre: "SONSONATE OESTE", departamento: "03" },
        { codigo: "34", nombre: "CHALATENANGO NORTE", departamento: "04" },
        { codigo: "35", nombre: "CHALATENANGO CENTRO", departamento: "04" },
        { codigo: "36", nombre: "CHALATENANGO SUR", departamento: "04" },
        { codigo: "23", nombre: "LA LIBERTAD NORTE", departamento: "05" },
        { codigo: "24", nombre: "LA LIBERTAD CENTRO", departamento: "05" },
        { codigo: "25", nombre: "LA LIBERTAD OESTE", departamento: "05" },
        { codigo: "26", nombre: "LA LIBERTAD ESTE", departamento: "05" },
        { codigo: "27", nombre: "LA LIBERTAD COSTA", departamento: "05" },
        { codigo: "28", nombre: "LA LIBERTAD SUR", departamento: "05" },
        { codigo: "20", nombre: "SAN SALVADOR NORTE", departamento: "06" },
        { codigo: "21", nombre: "SAN SALVADOR OESTE", departamento: "06" },
        { codigo: "22", nombre: "SAN SALVADOR ESTE", departamento: "06" },
        { codigo: "23", nombre: "SAN SALVADOR CENTRO", departamento: "06" },
        { codigo: "24", nombre: "SAN SALVADOR SUR", departamento: "06" },
        { codigo: "17", nombre: "CUSCATLAN NORTE", departamento: "07" },
        { codigo: "18", nombre: "CUSCATLAN SUR", departamento: "07" },
        { codigo: "23", nombre: "LA PAZ OESTE", departamento: "08" },
        { codigo: "24", nombre: "LA PAZ CENTRO", departamento: "08" },
        { codigo: "25", nombre: "LA PAZ ESTE", departamento: "08" },
        { codigo: "10", nombre: "CABAÑAS OESTE", departamento: "09" },
        { codigo: "11", nombre: "CABAÑAS ESTE", departamento: "09" },
        { codigo: "14", nombre: "SAN VICENTE NORTE", departamento: "10" },
        { codigo: "15", nombre: "SAN VICENTE SUR", departamento: "10" },
        { codigo: "24", nombre: "USULUTAN NORTE", departamento: "11" },
        { codigo: "25", nombre: "USULUTAN ESTE", departamento: "11" },
        { codigo: "26", nombre: "USULUTAN OESTE", departamento: "11" },
        { codigo: "21", nombre: "SAN MIGUEL NORTE", departamento: "12" },
        { codigo: "22", nombre: "SAN MIGUEL CENTRO", departamento: "12" },
        { codigo: "23", nombre: "SAN MIGUEL OESTE", departamento: "12" },
        { codigo: "27", nombre: "MORAZAN NORTE", departamento: "13" },
        { codigo: "28", nombre: "MORAZAN SUR", departamento: "13" },
        { codigo: "19", nombre: "LA UNION NORTE", departamento: "14" },
        { codigo: "20", nombre: "LA UNION SUR", departamento: "14" }
    ];

    useEffect(() => {
        if (selectedDepartamento) {
            const filtrados = municipios.filter(m => m.departamento === selectedDepartamento);
            setMunicipiosFiltrados(filtrados);
        } else {
            setMunicipiosFiltrados([]);
        }
    }, [selectedDepartamento]);

    const getNombreDepartamento = (codigo) => {
        const departamento = departamentos.find(depto => depto.codigo === codigo);
        return departamento ? departamento.nombre : "Desconocido";
    };

    const getNombreMunicipio = (codigoMunicipio, codigoDepartamento) => {
        const municipio = municipios.find(
            muni => muni.codigo === codigoMunicipio && muni.departamento === codigoDepartamento
        );
        return municipio ? municipio.nombre : "Desconocido";
    };

    const getNombreTipoDocumento = (codigo) => {
        const tipoDocumento = tiposDocumento.find(tipo => tipo.codigo === codigo);
        return tipoDocumento ? tipoDocumento.nombre : "Desconocido";
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
        setPersonas(initialPersonas || []);
        setFilteredPersonas(initialPersonas || []);
    }, [initialPersonas]);

    useEffect(() => {
        const results = personas && Array.isArray(personas) ? personas.filter(persona =>
            persona.id.toString().includes(searchTerm) ||
            persona.documento.includes(searchTerm) ||
            persona.nombre.includes(searchTerm)
        ) : [];
        setFilteredPersonas(results);
    }, [searchTerm, personas]);

    const handleSearch = () => {
        if (searchTerm.trim() !== "") {
            setShowSearchResultsModal(true);
        }
    };

    const fetchPersonasNaturales = async () => {
        try {
            const response = await fetch("http://localhost:3000/personasNaturales/getAll", {
                method: "GET",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Error al obtener las personas naturales");
            }

            const data = await response.json();
            setPersonas(data);
            setFilteredPersonas(data);
        } catch (error) {
            console.error("Error al obtener las personas naturales:", error);
        }
    };

    const validateDocumento = (documento, tipoDocumento) => {
        // Validar longitud máxima
        if (documento.length > LIMITES.DOCUMENTO) {
            return false;
        }

        // Validaciones específicas por tipo
        switch(tipoDocumento) {
            case "36": // NIT
                return /^\d{14}$/.test(documento);
            case "13": // DUI
                return /^\d{9}$/.test(documento);
            case "03": // Pasaporte
                return /^[A-Za-z0-9]{6,20}$/.test(documento);
            case "02": // Carnet de Residentes
                return /^(RT|RP)\d{7}$/i.test(documento);
            case "37": // Otro
                return documento.length > 0;
            default:
                return false;
        }
    };

    const validateTelefono = (telefono) => {
        if (telefono.length > LIMITES.TELEFONO) {
            return false;
        }
        const telefonoRegex = /^\d{8}$/;
        return telefonoRegex.test(telefono);
    };

    const validateComplemento = (complemento) => {
        return complemento.length <= LIMITES.COMPLEMENTO;
    };

    const validateNombre = (nombre) => {
        return nombre.length <= LIMITES.NOMBRE;
    };

    const validateCorreo = (correo) => {
        return correo.length <= LIMITES.CORREO;
    };

    const handleSaveNewPersona = async (e) => {
        e.preventDefault();

        // Validar nombre
        if (!validateNombre(formData.nombre)) {
            setErrorMessage(`El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        // Validar documento
        if (!validateDocumento(formData.documento, formData.tipodocumento)) {
            let errorMsg = "";
            if (formData.documento.length > LIMITES.DOCUMENTO) {
                errorMsg = `El documento no puede exceder los ${LIMITES.DOCUMENTO} caracteres.`;
            } else {
                errorMsg = "Formato de documento inválido. ";
                switch(formData.tipodocumento) {
                    case "36":
                        errorMsg += "NIT debe tener 14 dígitos exactos.";
                        break;
                    case "13":
                        errorMsg += "DUI debe tener 9 dígitos exactos.";
                        break;
                    case "03":
                        errorMsg += "Pasaporte debe tener entre 6 y 20 caracteres alfanuméricos.";
                        break;
                    case "02":
                        errorMsg += "Carnet de Residencia debe comenzar con RT o RP seguido de 7 dígitos.";
                        break;
                    default:
                        errorMsg += "Documento no válido para el tipo seleccionado.";
                }
            }
            setErrorMessage(errorMsg);
            setShowErrorModal(true);
            return;
        }

        // Validar correo
        if (!validateCorreo(formData.correo)) {
            setErrorMessage(`El correo no puede exceder los ${LIMITES.CORREO} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        // Validar teléfono
        if (!validateTelefono(formData.telefono)) {
            setErrorMessage("Formato de teléfono inválido. Use 8 dígitos exactos.");
            setShowErrorModal(true);
            return;
        }

        // Validar complemento
        if (!validateComplemento(formData.complemento)) {
            setErrorMessage(`El complemento no puede exceder los ${LIMITES.COMPLEMENTO} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        const dataToSend = {
            ...formData,
            departamento: selectedDepartamento,
            municipio: selectedMunicipio,
        };

        try {
            const response = await fetch("http://localhost:3000/personasNaturales/addPerNa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes("documento ya está registrado")) {
                    setErrorMessage("El documento ya está registrado.");
                    setShowErrorModal(true);
                } else {
                    throw new Error("Error al agregar la persona");
                }
            } else {
                setShowAddModal(false);
                setFormData({
                    nombre: "",
                    tipodocumento: "",
                    documento: "",
                    correo: "",
                    telefono: "",
                    complemento: "",
                    departamento: "",
                    municipio: ""
                });
                setSelectedDepartamento("");
                setSelectedMunicipio("");
                fetchPersonasNaturales();
            }
        } catch (error) {
            console.error("Error al agregar la persona:", error);
            setErrorMessage("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleUpdatePersona = async (e) => {
        e.preventDefault();

        // Validar nombre
        if (!validateNombre(formData.nombre)) {
            setErrorMessage(`El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        // Validar documento
        if (!validateDocumento(formData.documento, formData.tipodocumento)) {
            let errorMsg = "";
            if (formData.documento.length > LIMITES.DOCUMENTO) {
                errorMsg = `El documento no puede exceder los ${LIMITES.DOCUMENTO} caracteres.`;
            } else {
                errorMsg = "Formato de documento inválido. ";
                switch(formData.tipodocumento) {
                    case "36":
                        errorMsg += "NIT debe tener 14 dígitos exactos.";
                        break;
                    case "13":
                        errorMsg += "DUI debe tener 9 dígitos exactos.";
                        break;
                    case "03":
                        errorMsg += "Pasaporte debe tener entre 6 y 20 caracteres alfanuméricos.";
                        break;
                    case "02":
                        errorMsg += "Carnet de Residencia debe comenzar con RT o RP seguido de 7 dígitos.";
                        break;
                    default:
                        errorMsg += "Documento no válido para el tipo seleccionado.";
                }
            }
            setErrorMessage(errorMsg);
            setShowErrorModal(true);
            return;
        }

        // Validar correo
        if (!validateCorreo(formData.correo)) {
            setErrorMessage(`El correo no puede exceder los ${LIMITES.CORREO} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        // Validar teléfono
        if (!validateTelefono(formData.telefono)) {
            setErrorMessage("Formato de teléfono inválido. Use 8 dígitos exactos.");
            setShowErrorModal(true);
            return;
        }

        // Validar complemento
        if (!validateComplemento(formData.complemento)) {
            setErrorMessage(`El complemento no puede exceder los ${LIMITES.COMPLEMENTO} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        const dataToSend = {
            ...formData,
            departamento: selectedDepartamento,
            municipio: selectedMunicipio,
        };

        try {
            const response = await fetch(`http://localhost:3000/personasNaturales/updatePerNa/${formData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes("documento ya pertenece a otra persona")) {
                    setErrorMessage("El documento ya pertenece a otra persona.");
                    setShowErrorModal(true);
                } else {
                    throw new Error("Error al actualizar la persona");
                }
            } else {
                setShowEditModal(false);
                setFormData({
                    nombre: "",
                    tipodocumento: "",
                    documento: "",
                    correo: "",
                    telefono: "",
                    complemento: "",
                    departamento: "",
                    municipio: ""
                });
                setSelectedDepartamento("");
                setSelectedMunicipio("");
                fetchPersonasNaturales();
            }
        } catch (error) {
            console.error("Error al actualizar la persona:", error);
            setErrorMessage("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleDeletePersona = async (personaId) => {
        try {
            const response = await fetch(`http://localhost:3000/personasNaturales/deletePerNa/${personaId}`, {
                method: "DELETE",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                setErrorMessage("Error al eliminar la persona natural.");
                setShowErrorModal(true);
            }

            fetchPersonasNaturales();
        } catch (error) {
            console.error("Error al eliminar la persona:", error);
            setErrorMessage("Error al eliminar la persona natural.");
            setShowErrorModal(true);
        }
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

    const handleDocumentoChange = (e) => {
        const { value } = e.target;
        const documentoValue = value.slice(0, LIMITES.DOCUMENTO);
        setFormData({ ...formData, documento: documentoValue });

        if (documentoValue.length > LIMITES.DOCUMENTO) {
            setDocumentoError(`El documento no puede exceder los ${LIMITES.DOCUMENTO} caracteres.`);
            return;
        }

        if (formData.tipodocumento && !validateDocumento(documentoValue, formData.tipodocumento)) {
            let errorMsg = "";
            switch(formData.tipodocumento) {
                case "36":
                    errorMsg = "NIT debe tener 14 dígitos exactos.";
                    break;
                case "13":
                    errorMsg = "DUI debe tener 9 dígitos exactos.";
                    break;
                case "03":
                    errorMsg = "Pasaporte debe tener entre 6 y 20 caracteres alfanuméricos.";
                    break;
                case "02":
                    errorMsg = "Carnet de Residencia debe comenzar con RT o RP seguido de 7 dígitos.";
                    break;
                default:
                    errorMsg = "Documento no válido para el tipo seleccionado.";
            }
            setDocumentoError(errorMsg);
        } else {
            setDocumentoError("");
        }
    };

    const handleCorreoChange = (e) => {
        const { value } = e.target;
        const correoValue = value.slice(0, LIMITES.CORREO);
        setFormData({ ...formData, correo: correoValue });
        
        if (!validateCorreo(correoValue)) {
            setCorreoError(`El correo no puede exceder los ${LIMITES.CORREO} caracteres.`);
        } else {
            setCorreoError("");
        }
    };

    const handleTelefonoChange = (e) => {
        const { value } = e.target;
        const telefonoValue = value.slice(0, LIMITES.TELEFONO);
        setFormData({ ...formData, telefono: telefonoValue });

        if (telefonoValue.length > LIMITES.TELEFONO) {
            setTelefonoError("El teléfono no puede exceder los 8 dígitos.");
            return;
        }

        if (!validateTelefono(telefonoValue)) {
            setTelefonoError("Formato de teléfono inválido. Use 8 dígitos exactos.");
        } else {
            setTelefonoError("");
        }
    };

    const handleComplementoChange = (e) => {
        const { value } = e.target;
        const complementoValue = value.slice(0, LIMITES.COMPLEMENTO);
        setFormData({ ...formData, complemento: complementoValue });
        
        if (!validateComplemento(complementoValue)) {
            setComplementoError(`El complemento no puede exceder los ${LIMITES.COMPLEMENTO} caracteres.`);
        } else {
            setComplementoError("");
        }
    };

    const handleEditClick = (persona) => {
        setFormData(persona);
        setSelectedDepartamento(persona.departamento);
        setSelectedMunicipio(persona.municipio);
        setShowEditModal(true);
    };

    const handleDeleteClick = (personaId) => {
        setPersonaToDelete(personaId);
        setShowDeleteConfirmModal(true);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <div className="flex flex-1 h-full overflow-hidden">
                <div
                    className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                        } ${!isMobile ? 'md:translate-x-0 md:w-64' : ''
                        }`}
                >
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
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

                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center">
                                <FaUser className="text-blue-600 mr-3 text-xl" />
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Personas Naturales</h2>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center w-full sm:w-auto justify-center"
                            >
                                <FaPlus className="mr-2" /> Agregar
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, Documento o Nombre"
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
                            <div className="overflow-x-auto rounded-lg shadow bg-white">
                                <div className="min-w-[1000px]">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Documento</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complemento</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipio</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredPersonas && Array.isArray(filteredPersonas) && filteredPersonas.slice(0, 10).map((persona) => (
                                                <tr key={persona.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{persona.nombre}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getNombreTipoDocumento(persona.tipodocumento)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{persona.documento}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{persona.correo}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{persona.telefono}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{persona.complemento}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getNombreDepartamento(persona.departamento)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getNombreMunicipio(persona.municipio, persona.departamento)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEditClick(persona)}
                                                            className="text-blue-600 hover:text-blue-800 mr-2"
                                                            aria-label="Editar"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(persona.id)}
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
                        </div>

                        <div className="md:hidden">
                            <div className="space-y-4">
                                {filteredPersonas && Array.isArray(filteredPersonas) && filteredPersonas.slice(0, 10).map((persona) => (
                                    <div key={persona.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-medium text-gray-900">{persona.nombre}</h3>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(persona)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(persona.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Tipo Documento:</span>
                                                <span className="text-sm text-gray-900">
                                                    {getNombreTipoDocumento(persona.tipodocumento)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Documento:</span>
                                                <span className="text-sm text-gray-900">{persona.documento}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Correo:</span>
                                                <span className="text-sm text-gray-900">{persona.correo}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                                                <span className="text-sm text-gray-900">{persona.telefono}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Complemento:</span>
                                                <span className="text-sm text-gray-900">{persona.complemento}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Departamento:</span>
                                                <span className="text-sm text-gray-900">
                                                    {getNombreDepartamento(persona.departamento)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Municipio:</span>
                                                <span className="text-sm text-gray-900">
                                                    {getNombreMunicipio(persona.municipio, persona.departamento)}
                                                </span>
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

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Agregar Persona Natural</h3>
                            <button
                                onClick={() => {
                                    if (Object.values(formData).some(val => val.trim() !== '')) {
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
                            <form onSubmit={handleSaveNewPersona}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipodocumento">
                                        Tipo de Documento
                                    </label>
                                    <select
                                        id="tipodocumento"
                                        name="tipodocumento"
                                        value={formData.tipodocumento}
                                        onChange={(e) => setFormData({ ...formData, tipodocumento: e.target.value })}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un tipo de documento</option>
                                        {tiposDocumento.map(tipo => (
                                            <option key={tipo.codigo} value={tipo.codigo}>
                                                {tipo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="documento">
                                        Documento
                                    </label>
                                    <input
                                        type="text"
                                        id="documento"
                                        name="documento"
                                        value={formData.documento}
                                        onChange={handleDocumentoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.DOCUMENTO}
                                    />
                                    {documentoError && <p className="text-red-500 text-sm mt-1">{documentoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.documento.length}/{LIMITES.DOCUMENTO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="correo"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleCorreoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.CORREO}
                                    />
                                    {correoError && <p className="text-red-500 text-sm mt-1">{correoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.correo.length}/{LIMITES.CORREO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleTelefonoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.TELEFONO}
                                    />
                                    {telefonoError && <p className="text-red-500 text-sm mt-1">{telefonoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.telefono.length}/{LIMITES.TELEFONO} dígitos</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="departamento">
                                        Departamento
                                    </label>
                                    <select
                                        id="departamento"
                                        name="departamento"
                                        value={selectedDepartamento}
                                        onChange={(e) => setSelectedDepartamento(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un departamento</option>
                                        {departamentos.map(depto => (
                                            <option key={depto.codigo} value={depto.codigo}>
                                                {depto.codigo} - {depto.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="municipio">
                                        Municipio
                                    </label>
                                    <select
                                        id="municipio"
                                        name="municipio"
                                        value={selectedMunicipio}
                                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un municipio</option>
                                        {municipiosFiltrados.map(muni => (
                                            <option key={muni.codigo} value={muni.codigo}>
                                                {muni.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="complemento">
                                        Complemento
                                    </label>
                                    <input
                                        type="text"
                                        id="complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleComplementoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        maxLength={LIMITES.COMPLEMENTO}
                                    />
                                    {complementoError && <p className="text-red-500 text-sm mt-1">{complementoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.complemento.length}/{LIMITES.COMPLEMENTO} caracteres</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (Object.values(formData).some(val => val.trim() !== '')) {
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
                            <h3 className="text-lg font-medium text-gray-900">Editar Persona Natural</h3>
                            <button
                                onClick={() => {
                                    if (Object.values(formData).some(val => val.trim() !== '')) {
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
                            <form onSubmit={handleUpdatePersona}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tipodocumento">
                                        Tipo de Documento
                                    </label>
                                    <select
                                        id="tipodocumento"
                                        name="tipodocumento"
                                        value={formData.tipodocumento}
                                        onChange={(e) => setFormData({ ...formData, tipodocumento: e.target.value })}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un tipo de documento</option>
                                        {tiposDocumento.map(tipo => (
                                            <option key={tipo.codigo} value={tipo.codigo}>
                                                {tipo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="documento">
                                        Documento
                                    </label>
                                    <input
                                        type="text"
                                        id="documento"
                                        name="documento"
                                        value={formData.documento}
                                        onChange={handleDocumentoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.DOCUMENTO}
                                    />
                                    {documentoError && <p className="text-red-500 text-sm mt-1">{documentoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.documento.length}/{LIMITES.DOCUMENTO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="correo"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleCorreoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.CORREO}
                                    />
                                    {correoError && <p className="text-red-500 text-sm mt-1">{correoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.correo.length}/{LIMITES.CORREO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleTelefonoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.TELEFONO}
                                    />
                                    {telefonoError && <p className="text-red-500 text-sm mt-1">{telefonoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.telefono.length}/{LIMITES.TELEFONO} dígitos</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="departamento">
                                        Departamento
                                    </label>
                                    <select
                                        id="departamento"
                                        name="departamento"
                                        value={selectedDepartamento}
                                        onChange={(e) => setSelectedDepartamento(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un departamento</option>
                                        {departamentos.map(depto => (
                                            <option key={depto.codigo} value={depto.codigo}>
                                                {depto.codigo} - {depto.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="municipio">
                                        Municipio
                                    </label>
                                    <select
                                        id="municipio"
                                        name="municipio"
                                        value={selectedMunicipio}
                                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un municipio</option>
                                        {municipiosFiltrados.map(muni => (
                                            <option key={muni.codigo} value={muni.codigo}>
                                                {muni.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="complemento">
                                        Complemento
                                    </label>
                                    <input
                                        type="text"
                                        id="complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleComplementoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        maxLength={LIMITES.COMPLEMENTO}
                                    />
                                    {complementoError && <p className="text-red-500 text-sm mt-1">{complementoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.complemento.length}/{LIMITES.COMPLEMENTO} caracteres</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (Object.values(formData).some(val => val.trim() !== '')) {
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
                                ¿Estás seguro de que deseas eliminar esta persona? Esta acción no se puede deshacer.
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
                                        handleDeletePersona(personaToDelete);
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
                                            tipodocumento: "",
                                            documento: "",
                                            correo: "",
                                            telefono: "",
                                            complemento: "",
                                            departamento: "",
                                            municipio: ""
                                        });
                                        setSelectedDepartamento("");
                                        setSelectedMunicipio("");
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