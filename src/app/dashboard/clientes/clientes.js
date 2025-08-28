"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
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

export default function Clientes({ initialClientes = [], user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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

  const LIMITES = {
    NOMBRE: 255,
    NUMERODOCUMENTO: 20,
    CORREO: 255,
    TELEFONO: 255,
  };

  // Tipos de documento según el modelo
  const tiposDocumento = [
    { codigo: "01", nombre: "DUI" },
    { codigo: "02", nombre: "NIT" },
    { codigo: "03", nombre: "Pasaporte" },
    { codigo: "04", nombre: "Carnet de Residente" },
    { codigo: "99", nombre: "Otro" },
  ];

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
    personanatural: false, // checkbox
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
    });
  };

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    if (!formData.tipodocumento) {
      setErrorMessage("El tipo de documento es obligatorio.");
      return false;
    }
    if (!formData.numerodocumento.trim()) {
      setErrorMessage("El número de documento es obligatorio.");
      return false;
    }
    if (formData.numerodocumento.length > LIMITES.NUMERODOCUMENTO) {
      setErrorMessage(
        `El número de documento no puede exceder los ${LIMITES.NUMERODOCUMENTO} caracteres.`
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
    return true;
  };

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
        ? clientes.filter(
            (cliente) =>
              cliente.idcliente.toString().includes(searchTerm) ||
              cliente.nombre.toLowerCase().includes(searchTerm) ||
              cliente.numerodocumento.toLowerCase().includes(searchTerm)
          )
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
      setClientes(data.clientes || []);
      setFilteredClientes(data.clientes || []);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
    }
  };

  const handleSaveNewCliente = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/clientes/addCli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
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

    if (!validateForm()) {
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/clientes/updateCli/${clienteToEdit.idcliente}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: document.cookie,
          },
          credentials: "include",
          body: JSON.stringify(tempFormData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Error al actualizar el cliente");
        setShowErrorModal(true);
        return;
      }

      setShowEditModal(false);
      setFormData({
        nombre: "",
        tipodocumento: "",
        numerodocumento: "",
        correo: "",
        telefono: "",
        estado: true,
      });
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
    setFormData({
      ...cliente,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (clienteId) => {
    setClienteToDelete(clienteId);
    setShowDeleteConfirmModal(true);
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
          className={`md:static fixed z-40 h-full transition-all duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
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
            {/* Búsqueda  EL ERROR ESTA AQUI */}
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
            {/* Tabla para Desktop */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre Comercial
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo de Persona
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actividad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClientes &&
                      Array.isArray(filteredClientes) &&
                      filteredClientes.slice(0, 10).map((cliente) => (
                        <tr
                          key={cliente.idcliente}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.nombrecomercial}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.personanatural ? "Natural" : "Jurídica"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.tipodocumento}:{" "}
                            {cliente.dui ||
                              cliente.pasaporte ||
                              cliente.nit ||
                              cliente.nrc ||
                              cliente.carnetresidente}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.correo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.telefono}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.codactividad} - {cliente.descactividad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cliente.departamento}, {cliente.municipio}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                cliente.estado
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {cliente.estado ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditClick(cliente)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              aria-label="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleEstado(
                                  cliente.idcliente,
                                  !cliente.estado
                                )
                              }
                              className={`mr-2 ${
                                cliente.estado
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-green-600 hover:text-green-800"
                              }`}
                              aria-label={
                                cliente.estado ? "Desactivar" : "Activar"
                              }
                            >
                              {cliente.estado ? (
                                <FaToggleOff />
                              ) : (
                                <FaToggleOn />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClick(cliente.idcliente)
                              }
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

            {/* Listado para Móvil */}
            <div className="md:hidden">
              <div className="space-y-4">
                {filteredClientes &&
                  Array.isArray(filteredClientes) &&
                  filteredClientes.slice(0, 10).map((cliente) => (
                    <div
                      key={cliente.idcliente}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {cliente.nombre}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {cliente.nombrecomercial}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(cliente)}
                            className="text-blue-600 hover:text-blue-800"
                            aria-label="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleEstado(
                                cliente.idcliente,
                                !cliente.estado
                              )
                            }
                            className={
                              cliente.estado
                                ? "text-red-600 hover:text-red-800"
                                : "text-green-600 hover:text-green-800"
                            }
                            aria-label={
                              cliente.estado ? "Desactivar" : "Activar"
                            }
                          >
                            {cliente.estado ? <FaToggleOff /> : <FaToggleOn />}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cliente.idcliente)}
                            className="text-red-600 hover:text-red-800"
                            aria-label="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-900">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Tipo de Persona:
                          </span>
                          <span>
                            {cliente.personanatural ? "Natural" : "Jurídica"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Documento:
                          </span>
                          <span>
                            {cliente.tipodocumento}:{" "}
                            {cliente.dui ||
                              cliente.pasaporte ||
                              cliente.nit ||
                              cliente.nrc ||
                              cliente.carnetresidente}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Correo:
                          </span>
                          <span>{cliente.correo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Teléfono:
                          </span>
                          <span>{cliente.telefono}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Actividad:
                          </span>
                          <span>
                            {cliente.codactividad} - {cliente.descactividad}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Ubicación:
                          </span>
                          <span>
                            {cliente.departamento}, {cliente.municipio}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">
                            Estado:
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              cliente.estado
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {cliente.estado ? "Activo" : "Inactivo"}
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

      {/* Modal de Agregar Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Agregar Cliente
              </h3>
              <button
                onClick={() => {
                  if (hasChanges()) {
                    setShowCancelConfirmModal(true);
                  } else {
                    setShowAddModal(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveNewCliente}
              className="px-6 py-4 space-y-4"
            >
              {/* Nombre y Nombre Comercial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={formData.nombrecomercial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nombrecomercial: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Documentos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DUI
                  </label>
                  <input
                    type="text"
                    value={formData.dui}
                    onChange={(e) =>
                      setFormData({ ...formData, dui: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pasaporte
                  </label>
                  <input
                    type="text"
                    value={formData.pasaporte}
                    onChange={(e) =>
                      setFormData({ ...formData, pasaporte: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT
                  </label>
                  <input
                    type="text"
                    value={formData.nit}
                    onChange={(e) =>
                      setFormData({ ...formData, nit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NRC
                  </label>
                  <input
                    type="text"
                    value={formData.nrc}
                    onChange={(e) =>
                      setFormData({ ...formData, nrc: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carnet Residente
                  </label>
                  <input
                    type="text"
                    value={formData.carnetresidente}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        carnetresidente: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Correo y Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo
                </label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) =>
                    setFormData({ ...formData, correo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Dirección */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) =>
                      setFormData({ ...formData, departamento: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) =>
                      setFormData({ ...formData, municipio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) =>
                    setFormData({ ...formData, complemento: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Actividad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Actividad
                  </label>
                  <input
                    type="text"
                    value={formData.codactividad}
                    onChange={(e) =>
                      setFormData({ ...formData, codactividad: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de Actividad
                  </label>
                  <input
                    type="text"
                    value={formData.descactividad}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descactividad: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Persona Natural */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="personanatural"
                  checked={formData.personanatural}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personanatural: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="personanatural"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Persona Natural
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChanges()) {
                      setShowCancelConfirmModal(true);
                    } else {
                      setShowAddModal(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Cliente */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Cliente
              </h3>
              <button
                onClick={() => {
                  if (hasChanges()) {
                    setShowCancelConfirmModal(true);
                  } else {
                    setShowEditModal(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateCliente}
              className="px-6 py-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  maxLength={LIMITES.NOMBRE}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.nombre.length}/{LIMITES.NOMBRE} caracteres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.tipodocumento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipodocumento: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {tiposDocumento.map((tipo) => (
                      <option key={tipo.codigo} value={tipo.codigo}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={formData.numerodocumento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numerodocumento: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={LIMITES.NUMERODOCUMENTO}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.numerodocumento.length}/{LIMITES.NUMERODOCUMENTO}{" "}
                    caracteres
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo
                </label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) =>
                    setFormData({ ...formData, correo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  maxLength={LIMITES.CORREO}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.correo.length}/{LIMITES.CORREO} caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  maxLength={LIMITES.TELEFONO}
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="estadoEdit"
                  checked={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="estadoEdit"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Estado activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (hasChanges()) {
                      setShowCancelConfirmModal(true);
                    } else {
                      setShowEditModal(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Eliminación
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar este cliente? Esta acción
                no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDeleteCliente(clienteToDelete);
                  setShowDeleteConfirmModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Cancelación
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Tienes cambios sin guardar. ¿Estás seguro de que deseas
                cancelar?
              </p>
            </div>
            <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowCancelConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Continuar editando
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setFormData({
                    nombre: "",
                    tipodocumento: "",
                    numerodocumento: "",
                    correo: "",
                    telefono: "",
                    estado: true,
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Descartar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
