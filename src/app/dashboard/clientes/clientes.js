"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import AddClienteModal from "./components/modals/AddClientModal";
import EditClientModal  from "./components/modals/EditClientModal";
import DeleteConfirmModal from "./components/modals/DeleteConfirmModal";
import CancelConfirmModal from "./components/modals/CancelConfirmModal";
import ErrorModal from "./components/modals/ErrorModal";
import Select from "react-select";
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaBars,
} from "react-icons/fa";

// Datos 
import { codactividad } from "./data/codactividad";
import { departamentos } from "./data/departamentos";
import { municipios } from "./data/municipios";
import { tiposDocumento } from "./data/tiposDocumento";
import { LIMITES } from "./data/limites";

export default function Clientes({ initialClientes = [], user, hasHaciendaToken, haciendaStatus }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [clientes, setClientes] = useState(initialClientes || []);
  const [filteredClientes, setFilteredClientes] = useState(
    initialClientes || []
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  

  const opcionesActividades = codactividad.map((act) => ({
    value: act.codigo,
    label: `${act.codigo} - ${act.nombre}`,
  }));

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setErrorMessage("El nombre es obligatorio.");
      return false;
    }
    if (formData.nombre.length > LIMITES.NOMBRE) {
      setErrorMessage(
        `El nombre no puede exceder los ${LIMITES.NOMBRE} caracteres.`
      );
      return false;
    }

    if (!formData.nombrecomercial.trim()) {
      setErrorMessage("El nombre comercial es obligatorio.");
      return false;
    }
    if (formData.nombrecomercial.length > LIMITES.NOMBRECOMERCIAL) {
      setErrorMessage(
        `El nombre comercial no puede exceder los ${LIMITES.NOMBRECOMERCIAL} caracteres.`
      );
      return false;
    }

    if (formData.dui && formData.dui.length > LIMITES.DUI) {
      setErrorMessage(`El DUI no puede exceder los ${LIMITES.DUI} caracteres.`);
      return false;
    }
    if (formData.dui && !/^[0-9-]+$/.test(formData.dui)) {
      setErrorMessage("El DUI solo puede contener números y guiones.");
      return false;
    }

    if (formData.pasaporte && formData.pasaporte.length > LIMITES.PASAPORTE) {
      setErrorMessage(
        `El pasaporte no puede exceder los ${LIMITES.PASAPORTE} caracteres.`
      );
      return false;
    }

    if (formData.nit && formData.nit.length > LIMITES.NIT) {
      setErrorMessage(`El NIT no puede exceder los ${LIMITES.NIT} caracteres.`);
      return false;
    }

    if (formData.nrc && formData.nrc.length > LIMITES.NRC) {
      setErrorMessage(`El NRC no puede exceder los ${LIMITES.NRC} caracteres.`);
      return false;
    }

    if (
      formData.carnetresidente &&
      formData.carnetresidente.length > LIMITES.CARNETRESIDENTE
    ) {
      setErrorMessage(
        `El Carnet de Residente no puede exceder los ${LIMITES.CARNETRESIDENTE} caracteres.`
      );
      return false;
    }

    if (!formData.correo.trim()) {
      setErrorMessage("El correo es obligatorio.");
      return false;
    }
    if (!validateEmail(formData.correo)) {
      setErrorMessage("El formato del correo no es válido.");
      return false;
    }
    if (formData.correo.length > LIMITES.CORREO) {
      setErrorMessage(
        `El correo no puede exceder los ${LIMITES.CORREO} caracteres.`
      );
      return false;
    }

    if (!formData.telefono.trim()) {
      setErrorMessage("El teléfono es obligatorio.");
      return false;
    }
    if (formData.telefono.length > LIMITES.TELEFONO) {
      setErrorMessage(
        `El teléfono no puede exceder los ${LIMITES.TELEFONO} caracteres.`
      );
      return false;
    }
    if (!/^[0-9]+$/.test(formData.telefono)) {
      setErrorMessage("El teléfono solo puede contener números.");
      return false;
    }

    if (!formData.departamento.trim()) {
      setErrorMessage("El departamento es obligatorio.");
      return false;
    }
    if (formData.departamento.length > LIMITES.DEPARTAMENTO) {
      setErrorMessage(
        `El departamento no puede exceder los ${LIMITES.DEPARTAMENTO} caracteres.`
      );
      return false;
    }

    if (!formData.municipio.trim()) {
      setErrorMessage("El municipio es obligatorio.");
      return false;
    }
    if (formData.municipio.length > LIMITES.MUNICIPIO) {
      setErrorMessage(
        `El municipio no puede exceder los ${LIMITES.MUNICIPIO} caracteres.`
      );
      return false;
    }

    if (!formData.complemento.trim()) {
      setErrorMessage("El complemento es obligatorio.");
      return false;
    }
    if (formData.complemento.length > LIMITES.COMPLEMENTO) {
      setErrorMessage(
        `El complemento no puede exceder los ${LIMITES.COMPLEMENTO} caracteres.`
      );
      return false;
    }

    if (!formData.codactividad.trim()) {
      setErrorMessage("El código de actividad es obligatorio.");
      return false;
    }
    if (formData.codactividad.length > LIMITES.CODACTIVIDAD) {
      setErrorMessage(
        `El código de actividad no puede exceder los ${LIMITES.CODACTIVIDAD} caracteres.`
      );
      return false;
    }

    if (!formData.descactividad.trim()) {
      setErrorMessage("La descripción de actividad es obligatoria.");
      return false;
    }
    if (formData.descactividad.length > LIMITES.DESCACTIVIDAD) {
      setErrorMessage(
        `La descripción de actividad no puede exceder los ${LIMITES.DESCACTIVIDAD} caracteres.`
      );
      return false;
    }

    return true;
  };

  const [formData, setFormData] = useState({
    nombre: "",
    nombrecomercial: "",
    dui: "",
    pasaporte: "",
    nit: "",
    nrc: "",
    carnetresidente: "",
    correo: "",
    telefono: "",
    departamento: "",
    municipio: "",
    complemento: "",
    codactividad: "",
    descactividad: "",
    personanatural: false,
    tipodocumento: "36", 
  });

  const resetFormData = () => {
    setFormData({
      nombre: "",
      nombrecomercial: "",
      dui: "",
      pasaporte: "",
      nit: "",
      nrc: "",
      carnetresidente: "",
      correo: "",
      telefono: "",
      departamento: "",
      municipio: "",
      complemento: "",
      codactividad: "",
      descactividad: "",
      personanatural: false,
      tipodocumento: "36", 
    });
  };

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    setClientes(initialClientes || []);
    setFilteredClientes(initialClientes || []);
  }, [initialClientes]);

  useEffect(() => {
    const results =
      clientes && Array.isArray(clientes)
        ? clientes.filter((cliente) => {
            const term = searchTerm.toLowerCase();

            const nombre = (cliente.nombre || "").toLowerCase();
            const correo = (cliente.correo || "").toLowerCase();
            const telefono = (cliente.telefono || "").toLowerCase();
            const documento = (
              (cliente.dui || "") +
              (cliente.pasaporte || "") +
              (cliente.nit || "") +
              (cliente.nrc || "") +
              (cliente.carnetresidente || "")
            ).toLowerCase();

            return (
              nombre.includes(term) ||
              correo.includes(term) ||
              telefono.includes(term) ||
              documento.includes(term)
            );
          })
        : [];

    setFilteredClientes(results);
  }, [searchTerm, clientes]);

  const handleSearch = () => {
    if (searchTerm.trim() !== "") {
      setShowSearchResultsModal(true);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await fetch("http://localhost:3000/clientes/getAllCli", {
        method: "GET",
        headers: {
          Cookie: document.cookie,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener los clientes");
      }

      const data = await response.json();
      console.log("data---", data);

      setClientes(data.data || []);
      setFilteredClientes(data.data || []);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
    }
  };

const handleSaveNewCliente = async (e) => {
    e.preventDefault();
    try {
      const datosEnviar = {
        ...formData,
        dui: formData.dui || null,
        pasaporte: formData.pasaporte || null,
        nit: formData.nit || null,
        nrc: formData.nrc || null,
        nombrecomercial: formData.nombrecomercial || "",
        codactividad: formData.codactividad || "",
        descactividad: formData.descactividad || "",
      };

      console.log("Datos enviados al backend:", datosEnviar);

      const response = await fetch("http://localhost:3000/clientes/addCli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify(datosEnviar),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del backend:", errorData);
        setErrorMessage(errorData.message || "Error al agregar el cliente");
        setShowErrorModal(true);
        return;
      }

      setShowAddModal(false);
      resetFormData();
      fetchClientes();
    } catch (error) {
      console.error("Error al agregar el cliente:", error);
      setErrorMessage(
        "Ocurrió un error inesperado. Por favor, inténtelo de nuevo."
      );
      setShowErrorModal(true);
    }
  };

const handleUpdateCliente = async (e) => {
    e.preventDefault();

    try {
      const datosEnviar = {
        ...formData,
        dui: formData.dui || null,
        pasaporte: formData.pasaporte || null,
        nit: formData.nit || null,
        nrc: formData.nrc || null,
        carnetresidente: formData.carnetresidente || null,
        codactividad: formData.codactividad || null,
        descactividad: formData.descactividad || null,
        nombrecomercial: formData.nombrecomercial || "",
      };
      
      console.log("Datos enviados al backend:", datosEnviar);

      const response = await fetch(
        `http://localhost:3000/clientes/updateCli/${clienteToEdit.idcliente}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: document.cookie,
          },
          credentials: "include",
          body: JSON.stringify(datosEnviar),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del backend:", errorData);
        setErrorMessage(errorData.message || "Error al actualizar el cliente");
        
        setShowErrorModal(true);
        return;
      }

      setShowEditModal(false);
      resetFormData();
      setClienteToEdit(null);
      fetchClientes();
    } catch (error) {
      console.error("Error al actualizar el cliente:", error);
      setErrorMessage(
        "Ocurrió un error inesperado. Por favor, inténtelo de nuevo."
      );
      setShowErrorModal(true);
    }
  };

  

  const handleToggleEstado = async (clienteId, nuevoEstado) => {
    try {
      const response = await fetch(
        `http://localhost:3000/clientes/toggle-estado/${clienteId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: document.cookie,
          },
          credentials: "include",
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (!response.ok) {
        setErrorMessage("Error al cambiar el estado del cliente.");
        setShowErrorModal(true);
        return;
      }

      fetchClientes();
    } catch (error) {
      console.error("Error al cambiar el estado del cliente:", error);
      setErrorMessage("Error al cambiar el estado del cliente.");
      setShowErrorModal(true);
    }
  };

  const handleDeleteCliente = async (clienteId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/clientes/deleteCli/${clienteId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: document.cookie,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        setErrorMessage("Error al eliminar el cliente.");
        setShowErrorModal(true);
        return;
      }

      fetchClientes();
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      setErrorMessage("Error al eliminar el cliente.");
      setShowErrorModal(true);
    }
  };

