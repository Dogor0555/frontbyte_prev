// src/app/dashboard/welcome-client.js
"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaBars, FaTimes, FaCheckCircle, FaExclamationTriangle, FaSave } from "react-icons/fa";
import Sidebar from "./components/sidebar";
import Footer from "./components/footer";
import { useRouter } from "next/navigation";



export default function WelcomeClient({ user, haciendaStatus, hasHaciendaToken }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userName, setUserName] = useState(user?.name || "Cliente");
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [haciendaConnection, setHaciendaConnection] = useState({
        connected: hasHaciendaToken,
        expiresIn: haciendaStatus?.seconds_left || 0
    });

    const [perfilOpen, setPerfilOpen] = useState(false);
    const [perfilLoading, setPerfilLoading] = useState(false);
    const [perfilSaving, setPerfilSaving] = useState(false);
    const [perfilError, setPerfilError] = useState("");
    const [perfilOk, setPerfilOk] = useState("");
    const [perfil, setPerfil] = useState(null);
    const [perfilForm, setPerfilForm] = useState({
        nombre: "",
        tipodocumento: "",
        numerodocumento: "",
        correo: "",
    });
    const [perfilEditable, setPerfilEditable] = useState(false);



    // Abrir modal y cargar datos
    const API_BASE = "http://localhost:3000";
    const openPerfilModal = async () => {
        setPerfilOpen(true);
        setPerfilLoading(true);
        setPerfilError("");
        setPerfilOk("");

        try {
            const res = await fetch(`${API_BASE}/perfil`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (res.status === 401) {
                setPerfilOpen(false);
                router.push("/auth/login");
                return;
            }
            const data = await res.json();

            setPerfil(data);
            setPerfilForm({
                nombre: data?.nombre ?? "",
                tipodocumento: data?.tipodocumento ?? "",
                numerodocumento: data?.numerodocumento ?? "",
                correo: data?.correo ?? "",
            });
            // Admin -> editable, Vendedor -> lectura
            const editable = String(data?.rol ?? "").toLowerCase() === "admin";
            setPerfilEditable(editable);
        } catch (e) {
            console.error("[welcome-client] GET /perfil:", e);
            setPerfilError("No se pudo cargar el perfil.");
        } finally {
            setPerfilLoading(false);
        }
    };

    const closePerfilModal = () => {
        setPerfilOpen(false);
    };

    // Guardar (solo admin)
    const savePerfil = async () => {
        if (!perfilEditable) return;

        // Validación mínima
        if (!perfilForm.nombre.trim()) return setPerfilError("El nombre es obligatorio.");
        if (!perfilForm.tipodocumento) return setPerfilError("El tipo de documento es obligatorio.");
        if (!perfilForm.numerodocumento.trim()) return setPerfilError("El número de documento es obligatorio.");
        if (!perfilForm.correo.trim()) return setPerfilError("El correo es obligatorio.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfilForm.correo)) return setPerfilError("El formato del correo no es válido.");

        setPerfilSaving(true);
        setPerfilError("");
        setPerfilOk("");
        try {
            const payload = {
                nombre: perfilForm.nombre.trim(),
                tipodocumento: String(perfilForm.tipodocumento).trim(),
                numerodocumento: perfilForm.numerodocumento.trim(),
                correo: perfilForm.correo.trim().toLowerCase(),
            };

            const res = await fetch(`${API_BASE}/perfil`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                setPerfilOpen(false);
                router.push("/auth/login");
                return;
            }

            const body = await res.json();
            if (!res.ok) {
                setPerfilError(body?.error || body?.message || "No se pudo actualizar el perfil.");
                return;
            }

            const actualizado = body?.perfil ?? payload;
            setPerfil((p) => ({ ...p, ...actualizado }));
            setPerfilOk("Perfil actualizado con éxito.");
        } catch (e) {
            console.error("[welcome-client] PUT /perfil:", e);
            setPerfilError("Error de red al actualizar el perfil.");
        } finally {
            setPerfilSaving(false);
        }
    };










    useEffect(() => {
        // Actualizar estado cuando cambien las props
        setHaciendaConnection({
            connected: hasHaciendaToken,
            expiresIn: haciendaStatus?.seconds_left || 0
        });
    }, [hasHaciendaToken, haciendaStatus]);

    useEffect(() => {
        // Detectar si es un dispositivo móvil
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

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Formatear tiempo restante para token de Hacienda
    const formatTimeLeft = (seconds) => {
        if (!seconds || seconds <= 0) return "Expirado";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            {/* Overlay para cuando el sidebar está abierto en móvil */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Estructura principal */}
            <div className="flex flex-1 h-full">
                {/* Sidebar */}
                <div
                    className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                        } ${!isMobile ? 'md:translate-x-0 md:w-64' : ''
                        }`}
                >
                    <Sidebar onOpenPerfil={openPerfilModal} haciendaStatus={haciendaConnection} />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Navbar */}
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

                                <div className="relative ml-4 md:ml-6 hidden sm:block">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FaSearch className="text-gray-400" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="py-2 pl-10 pr-4 w-48 md:w-64 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Estado de conexión con Hacienda */}
                                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${haciendaConnection.connected
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {haciendaConnection.connected ? (
                                        <FaCheckCircle className="mr-1" />
                                    ) : (
                                        <FaExclamationTriangle className="mr-1" />
                                    )}
                                    <span>
                                        {haciendaConnection.connected
                                            ? `Hacienda: ${formatTimeLeft(haciendaConnection.expiresIn)}`
                                            : 'Hacienda: Desconectado'}
                                    </span>
                                </div>

                                <span className="mr-2 text-xs md:text-sm text-black font-medium truncate max-w-24 md:max-w-none">
                                    {userName}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white font-medium">
                                    {userName.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Welcome Content */}
                    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="min-h-[calc(100vh-16rem)]">
                                <div className="max-w-6xl mx-auto w-full relative">
                                    {/* Main welcome card */}
                                    <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl mb-6">
                                        <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden hidden md:block">
                                            <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-600/20 rounded-l-full transform translate-x-1/3"></div>
                                            <div className="absolute right-10 bottom-10 w-64 h-64 bg-gradient-to-br from-blue-500/30 to-indigo-600/40 rounded-full blur-2xl"></div>
                                        </div>

                                        <div className="relative p-4 sm:p-8 md:p-12 flex flex-col md:flex-row items-center">
                                            <div className="w-full md:w-1/2 z-10">
                                                <div className="mb-2">
                                                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold tracking-wider">
                                                        BYTE FUSION SOLUCIONES
                                                    </span>
                                                </div>

                                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                                    Bienvenido a su <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Sistema de Facturación Electrónica</span>
                                                </h1>

                                                <p className="text-gray-600 text-sm md:text-lg mb-6 md:mb-8 max-w-xl">
                                                    Transforme su proceso de facturación con nuestra plataforma intuitiva. Genere, administre y envíe facturas electrónicas que cumplen con todas las regulaciones fiscales.
                                                </p>

                                                {/* Estado de conexión destacado */}
                                                <div className={`p-3 rounded-lg mb-4 ${haciendaConnection.connected
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-yellow-50 border border-yellow-200'
                                                    }`}>
                                                    <div className="flex items-center">
                                                        {haciendaConnection.connected ? (
                                                            <FaCheckCircle className="text-green-500 mr-2" />
                                                        ) : (
                                                            <FaExclamationTriangle className="text-yellow-500 mr-2" />
                                                        )}
                                                        <span className="text-green-500 text-sm">
                                                            {haciendaConnection.connected
                                                                ? `Conectado a Hacienda (expira en ${formatTimeLeft(haciendaConnection.expiresIn)})`
                                                                : 'Advertencia: No hay conexión activa con Hacienda. Algunas funciones pueden estar limitadas.'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center items-center z-10">
                                                <div className="relative w-full max-w-xs md:max-w-md">
                                                    <div className="aspect-square relative bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 md:p-8 shadow-lg">
                                                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl"></div>

                                                        <div className="relative h-full flex flex-col items-center justify-center text-center">
                                                            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mb-4 md:mb-6">
                                                                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>

                                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Todo listo para facturar</h3>
                                                            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Su cuenta está configurada y lista para comenzar a emitir facturas electrónicas de inmediato.</p>

                                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                                                <div className="bg-blue-600 h-1.5 rounded-full w-full animate-progress"></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Decorative elements */}
                                                    <div className="absolute -top-4 -right-4 w-8 h-8 md:w-12 md:h-12 bg-yellow-400 rounded-lg rotate-12 shadow-lg hidden sm:block"></div>
                                                    <div className="absolute -bottom-4 -left-4 w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-lg -rotate-12 shadow-lg hidden sm:block"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features section */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                        {/* Feature 1 */}
                                        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                                                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Facturación Simplificada</h3>
                                            <p className="text-sm md:text-base text-gray-600">Genere facturas electrónicas en segundos y envíelas directamente a sus clientes</p>
                                        </div>

                                        {/* Feature 2 */}
                                        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                                                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Cumplimiento Fiscal</h3>
                                            <p className="text-sm md:text-base text-gray-600">Nuestro sistema se actualiza automáticamente con las últimas regulaciones fiscales</p>
                                        </div>

                                        {/* Feature 3 */}
                                        <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transform transition-transform">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                                                <svg className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                                                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Análisis de Datos</h3>
                                            <p className="text-sm md:text-base text-gray-600">Obtenga información valiosa sobre sus finanzas con nuestros reportes detallados</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Footer Component */}
                    <Footer />
                </div>
            </div>


            

            {perfilOpen && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Mi Perfil</h3>
          <p className="text-xs text-gray-500">
            {perfilEditable ? "Puedes editar tus datos." : "Solo lectura (rol vendedor)."}
          </p>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={closePerfilModal}
          aria-label="Cerrar"
        >
          <FaTimes />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {perfilLoading && (
          <div className="rounded-md border bg-white p-3 text-gray-600">Cargando perfil…</div>
        )}

        {!perfilLoading && perfilError && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <FaExclamationTriangle className="h-4 w-4" />
            <span className="text-sm">{perfilError}</span>
          </div>
        )}

        {!perfilLoading && perfilOk && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
            <FaCheckCircle className="h-4 w-4" />
            <span className="text-sm">{perfilOk}</span>
          </div>
        )}

        {!perfilLoading && perfil && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={perfilForm.nombre}
                onChange={(e) => setPerfilForm((s) => ({ ...s, nombre: e.target.value }))}
                disabled={!perfilEditable}
                className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                  perfilEditable ? "border-gray-300 focus:ring-blue-500" : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de documento</label>
                <select
                  value={perfilForm.tipodocumento}
                  onChange={(e) => setPerfilForm((s) => ({ ...s, tipodocumento: e.target.value }))}
                  disabled={!perfilEditable}
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                    perfilEditable ? "border-gray-300 focus:ring-blue-500" : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  <option value="">Seleccionar</option>
                  <option value="01">DUI</option>
                  <option value="02">NIT</option>
                  <option value="03">Pasaporte</option>
                  <option value="04">Carnet de Residente</option>
                  <option value="13">DUI (El Salvador)</option>
                  <option value="99">Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Número de documento</label>
                <input
                  type="text"
                  value={perfilForm.numerodocumento}
                  onChange={(e) => setPerfilForm((s) => ({ ...s, numerodocumento: e.target.value }))}
                  disabled={!perfilEditable}
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                    perfilEditable ? "border-gray-300 focus:ring-blue-500" : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Correo</label>
              <input
                type="email"
                value={perfilForm.correo}
                onChange={(e) => setPerfilForm((s) => ({ ...s, correo: e.target.value }))}
                disabled={!perfilEditable}
                className={`w-full rounded-md border px-3 py-2 text-gray-900 outline-none focus:ring-1 ${
                  perfilEditable ? "border-gray-300 focus:ring-blue-500" : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              />
            </div>

            {/* Meta no editable */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">ID Empleado</span>
                <span className="mt-0.5 block text-sm text-gray-900">{perfil?.idempleado ?? "-"}</span>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Rol</span>
                <span className="mt-0.5 block text-sm text-gray-900">{perfil?.rol ?? "-"}</span>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Estado</span>
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    perfil?.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {perfil?.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Sucursal</span>
                <span className="mt-0.5 block text-sm text-gray-900">
                  {perfil?.sucursal ? `${perfil.sucursal.nombre} (ID ${perfil.sucursal.idsucursal})` : "-"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
        <button
          type="button"
          onClick={closePerfilModal}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Cerrar
        </button>
        {perfilEditable && (
          <button
            type="button"
            disabled={perfilSaving}
            onClick={savePerfil}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${
              perfilSaving ? "bg-blue-300 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <FaSave />
            {perfilSaving ? "Guardando..." : "Guardar"}
          </button>
        )}
      </div>
    </div>
  </div>
)}


            





        </div>
    );
}