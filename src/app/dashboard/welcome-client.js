// src/app/dashboard/welcome-client.js
"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBriefcase,
  FaUser,
  FaClock,
  FaBuilding,
  FaIdCard,
  FaCertificate,
  FaArrowRight,
  FaChartBar,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import Sidebar from "./components/sidebar";
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import { useRouter } from "next/navigation";

export default function WelcomeClient({ user, haciendaStatus, hasHaciendaToken }) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState(user?.name ?? "Cliente");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [haciendaConnection, setHaciendaConnection] = useState({
    connected: hasHaciendaToken,
    expiresIn: haciendaStatus?.seconds_left ?? 0,
  });

  const openPerfilRoute = () => router.push("/dashboard/perfil");

  useEffect(() => {
    const empresaData = localStorage.getItem('empresa');
    const empleadoData = localStorage.getItem('empleado');
    if (empresaData) {
      const empresaObj = JSON.parse(empresaData);
      setEmpresa(empresaObj);
      console.log('Empresa cargada del localStorage:', empresaObj.nombre);
    }
    if (empleadoData) {
      const empleadoObj = JSON.parse(empleadoData);
      setEmpleado(empleadoObj);
      console.log('Empleado cargado del localStorage:', empleadoObj.nombre);
    }
  }, []);

  useEffect(() => {
    setHaciendaConnection({
      connected: hasHaciendaToken,
      expiresIn: haciendaStatus?.seconds_left ?? 0,
    });
  }, [hasHaciendaToken, haciendaStatus]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const formatTimeLeft = (seconds) => {
    if (!seconds || seconds <= 0) return "Expirado";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const now = new Date();
  console.log('=== INFORMACIÓN DEL FRONTEND ===');
  console.log('Fecha y hora:', now.toString());
  console.log('Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('Timestamp:', now.getTime());
  console.log('Formato local:', now.toLocaleString());
  console.log('==============================');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 h-full overflow-hidden">
        <div className={`fixed md:static z-40 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 w-64`}>
          <Sidebar onOpenPerfil={openPerfilRoute} haciendaStatus={haciendaConnection} />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            user={user}
            hasHaciendaToken={hasHaciendaToken}
            haciendaStatus={haciendaStatus}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="max-w-7xl mx-auto w-full space-y-6">

                {/* Main welcome card */}
                <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl mb-6 lg:mb-8">
                  <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden hidden lg:block">
                    <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-indigo-600/20 rounded-l-full transform translate-x-1/3" />
                    <div className="absolute right-10 bottom-10 w-64 h-64 bg-gradient-to-br from-blue-500/30 to-indigo-600/40 rounded-full blur-2xl" />
                  </div>

                  <div className="relative p-6 sm:p-8 lg:p-12">
                    <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
                      {/* IZQUIERDA */}
                      <div className="w-full lg:w-1/2 z-10">
                        <div className="mb-3">
                          <span className="inline-block py-1.5 px-3 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold tracking-wider uppercase">
                            {empresa ? empresa.nombre : 'BYTE FUSION SOLUCIONES'}
                          </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                          Bienvenido a su{" "}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                            Sistema de Facturación Electrónica
                          </span>
                        </h1>

                        {empresa && (
                          <div className="mb-6 group">
                            <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-2 border-blue-200/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" />
                              <div className="absolute bottom-6 right-8 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                              <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '0.3s'}} />
                              <div className="relative z-10">
                                <div className="flex items-start justify-between mb-5">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
                                      <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                        <FaBuilding className="text-white text-xl" />
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        Empresa Activa
                                      </p>
                                      <h2 className="text-xl font-black text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                                        {empresa.nombre}
                                      </h2>
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <div className={`absolute inset-0 blur-sm opacity-60 rounded-lg animate-pulse ${empresa.ambiente === '00' ? 'bg-yellow-300' : 'bg-green-300'}`} />
                                    <span className={`relative px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transform hover:scale-105 transition-all duration-300 ${empresa.ambiente === '00' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900' : 'bg-gradient-to-r from-green-400 to-emerald-500 text-green-900'}`}>
                                      {empresa.ambiente === '00' ? 'Pruebas' : 'Producción'}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 group/item">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FaIdCard className="text-blue-500 text-sm group-hover/item:scale-110 transition-transform duration-300" />
                                      <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">NIT</p>
                                    </div>
                                    <p className="font-black text-gray-900 text-lg">{empresa.nit}</p>
                                  </div>
                                  {empresa.nrc && (
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 group/item">
                                      <div className="flex items-center gap-2 mb-1">
                                        <FaCertificate className="text-indigo-500 text-sm group-hover/item:scale-110 transition-transform duration-300" />
                                        <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider">NRC</p>
                                      </div>
                                      <p className="font-black text-gray-900 text-lg">{empresa.nrc}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <p className="text-gray-600 text-base sm:text-lg mb-6 max-w-2xl">
                          Transforme su proceso de facturación con nuestra plataforma
                          intuitiva. Genere, administre y envíe facturas electrónicas que
                          cumplen con todas las regulaciones fiscales.
                        </p>
                      </div>

                      {/* DERECHA */}
                      <div className="z-10 w-full lg:w-1/2 space-y-4">
                        <div className="relative w-full">
                          <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 shadow-xl">
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl" />
                            <div className="relative flex flex-col items-center justify-center text-center">
                              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">Sistema Listo</h3>
                              <p className="text-gray-600 mb-6">
                                {empresa ? `${empresa.nombre} está configurada y lista para facturar.` : "Todo configurado para comenzar a facturar."}
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-2 rounded-full w-full animate-pulse" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute -top-4 -right-4 w-10 h-10 bg-yellow-400 rounded-lg rotate-12 shadow-lg hidden sm:block" />
                          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-500 rounded-lg -rotate-12 shadow-lg hidden sm:block" />
                        </div>

                        {empleado && (
                          <div className="group">
                            <div className="relative bg-gradient-to-r from-white via-gray-50 to-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-pulse" />
                              </div>
                              <div className="relative z-10 flex items-center gap-4">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin" style={{animationDuration: '3s'}} />
                                  <div className="relative w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-white shadow-lg transform group-hover:scale-110 transition-all duration-300">
                                    <span className="text-gray-700 font-black text-2xl">{empleado.nombre.charAt(0)}</span>
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md">
                                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Usuario Activo
                                  </p>
                                  <p className="font-black text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors duration-300">{empleado.nombre}</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="relative overflow-hidden">
                                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                      <span className="relative inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md transform group-hover:scale-105 transition-all duration-300">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        {empleado.rol}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-bold">•</span>
                                    <span className="text-xs text-gray-600 font-medium group-hover:text-blue-600 transition-colors duration-300">{empleado.correo}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={`p-4 rounded-xl shadow-md ${haciendaConnection.connected ? "bg-green-50 border-2 border-green-200" : "bg-yellow-50 border-2 border-yellow-200"}`}>
                          <div className="flex items-start gap-3">
                            {haciendaConnection.connected
                              ? <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-lg" />
                              : <FaExclamationTriangle className="text-yellow-500 flex-shrink-0 mt-0.5 text-lg" />
                            }
                            <span className={`text-sm font-medium ${haciendaConnection.connected ? "text-green-700" : "text-yellow-700"}`}>
                              {haciendaConnection.connected
                                ? `Conectado a Hacienda (expira en ${formatTimeLeft(haciendaConnection.expiresIn)})`
                                : "Advertencia: No hay conexión activa con Hacienda. Algunas funciones pueden estar limitadas."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🎯 FEATURES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Feature 1 → /dashboard/dte_factura */}
                  <div
                    onClick={() => router.push("/dashboard/dte_factura")}
                    className="group relative cursor-pointer"
                  >
                    {/* Glow exterior animado */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative bg-white rounded-xl p-6 shadow-lg overflow-hidden transition-all duration-300 group-hover:-translate-y-1">
                      {/* Fondo animado que aparece al hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Partícula decorativa */}
                      <div className="absolute top-3 right-3 w-2 h-2 bg-blue-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
                      <div className="absolute top-6 right-7 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 group-hover:shadow-blue-300 group-hover:shadow-lg">
                          <FaFileInvoiceDollar className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                          Facturación Rápida
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 group-hover:text-gray-600 transition-colors duration-300">
                          Cree y envíe facturas electrónicas en segundos con nuestra interfaz intuitiva
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-50 group-hover:bg-blue-100 px-3 py-1.5 rounded-lg w-fit transition-all duration-300 group-hover:gap-3">
                          <span>Ir a facturar</span>
                          <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 - Sin navegación */}
                  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">100% Legal</h3>
                    <p className="text-sm text-gray-600">
                      Cumplimiento total con las regulaciones del Ministerio de Hacienda
                    </p>
                  </div>

                  {/* Feature 3 → /dashboard/reportes */}
                  <div
                    onClick={() => router.push("/dashboard/reportes")}
                    className="group relative cursor-pointer sm:col-span-2 lg:col-span-1"
                  >
                    {/* Glow exterior animado */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative bg-white rounded-xl p-6 shadow-lg overflow-hidden transition-all duration-300 group-hover:-translate-y-1">
                      {/* Fondo animado que aparece al hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Partículas decorativas */}
                      <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
                      <div className="absolute top-6 right-7 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 group-hover:shadow-indigo-300 group-hover:shadow-lg">
                          <FaChartBar className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                          Reportes Inteligentes
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 group-hover:text-gray-600 transition-colors duration-300">
                          Analice sus ventas con reportes detallados y gráficos en tiempo real
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 group-hover:bg-indigo-100 px-3 py-1.5 rounded-lg w-fit transition-all duration-300 group-hover:gap-3">
                          <span>Ver reportes</span>
                          <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}