const handleEditClick = (cliente) => {
    const datosCliente = {
      ...cliente,
      nombre: cliente.nombre || "",
      nombrecomercial: cliente.nombrecomercial || "",
      dui: cliente.dui || "",
      pasaporte: cliente.pasaporte || "",
      nit: cliente.nit || "",
      nrc: cliente.nrc || "",
      carnetresidente: cliente.carnetresidente || "",
      correo: cliente.correo || "",
      telefono: cliente.telefono || "",
      departamento: cliente.departamento || "",
      municipio: cliente.municipio || "",
      complemento: cliente.complemento || "",
      codactividad: cliente.codactividad || "",
      descactividad: cliente.descactividad || "",
      personanatural: cliente.personanatural !== false,
      tipodocumento: cliente.tipodocumento || "13",
    };
    
    setClienteToEdit(cliente);
    setFormData(datosCliente);
    setShowEditModal(true);
  };

  const handleDeleteClick = (clienteId) => {
    setClienteToDelete(clienteId);
    setShowDeleteConfirmModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetFormData();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetFormData();
    setClienteToEdit(null);
  };

  const hasChanges = () => {
    return Object.values(formData).some((val) => {
      if (typeof val === "string") {
        return val.trim() !== "";
      } else if (typeof val === "number") {
        return val !== 0;
      } else if (typeof val === "boolean") {
        return true;
      }
      return false;
    });
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [currentPage, setCurrentPage] = useState(1);
  const clientesPorPagina = 5;
  const totalPaginas = Math.ceil(filteredClientes.length / clientesPorPagina);
  const clientesPagina = filteredClientes.slice(
    (currentPage - 1) * clientesPorPagina,
    currentPage * clientesPorPagina
  );

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
            className={`md:static fixed z-40 h-full transition-all duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
          >
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar 
              user={user}
              hasHaciendaToken={hasHaciendaToken}
              haciendaStatus={haciendaStatus}
              onToggleSidebar={toggleSidebar}
              sidebarOpen={sidebarOpen}
            />

            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                    Clientes
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center w-full sm:w-auto justify-center"
                >
                  <FaPlus className="mr-2" /> Agregar
                </button>
              </div>
              
              {/* Búsqueda */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por documento, nombre, correo o teléfono"
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
              
              <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-lg shadow border border-gray-200">
                {/* Tabla para Desktop */}
                <div className="hidden md:block">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo Persona
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo Documento
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número Documento
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teléfono
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientesPagina &&
                        Array.isArray(clientesPagina) &&
                        clientesPagina.map((cliente) => {
                          const tipoDoc = tiposDocumento.find(
                            (doc) => doc.codigo === cliente.tipodocumento
                          );
                          const nombreTipoDoc = tipoDoc ? tipoDoc.nombre : "Desconocido";

                          const numeroDocumento =
                            cliente.tipodocumento === "36" ? cliente.nit || "N/A" :
                            cliente.tipodocumento === "13" ? cliente.dui || "N/A" :
                            cliente.tipodocumento === "03" ? cliente.pasaporte || "N/A" :
                            cliente.tipodocumento === "02" ? cliente.carnetresidente || "N/A" :
                            cliente.nrc || "N/A";

                          return (
                            <tr
                              key={cliente.idcliente}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-4 text-sm text-gray-900 text-center">
                                <div className="flex flex-col">
                                  <span className="font-medium">{cliente.nombre}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  cliente.personanatural 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-purple-100 text-purple-800"
                                }`}>
                                  {cliente.personanatural ? "Natural" : "Jurídica"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 text-center">
                                {nombreTipoDoc}
                                <br />
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 text-center font-mono">
                                {numeroDocumento}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 text-center">
                                {cliente.telefono}
                              </td>
                              <td className="px-4 py-4 text-sm font-medium text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditClick(cliente)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                    aria-label="Editar"
                                    title="Editar cliente"
                                  >
                                    <FaEdit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(cliente.idcliente)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                                    aria-label="Eliminar"
                                    title="Eliminar cliente"
                                  >
                                    <FaTrash size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  
                  {/* Paginación */}
                  <div className="flex justify-center items-center py-4 space-x-2">
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

                {/* Listado para Móvil */}
                <div className="md:hidden overflow-auto">
                  <div className="p-4 space-y-4">
                    {filteredClientes &&
                      Array.isArray(filteredClientes) &&
                      filteredClientes.map((cliente) => {
                        // Obtener el nombre del tipo de documento
                        const tipoDoc = tiposDocumento.find(
                          (doc) => doc.codigo === cliente.tipodocumento
                        );
                        const nombreTipoDoc = tipoDoc ? tipoDoc.nombre : "Desconocido";
                        const numeroDocumento =
                          cliente.tipodocumento === "36" ? cliente.nit || "N/A" :
                          cliente.tipodocumento === "13" ? cliente.dui || "N/A" :
                          cliente.tipodocumento === "03" ? cliente.pasaporte || "N/A" :
                          cliente.tipodocumento === "02" ? cliente.carnetresidente || "N/A" :
                          cliente.nrc || "N/A";
                          
                        return (
                          <div
                            key={cliente.idcliente}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {cliente.nombre}
                                </h3>
                                {cliente.nombrecomercial && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {cliente.nombrecomercial}
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditClick(cliente)}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                                  aria-label="Editar"
                                  title="Editar cliente"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(cliente.idcliente)}
                                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                                  aria-label="Eliminar"
                                  title="Eliminar cliente"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Tipo Persona:</span>
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  cliente.personanatural 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-purple-100 text-purple-800"
                                }`}>
                                  {cliente.personanatural ? "Natural" : "Jurídica"}
                                </span>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-500">Teléfono:</span>
                                <span className="ml-2 text-gray-900">{cliente.telefono}</span>
                              </div>

                              <div className="col-span-2">
                                <span className="font-medium text-gray-500">Tipo Documento:</span>
                                <span className="ml-2 text-gray-900">
                                  {nombreTipoDoc} ({cliente.tipodocumento})
                                </span>
                              </div>

                              <div className="col-span-2">
                                <span className="font-medium text-gray-500">Número Documento:</span>
                                <span className="ml-2 text-gray-900 font-mono">
                                  {numeroDocumento}
                                </span>
                              </div>

                              <div className="col-span-2">
                                <span className="font-medium text-gray-500">Correo:</span>
                                <span className="ml-2 text-gray-900 break-all">
                                  {cliente.correo}
                                </span>
                              </div>

                              <div className="col-span-2">
                                <span className="font-medium text-gray-500">Ubicación:</span>
                                <span className="ml-2 text-gray-900">
                                  {cliente.departamento}, {cliente.municipio}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </div>

        {/* Modal de Agregar Cliente */}
        <AddClienteModal
          show={showAddModal}
          onClose={handleCloseAddModal}
          onSave={handleSaveNewCliente}
          formData={formData}
          setFormData={setFormData}
          hasChanges={hasChanges}
          codactividad={codactividad}
          departamentos={departamentos}
          municipios={municipios}
          tiposDocumento={tiposDocumento}
          LIMITES={LIMITES}
        />
        {/* Modal de Editar Cliente */}
        <EditClientModal
          show={showEditModal}
          onClose={handleCloseEditModal}
          onUpdate={handleUpdateCliente}
          formData={formData}
          setFormData={setFormData}
          hasChanges={hasChanges}
          codactividad={codactividad}
          departamentos={departamentos}
          municipios={municipios}
          tiposDocumento={tiposDocumento}
          LIMITES={LIMITES}
        />
        {/* Modal de Confirmación de Eliminación */}
        <DeleteConfirmModal
          show={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          onConfirm={() => {
            handleDeleteCliente(clienteToDelete);
            setShowDeleteConfirmModal(false);
          }}
        />

        {/* Modal de Confirmación de Cancelación */}
        <CancelConfirmModal
          show={showCancelConfirmModal}
            onClose={() => setShowCancelConfirmModal(false)}
            onConfirm={() => {
              setShowCancelConfirmModal(false);
              setShowAddModal(false);
              setShowEditModal(false);
              resetFormData();
            }}
          />
          <ErrorModal
            show={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            message={errorMessage}
          />
      </div>
    );
}
