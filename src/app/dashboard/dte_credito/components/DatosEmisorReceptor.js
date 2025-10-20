"use client";
import { useState, useEffect } from "react";
import { codigoactividad } from "../data/data";

const LIMITES = {
    NOMBRE: 255,
    NOMBRECOMERCIAL: 255,
    DUI: 10,
    PASAPORTE: 20,
    NIT: 20,
    NRC: 25,
    CARNETRESIDENTE: 20,
    CORREO: 255,
    TELEFONO: 20,
    DEPARTAMENTO: 100,
    MUNICIPIO: 100,
    COMPLEMENTO: 255,
    CODACTIVIDAD: 20,
    DESCACTIVIDAD: 255,
};

const DatosEmisorReceptor = ({ 
  // Estados del receptor
  tipoDocumentoReceptor, 
  setTipoDocumentoReceptor,
  numeroDocumentoReceptor,
  setNumeroDocumentoReceptor,
  nombreReceptor,
  setNombreReceptor,
  direccionReceptor,
  setDireccionReceptor,
  correoReceptor,
  setCorreoReceptor,
  telefonoReceptor,
  setTelefonoReceptor,
  complementoReceptor,
  setComplementoReceptor,
  
  // Estados del emisor
  actividadEconomica,
  setActividadEconomica,
  direccionEmisor,
  setDireccionEmisor,
  correoVendedor,
  setCorreoVendedor,
  telefonoEmisor,
  setTelefonoEmisor,
  // Nuevo estado para idReceptor
  idReceptor,
  setIdReceptor,

  actividadesEconomicas
}) => {
  const [activeTab, setActiveTab] = useState("emisor");
  const [errores, setErrores] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showClientList, setShowClientList] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Cargar clientes al montar el componente
  useEffect(() => {
      const fetchClientes = async () => {
        setLoadingClientes(true);
        try {
          const response = await fetch("http://localhost:3000/clientes/activos", {
            method: "GET",
            credentials: "include", 
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const clientesFiltrados = data.data.filter(cliente => 
                cliente.personanatural === false
              );
              setClientes(clientesFiltrados);
            }
          } else {
            console.error("Error en la respuesta:", response.status);
          }
        } catch (error) {
          console.error("Error al cargar clientes:", error);
        } finally {
          setLoadingClientes(false);
        }
      };

      fetchClientes();
    }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClientes([]);
      setShowClientList(false);
      return;
    }

    const filtered = clientes.filter(cliente => 
      cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.dui?.includes(searchTerm) ||
      cliente.nit?.includes(searchTerm) ||
      cliente.pasaporte?.includes(searchTerm)
    );

    setFilteredClientes(filtered);
    setShowClientList(filtered.length > 0);
  }, [searchTerm, clientes]);

  const validarCampo = (campo, valor, limite) => {
    if (valor.length > limite) {
      setErrores(prev => ({
        ...prev,
        [campo]: `Máximo ${limite} caracteres permitidos`
      }));
      return false;
    } else {
      setErrores(prev => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[campo];
        return nuevosErrores;
      });
      return true;
    }
  };

  const handleNombreReceptorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('nombreReceptor', valor, LIMITES.NOMBRE)) {
      setNombreReceptor(valor);
    }
  };

  const handleDireccionReceptorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('direccionReceptor', valor, LIMITES.COMPLEMENTO)) {
      setDireccionReceptor(valor);
    }
  };

  const handleComplementoReceptorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('complementoReceptor', valor, LIMITES.COMPLEMENTO)) {
      setComplementoReceptor(valor);
    }
  };

  const handleCorreoReceptorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('correoReceptor', valor, LIMITES.CORREO)) {
      setCorreoReceptor(valor);
    }
  };

  const handleTelefonoReceptorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('telefonoReceptor', valor, LIMITES.TELEFONO)) {
      setTelefonoReceptor(valor);
    }
  };

  const handleDireccionEmisorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('direccionEmisor', valor, LIMITES.COMPLEMENTO)) {
      setDireccionEmisor(valor);
    }
  };

  const handleCorreoVendedorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('correoVendedor', valor, LIMITES.CORREO)) {
      setCorreoVendedor(valor);
    }
  };

  const handleTelefonoEmisorChange = (e) => {
    const valor = e.target.value;
    if (validarCampo('telefonoEmisor', valor, LIMITES.TELEFONO)) {
      setTelefonoEmisor(valor);
    }
  };

  const handleNumeroDocumentoChange = (e) => {
    const valor = e.target.value;
    let limite = LIMITES.NIT;
    
    switch (tipoDocumentoReceptor) {
      case "36": // NIT
        limite = LIMITES.NIT;
        break;
      case "13": // DUI
        limite = LIMITES.DUI;
        break;
      case "03": // Pasaporte
        limite = LIMITES.PASAPORTE;
        break;
      case "02": // Carnet de Residente
        limite = LIMITES.CARNETRESIDENTE;
        break;
      default:
        limite = LIMITES.NIT;
    }
    
    if (validarCampo('numeroDocumentoReceptor', valor, limite)) {
      setNumeroDocumentoReceptor(valor);
    }
  };

  const handleIdReceptor = (e) => {
    const valor = e.target.value;
    setIdReceptor(valor);
  }

 const selectCliente = (clienteSeleccionado) => {
    
    setTipoDocumentoReceptor(clienteSeleccionado.tipodocumento || "");
    
    let numeroDoc = "";
    switch (clienteSeleccionado.tipodocumento) {
      case "13": 
        numeroDoc = clienteSeleccionado.dui || "";
        break;
      case "36":
        numeroDoc = clienteSeleccionado.nit || "";
        break;
      case "03":
        numeroDoc = clienteSeleccionado.pasaporte || "";
        break;
      case "02":
        numeroDoc = clienteSeleccionado.carnetresidente || "";
        break;
      default:
        numeroDoc = clienteSeleccionado.nit || clienteSeleccionado.dui || clienteSeleccionado.pasaporte || clienteSeleccionado.carnetresidente || "";
    }
    
    setNumeroDocumentoReceptor(numeroDoc);
    setNombreReceptor(clienteSeleccionado.nombre || "");
    setDireccionReceptor(clienteSeleccionado.complemento || "");
    setCorreoReceptor(clienteSeleccionado.correo || "");
    setTelefonoReceptor(clienteSeleccionado.telefono || "");
    setSearchTerm("");
    setShowClientList(false);
    setIdReceptor(clienteSeleccionado.id || clienteSeleccionado.idcliente || null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Pestañas */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === "emisor" 
            ? "text-green-600 border-b-2 border-green-600" 
            : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("emisor")}
        >
          Datos del Emisor
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === "receptor" 
            ? "text-green-600 border-b-2 border-green-600" 
            : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("receptor")}
        >
          Datos del Receptor
        </button>
      </div>

      {/* Mostrar errores generales */}
      {Object.keys(errores).length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold mb-2">Errores de validación:</h3>
          <ul className="list-disc list-inside">
            {Object.entries(errores).map(([campo, mensaje]) => (
              <li key={campo}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contenido de las pestañas */}
      {activeTab === "emisor" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos del Emisor</h2>
          
          <div className="space-y-4">
            {/* Actividad Económica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actividad Económica
              </label>
              <select
                value={actividadEconomica}
                onChange={(e) => setActividadEconomica(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccione --</option>
                {actividadesEconomicas && actividadesEconomicas.map((actividad) => (
                  <option key={actividad.codigo} value={actividad.codigo}>
                    {actividad.codigo} - {actividad.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Establecimiento / Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={direccionEmisor}
                onChange={handleDireccionEmisorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.direccionEmisor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dirección completa"
                maxLength={LIMITES.COMPLEMENTO}
              />
              {errores.direccionEmisor && (
                <p className="text-red-500 text-xs mt-1">{errores.direccionEmisor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {direccionEmisor.length}/{LIMITES.COMPLEMENTO} caracteres
              </p>
            </div>

            {/* Correo electrónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={correoVendedor}
                onChange={handleCorreoVendedorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.correoVendedor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="correo@gmail.com"
                maxLength={LIMITES.CORREO}
              />
              {errores.correoVendedor && (
                <p className="text-red-500 text-xs mt-1">{errores.correoVendedor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {correoVendedor.length}/{LIMITES.CORREO} caracteres
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefonoEmisor}
                onChange={handleTelefonoEmisorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.telefonoEmisor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Número de teléfono"
                maxLength={LIMITES.TELEFONO}
              />
              {errores.telefonoEmisor && (
                <p className="text-red-500 text-xs mt-1">{errores.telefonoEmisor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {telefonoEmisor.length}/{LIMITES.TELEFONO} caracteres
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "receptor" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos del Receptor</h2>
          
          {/* Barra de búsqueda de clientes */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Cliente
            </label>
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por nombre, DUI, NIT..."
              />
              {loadingClientes && (
                <div className="absolute right-3 top-9">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            {/* Lista de clientes filtrados */}
            {showClientList && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredClientes.map((cliente) => (
                  <div
                    key={cliente.idcliente}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                    onClick={() => selectCliente(cliente)}
                  >
                    <div className="font-medium">{cliente.nombre}</div>
                    <div className="text-sm text-gray-600">
                      {cliente.dui && `DUI: ${cliente.dui}`}
                      {cliente.nit && `NIT: ${cliente.nit}`}
                      {cliente.pasaporte && `Pasaporte: ${cliente.pasaporte}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Documento de Identificación
              </label>
              <select
                value={tipoDocumentoReceptor}
                onChange={(e) => setTipoDocumentoReceptor(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccione --</option>
                <option value="36">NIT</option>
              </select>
            </div>

            {/* Número de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Documento
              </label>
              <input
                type="text"
                value={numeroDocumentoReceptor}
                onChange={handleNumeroDocumentoChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.numeroDocumentoReceptor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Número de documento"
                maxLength={
                  tipoDocumentoReceptor === "36" ? LIMITES.NIT :
                  tipoDocumentoReceptor === "13" ? LIMITES.DUI :
                  tipoDocumentoReceptor === "03" ? LIMITES.PASAPORTE :
                  tipoDocumentoReceptor === "02" ? LIMITES.CARNETRESIDENTE :
                  LIMITES.NIT
                }
              />
              {errores.numeroDocumentoReceptor && (
                <p className="text-red-500 text-xs mt-1">{errores.numeroDocumentoReceptor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {numeroDocumentoReceptor.length}/{
                  tipoDocumentoReceptor === "36" ? LIMITES.NIT :
                  tipoDocumentoReceptor === "13" ? LIMITES.DUI :
                  tipoDocumentoReceptor === "03" ? LIMITES.PASAPORTE :
                  tipoDocumentoReceptor === "02" ? LIMITES.CARNETRESIDENTE :
                  LIMITES.NIT
                } caracteres
              </p>
            </div>

            {/* Nombre del Receptor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre, denominación o razón social del contribuyente
              </label>
              <input
                type="text"
                value={nombreReceptor}
                onChange={handleNombreReceptorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.nombreReceptor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre completo del receptor"
                maxLength={LIMITES.NOMBRE}
              />
              {errores.nombreReceptor && (
                <p className="text-red-500 text-xs mt-1">{errores.nombreReceptor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {nombreReceptor.length}/{LIMITES.NOMBRE} caracteres
              </p>
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={direccionReceptor}
                onChange={handleDireccionReceptorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.direccionReceptor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dirección completa"
                maxLength={LIMITES.COMPLEMENTO}
              />
              {errores.direccionReceptor && (
                <p className="text-red-500 text-xs mt-1">{errores.direccionReceptor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {direccionReceptor.length}/{LIMITES.COMPLEMENTO} caracteres
              </p>
            </div>

            {/* Complemento 
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={complementoReceptor}
                onChange={handleComplementoReceptorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.complementoReceptor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite el complemento de la dirección"
                maxLength={LIMITES.COMPLEMENTO}
              />
              {errores.complementoReceptor && (
                <p className="text-red-500 text-xs mt-1">{errores.complementoReceptor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {complementoReceptor.length}/{LIMITES.COMPLEMENTO} caracteres
              </p>
            </div> */}

            {/* Correo electrónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={correoReceptor}
                onChange={handleCorreoReceptorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.correoReceptor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Correo del receptor"
                maxLength={LIMITES.CORREO}
              />
              {errores.correoReceptor && (
                <p className="text-red-500 text-xs mt-1">{errores.correoReceptor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {correoReceptor.length}/{LIMITES.CORREO} caracteres
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefonoReceptor}
                onChange={handleTelefonoReceptorChange}
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.telefonoReceptor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0000-0000"
                maxLength={LIMITES.TELEFONO}
              />
              {errores.telefonoReceptor && (
                <p className="text-red-500 text-xs mt-1">{errores.telefonoReceptor}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {telefonoReceptor.length}/{LIMITES.TELEFONO} caracteres
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatosEmisorReceptor;