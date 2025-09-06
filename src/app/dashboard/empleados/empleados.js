// src/app/dashboard/EMPLEADOS/empleados.js
"use client";
import { useState, useEffect } from "react";
import {
  FaSearch,
  FaBars,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaSave,
  FaTimes as FaClose,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

// Base de API (igual que en perfilEmpleado.js)
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000"


export default function Empleados({ 
  initialEmpleados = [], 
  user, 
  hasHaciendaToken = false,  
  haciendaStatus = {}       
})  {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [empleados, setEmpleados] = useState(initialEmpleados || []);
  const [filteredEmpleados, setFilteredEmpleados] = useState(
    initialEmpleados || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null); // perfil con sucursal

  // Límites de caracteres para cada campo
  const LIMITES = {
    NOMBRE: 255,
    NUMERODOCUMENTO: 20,
    CORREO: 255,
    CONTRASENA: 255,
    ROL: 255,
  };

  const [formData, setFormData] = useState({
    nombre: "",
    tipodocumento: "",
    numerodocumento: "",
    correo: "",
    contrasena: "",
    idsucursal: "",
    rol: "",
    estado: true,
  });


  // Cuando se abre el modal y ya tenemos la sucursal del admin, precargar idsucursal
  useEffect(() => {
    if (showAddModal && adminProfile?.sucursal?.idsucursal) {
      setFormData((prev) => ({
        ...prev,
        idsucursal: String(adminProfile.sucursal.idsucursal),
      }));
    }
  }, [showAddModal, adminProfile]);




  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [empleadoToDelete, setEmpleadoToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Tipos de documento según el modelo
  const tiposDocumento = [
    { codigo: "01", nombre: "DUI" },
    { codigo: "02", nombre: "NIT" },
    { codigo: "03", nombre: "Pasaporte" },
    { codigo: "04", nombre: "Carnet de Residente" },
    { codigo: "99", nombre: "Otro" },
  ];

  // Roles disponibles
  const roles = ["admin", "vendedor"];

  const getTipoDocumentoNombre = (codigo) => {
    const tipo = tiposDocumento.find((t) => t.codigo === codigo);
    return tipo ? tipo.nombre : "Desconocido";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    if (
      !showEditModal &&
      (!formData.contrasena || formData.contrasena.length < 6)
    ) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (!formData.rol.trim()) {
      setErrorMessage("El rol es obligatorio.");
      return false;
    }
    if (!formData.idsucursal) {
      setErrorMessage("No se pudo determinar tu sucursal. Recarga la página e inténtalo de nuevo.");
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setErrorMessage("La contraseña actual es obligatoria.");
      return false;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setErrorMessage("La nueva contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return false;
    }
    return true;
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


  // Cargar el perfil (incluye sucursal) para saber a qué sucursal pertenece el admin
  useEffect(() => {
    let cancel = false;
    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE}/perfil`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Cookie: document.cookie },
          credentials: "include",
        });
        if (!res.ok) return;
        const body = await res.json();
        if (cancel) return;
        setAdminProfile(body);
        setIsAdmin(String(body?.rol ?? "").toLowerCase() === "admin");
      } catch (e) {
        console.error("Error al cargar el perfil:", e);
      }
    }
    loadProfile();
    return () => { cancel = true; };
  }, []);





  useEffect(() => {
    setEmpleados(initialEmpleados || []);
    setFilteredEmpleados(initialEmpleados || []);
  }, [initialEmpleados]);

  useEffect(() => {
    const results =
      empleados && Array.isArray(empleados)
        ? empleados.filter(
          (empleado) =>
            empleado.idempleado.toString().includes(searchTerm) ||
            empleado.numerodocumento
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            empleado.nombre
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            empleado.correo.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];
    setFilteredEmpleados(results);
  }, [searchTerm, empleados]);

  const handleSearch = () => {
    if (searchTerm.trim() !== "") {
      setShowSearchResultsModal(true);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await fetch("http://localhost:3000/empleados/getAll", {
        method: "GET",
        headers: {
          Cookie: document.cookie,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener los empleados");
      }

      const data = await response.json();
      setEmpleados(data.empleados || []);
      setFilteredEmpleados(data.empleados || []);
    } catch (error) {
      console.error("Error al obtener los empleados:", error);
    }
  };

  const handleSaveNewEmpleado = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/empleados/add", {
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
        setErrorMessage(errorData.message || "Error al agregar el empleado");
        setShowErrorModal(true);
        return;
      }

      setShowAddModal(false);
      setFormData({
        nombre: "",
        tipodocumento: "",
        numerodocumento: "",
        correo: "",
        contrasena: "",
        idsucursal: "",
        rol: "",
        estado: true,
      });
      fetchEmpleados();
    } catch (error) {
      console.error("Error al agregar el empleado:", error);
      setErrorMessage(
        "Ocurrió un error inesperado. Por favor, inténtelo de nuevo."
      );
      setShowErrorModal(true);
    }
  };

  const handleUpdateEmpleado = async (e) => {
    e.preventDefault();

    // Para edición, no validar contraseña si está vacía
    const tempFormData = { ...formData };
    if (!tempFormData.contrasena) {
      delete tempFormData.contrasena;
    }

    if (!validateForm()) {
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/empleados/update/${formData.idempleado}`,
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
        setErrorMessage(errorData.message || "Error al actualizar el empleado");
        setShowErrorModal(true);
        return;
      }

      setShowEditModal(false);
      setFormData({
        nombre: "",
        tipodocumento: "",
        numerodocumento: "",
        correo: "",
        contrasena: "",
        idsucursal: "",
        rol: "",
        estado: true,
      });
      fetchEmpleados();
    } catch (error) {
      console.error("Error al actualizar el empleado:", error);
      setErrorMessage(
        "Ocurrió un error inesperado. Por favor, inténtelo de nuevo."
      );
      setShowErrorModal(true);
    }
  };

  const handleToggleEstado = async (empleadoId, nuevoEstado) => {
    // 1) Buscar el empleado actual en memoria para armar el payload completo
    const emp = empleados.find((e) => e.idempleado === empleadoId);
    if (!emp) return;

    const payload = {
      // Enviar los mismos campos que envía el modal, solo cambiando el estado.
      nombre: emp.nombre,
      tipodocumento: emp.tipodocumento,
      numerodocumento: emp.numerodocumento,
      correo: emp.correo,
      idsucursal: emp.idsucursal,
      rol: emp.rol,
      estado: nuevoEstado,
    };

    // 2) Actualización optimista
    const prevEmpleados = empleados;
    const prevFiltrados = filteredEmpleados;

    const applyLocal = (list) =>
      list.map((e) =>
        e.idempleado === empleadoId ? { ...e, estado: nuevoEstado } : e
      );

    setEmpleados((list) => applyLocal(list));
    setFilteredEmpleados((list) => applyLocal(list));

    try {
      const response = await fetch(
        `${API_BASE}/empleados/update/${empleadoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Cookie: document.cookie,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        // Revertir si falla
        setEmpleados(prevEmpleados);
        setFilteredEmpleados(prevFiltrados);
        setErrorMessage("Error al cambiar el estado del empleado.");
        setShowErrorModal(true);
        return;
      }

      // (Opcional) refrescar desde servidor si quieres asegurar consistencia:
      // await fetchEmpleados();
    } catch (error) {
      console.error("Error al cambiar el estado del empleado:", error);
      // Revertir si falla
      setEmpleados(prevEmpleados);
      setFilteredEmpleados(prevFiltrados);
      setErrorMessage("Error al cambiar el estado del empleado.");
      setShowErrorModal(true);
    }
  };


  const handleDeleteEmpleado = async (empleadoId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/empleados/delete/${empleadoId}`,
        {
          method: "DELETE",
          headers: {
            Cookie: document.cookie,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        setErrorMessage("Error al eliminar el empleado.");
        setShowErrorModal(true);
        return;
      }

      fetchEmpleados();
    } catch (error) {
      console.error("Error al eliminar el empleado:", error);
      setErrorMessage("Error al eliminar el empleado.");
      setShowErrorModal(true);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      setShowErrorModal(true);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/empleados/change-password/${selectedEmpleado.idempleado}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: document.cookie,
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Error al cambiar la contraseña");
        setShowErrorModal(true);
        return;
      }

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSelectedEmpleado(null);
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      setErrorMessage("Error al cambiar la contraseña.");
      setShowErrorModal(true);
    }
  };

  const handleEditClick = (empleado) => {
    setFormData({
      ...empleado,
      contrasena: "", // No mostrar la contraseña actual
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (empleadoId) => {
    setEmpleadoToDelete(empleadoId);
    setShowDeleteConfirmModal(true);
  };

  const handlePasswordClick = (empleado) => {
    setSelectedEmpleado(empleado);
    setShowPasswordModal(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  const [currentPage, setCurrentPage] = useState(1);
  const empleadosPorPagina = 5;
  const totalPaginas = Math.ceil(filteredEmpleados.length / empleadosPorPagina);
  const empleadosPagina = filteredEmpleados.slice(
    (currentPage - 1) * empleadosPorPagina,
    currentPage * empleadosPorPagina
  );

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
          className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
        >
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col">
                <Navbar 
                    user={user}
                    hasHaciendaToken={hasHaciendaToken}
                    haciendaStatus={haciendaStatus}
                    onToggleSidebar={toggleSidebar}
                    sidebarOpen={sidebarOpen}
                />

          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  Empleados
                </h2>
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
                  placeholder="Buscar por ID, documento, nombre o correo"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
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
                    {empleadosPagina &&
                      Array.isArray(empleadosPagina) &&
                      empleadosPagina.map((empleado) => (
                        <tr
                          key={empleado.idempleado}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {empleado.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTipoDocumentoNombre(empleado.tipodocumento)}:{" "}
                            {empleado.numerodocumento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {empleado.correo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {empleado.rol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${empleado.estado
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {empleado.estado ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditClick(empleado)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              aria-label="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handlePasswordClick(empleado)}
                              className="text-purple-600 hover:text-purple-800 mr-2"
                              aria-label="Cambiar contraseña"
                            >
                              <FaUser />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleEstado(
                                  empleado.idempleado,
                                  !empleado.estado
                                )
                              }
                              className={`mr-2 ${empleado.estado
                                ? "text-green-600 hover:text-green-800"
                                : "text-red-600 hover:text-red-800"
                                }`}
                              aria-label={
                                empleado.estado ? "Desactivar" : "Activar"
                              }
                            >
                              {empleado.estado ? (
                                <FaToggleOn />
                              ) : (
                                <FaToggleOff />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClick(empleado.idempleado)
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
            </div>

            <div className="md:hidden">
              <div className="space-y-4">
                {empleadosPagina &&
                  Array.isArray(empleadosPagina) &&
                  empleadosPagina.map((empleado) => (
                    <div
                      key={empleado.idempleado}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-gray-900">
                          {empleado.nombre}
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(empleado)}
                            className="text-blue-600 hover:text-blue-800"
                            aria-label="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handlePasswordClick(empleado)}
                            className="text-purple-600 hover:text-purple-800"
                            aria-label="Cambiar contraseña"
                          >
                            <FaUser />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleEstado(
                                empleado.idempleado,
                                !empleado.estado
                              )
                            }
                            className={
                              empleado.estado
                                ? "text-green-600 hover:text-green-800"
                                : "text-red-600 hover:text-red-800"
                            }
                            aria-label={
                              empleado.estado ? "Desactivar" : "Activar"
                            }
                          >
                            {empleado.estado ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(empleado.idempleado)
                            }
                            className="text-red-600 hover:text-red-800"
                            aria-label="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">
                            Documento:
                          </span>
                          <span className="text-sm text-gray-900">
                            {getTipoDocumentoNombre(empleado.tipodocumento)}:{" "}
                            {empleado.numerodocumento}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">
                            Correo:
                          </span>
                          <span className="text-sm text-gray-900">
                            {empleado.correo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">
                            Rol:
                          </span>
                          <span className="text-sm text-gray-900">
                            {empleado.rol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">
                            Estado:
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${empleado.estado
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {empleado.estado ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {/* Paginación móvil */}
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
          </div>

          <Footer />
        </div>
      </div>

      {/* Modal de Agregar Empleado */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Agregar Empleado
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
              onSubmit={handleSaveNewEmpleado}
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
                  className="text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      setFormData({ ...formData, tipodocumento: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    style={{ color: formData.tipodocumento ? '#111827' : '#4b5563' }}
                  >
                    <option value="" disabled className="text-gray-600">
                      Seleccionar
                    </option>
                    {tiposDocumento.map((tipo) => (
                      <option key={tipo.codigo} value={tipo.codigo}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>

                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 mb-0.5 whitespace-nowrap"
                  >
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
                    placeholder="Ingrese el número de documento"
                    className="text-gray-900 w-full px-3 py-2 border border-gray-400 rounded-md placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={LIMITES.NUMERODOCUMENTO}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.numerodocumento.length}/{LIMITES.NUMERODOCUMENTO} caracteres
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
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.contrasena}
                    onChange={(e) =>
                      setFormData({ ...formData, contrasena: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={LIMITES.CONTRASENA}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  style={{ color: formData.rol ? '#111827' : '#4b5563' }}
                >
                  <option value="" disabled className="text-gray-600">
                    Seleccionar
                  </option>
                  {roles.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>

              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <input
                  type="text"
                  value={
                    adminProfile?.sucursal
                      ? `${adminProfile.sucursal.nombre} (ID ${adminProfile.sucursal.idsucursal})`
                      : "Cargando sucursal..."
                  }
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-600"
                />
                {/* Valor real que se enviará en el POST */}
                <input type="hidden" value={formData.idsucursal} />
                <p className="text-xs text-gray-500 mt-1">
                  La nueva cuenta se creará en tu misma sucursal.
                </p>
              </div>


              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="estado"
                  checked={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="estado"
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

      {/* Modal de Editar Empleado */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Empleado
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
              onSubmit={handleUpdateEmpleado}
              className="text-black px-6 py-4 space-y-4"
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
                      setFormData({ ...formData, tipodocumento: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    style={{ color: formData.tipodocumento ? '#111827' : '#4b5563' }}
                  >
                    <option value="" disabled className="text-gray-600">
                      Seleccionar
                    </option>
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
                  Contraseña (dejar vacío para no cambiar)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.contrasena}
                    onChange={(e) =>
                      setFormData({ ...formData, contrasena: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={LIMITES.CONTRASENA}
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  style={{ color: formData.rol ? '#111827' : '#4b5563' }}
                >
                  <option value="" disabled className="text-gray-600">
                    Seleccionar
                  </option>
                  {roles.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>

                {/* Visible solo lectura: muestra la sucursal del empleado */}
                <input
                  type="text"
                  value={`ID ${formData.idsucursal}`} 
                  className="
                  w-full px-3 py-2
                  border border-gray-200 bg-gray-50
                  rounded-md
                  text-gray-600                       
                  cursor-not-allowed
                  "
                />

                {/* Mantener el valor en el estado para el submit (no editable) */}
                <input type="hidden" value={formData.idsucursal} />
                <p className="text-xs text-gray-500 mt-1">
                  Campo de solo lectura.
                </p>
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
                ¿Estás seguro de que deseas eliminar este empleado? Esta acción
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
                  handleDeleteEmpleado(empleadoToDelete);
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
                    contrasena: "",
                    idsucursal: "",
                    rol: "",
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

      {/* Modal de Error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Error</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">{errorMessage}</p>
            </div>
            <div className="flex justify-end px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Cambiar Contraseña
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={handleChangePassword}
              className="px-6 py-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}