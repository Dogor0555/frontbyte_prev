"use client";
import { useState, useEffect, useRef } from "react";
import { 
  FaSearch, 
  FaFilter, 
  FaFileDownload, 
  FaEye, 
  FaUser, 
  FaTable, 
  FaHistory, 
  FaCalendarAlt,
  FaChartBar,
  FaSync,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { API_BASE_URL } from "@/lib/api";

export default function BitacoraView({ user }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tablaFiltro, setTablaFiltro] = useState("");
  const [accionFiltro, setAccionFiltro] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const limitePorPagina = 20;

  const tablaRef = useRef();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    cargarRegistros();
    cargarEstadisticas();
  }, [paginaActual]);

  const cargarRegistros = async () => {
    setCargando(true);
    setError("");

    try {
      const params = new URLSearchParams({
        limit: limitePorPagina.toString(),
        offset: ((paginaActual - 1) * limitePorPagina).toString()
      });

      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (tablaFiltro) params.append('tabla', tablaFiltro);
      if (accionFiltro) params.append('accion', accionFiltro);
      if (usuarioFiltro) params.append('usuario', usuarioFiltro);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_BASE_URL}/bitacora/getAll?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRegistros(data.data || []);
        setTotalRegistros(data.total || 0);
        setTotalPaginas(data.paginacion?.totalPaginas || 1);
      } else {
        throw new Error('Error al cargar los registros');
      }
    } catch (error) {
      console.error('Error:', error);
      setError("Error al cargar los registros de bitácora");
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const response = await fetch(`${API_BASE_URL}/bitacora/estadisticas?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const aplicarFiltros = () => {
    setPaginaActual(1);
    cargarRegistros();
    cargarEstadisticas();
    setMostrarFiltros(false);
  };

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setTablaFiltro("");
    setAccionFiltro("");
    setUsuarioFiltro("");
    setSearchTerm("");
    setPaginaActual(1);
    cargarRegistros();
    cargarEstadisticas();
  };

  const verDetallesRegistro = (registro) => {
    setRegistroSeleccionado(registro);
    setModalDetallesOpen(true);
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorAccion = (accion) => {
    switch (accion) {
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconoAccion = (accion) => {
    switch (accion) {
    }
  };

  const exportarCSV = () => {
    const headers = ['Fecha', 'Empleado', 'Tabla', 'Acción', 'Registro ID', 'IP Origen', 'Motivo'];
    const csvData = registros.map(registro => [
      formatearFecha(registro.fhregistro),
      registro.correo || `ID: ${registro.idusuario}`,
      registro.tabla,
      registro.accion,
      registro.pk_valor || 'N/A',
      registro.ip_origen,
      registro.motivo || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bitacora_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPaginacion = () => {
    const paginas = [];
    const maxPaginas = 5;
    
    let inicio = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(totalPaginas, inicio + maxPaginas - 1);
    
    if (fin - inicio + 1 < maxPaginas) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(
        <button
          key={i}
          onClick={() => setPaginaActual(i)}
          className={`px-3 py-1 rounded ${
            i === paginaActual
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Mostrando {((paginaActual - 1) * limitePorPagina) + 1} - {Math.min(paginaActual * limitePorPagina, totalRegistros)} de {totalRegistros} registros
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          {paginas}
          <button
            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}>
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="text-black flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bitácora del Sistema</h1>
              <p className="text-gray-600">Registro de eventos y auditoría</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <p className="text-lg font-semibold text-blue-600">{totalRegistros} registros</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            
            {/* Tarjeta de controles */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* Barra de búsqueda y controles */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar en bitácora..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    <FaFilter className="mr-2" />
                    Filtros
                  </button>
                  
                  <button
                    onClick={exportarCSV}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    <FaFileDownload className="mr-2" />
                    Exportar
                  </button>
                  
                  <button
                    onClick={cargarRegistros}
                    disabled={cargando}
                    className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    <FaSync className={`mr-2 ${cargando ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>
                </div>
              </div>

              {/* Filtros expandibles */}
              {mostrarFiltros && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tabla
                      </label>
                      <select
                        value={tablaFiltro}
                        onChange={(e) => setTablaFiltro(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Todas las tablas</option>
                        <option value="dte_factura">Facturas</option>
                        <option value="clientes">Clientes</option>
                        <option value="productos">Productos</option>
                        <option value="empleados">Empleados</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acción
                      </label>
                      <select
                        value={accionFiltro}
                        onChange={(e) => setAccionFiltro(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Todas las acciones</option>
                        <option value="INSERT">INSERT</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={limpiarFiltros}
                      className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                    >
                      <FaTimes className="mr-2" />
                      Limpiar
                    </button>
                    
                    <button
                      onClick={aplicarFiltros}
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      <FaFilter className="mr-2" />
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              {mostrarEstadisticas && estadisticas && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Estadísticas de la Bitácora</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-700 mb-2">Por Acción</h4>
                      {estadisticas.porAccion?.map((stat, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{stat.accion}:</span>
                          <span className="font-semibold">{stat.total}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-700 mb-2">Tablas Más Activas</h4>
                      {estadisticas.tablasMasActivas?.slice(0, 5).map((stat, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{stat.tabla}:</span>
                          <span className="font-semibold">{stat.total}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-700 mb-2">Usuarios Más Activos</h4>
                      {estadisticas.usuariosMasActivos?.slice(0, 5).map((stat, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{stat.correo || `ID: ${stat.idusuario}`}:</span>
                          <span className="font-semibold">{stat.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Tabla de registros */}
              <div className="overflow-x-auto" ref={tablaRef}>
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Fecha/Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Empleado</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Tabla</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Acción</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Registro ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">IP Origen</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cargando ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center">
                          <div className="flex justify-center items-center">
                            <FaSync className="animate-spin text-blue-600 mr-2" />
                            <span>Cargando registros...</span>
                          </div>
                        </td>
                      </tr>
                    ) : registros.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <FaInfoCircle className="text-3xl text-gray-400 mb-2" />
                            <p>No se encontraron registros para los filtros aplicados</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      registros.map((registro) => (
                        <tr key={registro.idbitacora} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b text-sm">
                            {formatearFecha(registro.fhregistro)}
                          </td>
                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center">
                              <FaUser className="text-gray-400 mr-2" />
                              <span className="text-sm">
                                {registro.correo || `ID: ${registro.idusuario}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center">
                              <FaTable className="text-gray-400 mr-2" />
                              <span className="text-sm font-medium">{registro.tabla}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorAccion(registro.accion)}`}>
                              <span className="mr-1">{getIconoAccion(registro.accion)}</span>
                              {registro.accion}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b text-sm">
                            {registro.pk_valor || 'N/A'}
                          </td>
                          <td className="px-4 py-3 border-b text-sm font-mono">
                            {registro.ip_origen}
                          </td>
                          <td className="px-4 py-3 border-b">
                            <button
                              onClick={() => verDetallesRegistro(registro)}
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <FaEye className="mr-1" />
                              <span className="text-sm">Detalles</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {registros.length > 0 && renderPaginacion()}
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Modal de detalles del registro */}
      {modalDetallesOpen && registroSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Detalles del Registro de Bitácora</h2>
              <button
                onClick={() => setModalDetallesOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-700">Información Básica</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID de Bitácora</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-gray-900">{registroSeleccionado.idbitacora}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Fecha y Hora</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                    {formatearFecha(registroSeleccionado.fhregistro)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Empleado</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                    {registroSeleccionado.correo || `ID: ${registroSeleccionado.idusuario}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Tabla</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-gray-900">{registroSeleccionado.tabla}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-700">Detalles de la Acción</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Acción</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorAccion(registroSeleccionado.accion)}`}>
                      {registroSeleccionado.accion}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Registro Afectado</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                    {registroSeleccionado.pk_nombre}: {registroSeleccionado.pk_valor || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">IP de Origen</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded font-mono text-gray-900">
                    {registroSeleccionado.ip_origen}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Motivo</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                    {registroSeleccionado.motivo || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {registroSeleccionado.cambios && Object.keys(registroSeleccionado.cambios).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Cambios Realizados</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(registroSeleccionado.cambios, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setModalDetallesOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}