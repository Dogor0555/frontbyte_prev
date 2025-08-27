"use client";
import { useState, useEffect } from "react";
import { 
  FaPlus, FaTrash, FaSave, FaPrint, FaFileDownload, 
  FaSearch, FaRegCalendarAlt, FaTags, FaUserEdit, 
  FaShoppingCart, FaInfoCircle, FaExclamationTriangle,
  FaBuilding 
} from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";

export default function CreditoFiscalViewComplete({ initialProductos = [], initialClientes = [], user }) {
  // Estados principales
  const [cliente, setCliente] = useState(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [nitCliente, setNitCliente] = useState("");
  const [nrcCliente, setNrcCliente] = useState("");
  const [condicionPago, setCondicionPago] = useState("Crédito 30 días");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [items, setItems] = useState([]);
  const [sumaopesinimpues, setSumaopesinimpues] = useState(0);
  const [totaldescuento, setTotaldescuento] = useState(0);
  const [ventasgrabadas, setVentasgrabadas] = useState(0);
  const [valoriva, setValoriva] = useState(0);
  const [total, setTotal] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [numeroCredito, setNumeroCredito] = useState(0);
  const [loadingCredito, setLoadingCredito] = useState(true);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [productosStockModificado, setProductosStockModificado] = useState([]);

  // Estados para datos
  const [clientes, setClientes] = useState(initialClientes);
  const [productos, setProductos] = useState(initialProductos);

  // Obtener último número de crédito
  const obtenerUltimoNumeroCredito = async () => {
    setLoadingCredito(true);
    try {
      const response = await fetch("http://localhost:3000/creditos/ultimo", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNumeroCredito(data.ultimoCredito !== undefined ? data.ultimoCredito + 1 : 1);
      } else {
        setNumeroCredito(1);
      }
    } catch (error) {
      console.error("Error al obtener último crédito:", error);
      setNumeroCredito(1);
    } finally {
      setLoadingCredito(false);
    }
  };

  // Detectar dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Inicializar número de crédito y fecha de vencimiento
  useEffect(() => {
    obtenerUltimoNumeroCredito();
    
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    setFechaVencimiento(nextMonth.toISOString().split("T")[0]);
  }, []);

  // Filtrar productos y clientes
  const productosFiltrados = productos.filter(p => 
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clientesFiltrados = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular totales
  useEffect(() => {
    const suma = items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const descuento = items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad * (item.descuento / 100)), 0);
    const gravadas = suma - descuento;
    const iva = gravadas * 0.13;
    const total = gravadas + iva;

    setSumaopesinimpues(suma);
    setTotaldescuento(descuento);
    setVentasgrabadas(gravadas);
    setValoriva(iva);
    setTotal(total);
  }, [items]);

  // Manejar selección de cliente
  const selectCliente = () => {
    setCliente(selectedClient);
    setNombreCliente(selectedClient.nombre);
    setNitCliente(selectedClient.nit);
    setNrcCliente(selectedClient.nrc || "");
    setSearchTerm("");
    setShowClientList(false);
    setShowClientDetails(false);
  };

  // Manejar cambios en items
  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = {...item, [field]: value};
        if (["cantidad", "precioUnitario", "descuento"].includes(field)) {
          updated.total = updated.cantidad * updated.precioUnitario * (1 - updated.descuento / 100);
        }
        return updated;
      }
      return item;
    }));
  };

  // Guardar crédito fiscal
  const handleSaveCredito = async () => {
    try {
      if (!cliente) {
        alert("Seleccione un cliente jurídico");
        return;
      }

      if (items.length === 0) {
        alert("Agregue al menos un producto");
        return;
      }

      const now = new Date();
      const fechaemision = now.toISOString().split('T')[0];
      const horaemision = now.toTimeString().split(' ')[0];

      const creditoData = {
        sellorec: `CRF-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        ncontrol: `DTE-CR-${now.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        modelofac: "03", // Modelo para crédito fiscal
        verjson: "1.0",
        tipotran: "01",
        fechaemision,
        horaemision,
        transaccioncontable: `TRX-CR-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        idpersonajuridica: cliente.id,
        tipoventa: "crédito",
        formapago: "crédito",
        estado: "pendiente",
        sumaopesinimpues,
        totaldescuento,
        valoriva,
        subtotal: ventasgrabadas + valoriva,
        ivapercibido: valoriva,
        montototalope: total,
        totalotrosmnoafectos: 0.00,
        totalapagar: total,
        valorletras: convertirNumeroAPalabras(total) + " dólares",
        detalles: items.map((item, index) => ({
          numitem: index + 1,
          idproducto: item.idproducto,
          cantidad: item.cantidad,
          descripcion: item.descripcion,
          descuento: item.descuento,
          ventasnosujetas: 0.00,
          ventasexentas: 0.00,
          ventasgrabadas: item.precioUnitario * item.cantidad * (1 - item.descuento / 100)
        }))
      };

      const response = await fetch("http://localhost:3000/creditos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify(creditoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar el crédito");
      }

      const result = await response.json();
      alert("Crédito fiscal creado exitosamente");
      
      if (result.advertenciaStock) {
        setProductosStockModificado(result.advertenciaStock.productos);
        setShowStockWarning(true);
      }

      // Reiniciar formulario
      setItems([]);
      setCliente(null);
      setNombreCliente("");
      setNitCliente("");
      setNrcCliente("");
      setObservaciones("");
      setSumaopesinimpues(0);
      setTotaldescuento(0);
      setVentasgrabadas(0);
      setValoriva(0);
      setTotal(0);

      // Actualizar número de crédito
      await obtenerUltimoNumeroCredito();

    } catch (error) {
      console.error("Error al guardar crédito:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Función para convertir número a palabras (simplificada)
  const convertirNumeroAPalabras = (num) => {
    const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];

    const entero = Math.floor(num);
    if (entero === 0) return 'cero';
    if (entero < 10) return unidades[entero];
    if (entero < 20) return especiales[entero - 11] || decenas[1] + (entero % 10 ? ' y ' + unidades[entero % 10] : '');
    if (entero < 100) return decenas[Math.floor(entero / 10)] + (entero % 10 ? ' y ' + unidades[entero % 10] : '');
    return 'mil';
  };

  // Formatear dinero
  const formatMoney = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      <div className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}>
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-br from-blue-50 to-gray-100 min-h-full p-6">
            <div className="max-w-6xl mx-auto">
              {/* Tarjeta principal */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 mb-8">
                {/* Encabezado */}
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold">Crédito Fiscal</h1>
                      <p className="text-blue-200 mt-1">Documento Tributario Electrónico</p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      {loadingCredito ? (
                        <p className="text-2xl font-bold">Cargando...</p>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">N° {String(numeroCredito).padStart(4, '0')}</p>
                          <p className="text-sm text-blue-200">Fecha: {new Date().toLocaleDateString()}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Datos de la transacción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Cliente Jurídico */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                      <div className="flex items-center mb-4">
                        <FaBuilding className="text-blue-800 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-800">Datos del Cliente Jurídico</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowClientList(true);
                              }}
                              className="w-full pl-10 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                              placeholder="Buscar por nombre o NIT"
                            />
                            {showClientList && searchTerm && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                                {clientesFiltrados.length > 0 ? (
                                  clientesFiltrados.map((cliente) => (
                                    <div
                                      key={cliente.id}
                                      onClick={() => {
                                        setSelectedClient(cliente);
                                        setShowClientDetails(true);
                                      }}
                                      className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="text-lg font-semibold text-blue-950">{cliente.nombre}</div>
                                      <div className="flex justify-between mt-1">
                                        <span className="text-sm bg-blue-800 text-gray-100 px-2 py-1 rounded">
                                          NIT: {cliente.nit}
                                        </span>
                                        {cliente.nrc && (
                                          <span className="text-sm bg-green-700 text-gray-100 px-2 py-1 rounded">
                                            NRC: {cliente.nrc}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-gray-500">
                                    No se encontraron clientes
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                          <input
                            type="text"
                            value={nombreCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                          <input
                            type="text"
                            value={nitCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">NRC</label>
                          <input
                            type="text"
                            value={nrcCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-black"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detalles del crédito */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                      <div className="flex items-center mb-4">
                        <FaRegCalendarAlt className="text-blue-800 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-800">Detalles del Crédito</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condición de Pago</label>
                          <select
                            value={condicionPago}
                            onChange={(e) => setCondicionPago(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          >
                            <option>Crédito 30 días</option>
                            <option>Crédito 60 días</option>
                            <option>Crédito 90 días</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                          <input
                            type="date"
                            value={fechaVencimiento}
                            onChange={(e) => setFechaVencimiento(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                          <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows="3"
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                            placeholder="Observaciones adicionales"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de productos */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex items-center mb-4">
                      <FaShoppingCart className="text-blue-800 mr-2" />
                      <h2 className="text-xl font-semibold text-gray-800">Productos/Servicios</h2>
                    </div>
                    
                    <div className="relative">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowProductList(true);
                            }}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                            placeholder="Buscar producto por código o nombre"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
                            setItems([...items, {
                              id: newId,
                              codigo: "",
                              nombre: "",
                              descripcion: "",
                              cantidad: 1,
                              precioUnitario: 0,
                              descuento: 0,
                              total: 0,
                              idproducto: null
                            }]);
                          }}
                          className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center"
                        >
                          <FaPlus className="mr-2" />
                          Agregar Manualmente
                        </button>
                      </div>

                      {/* Lista de productos */}
                      {showProductList && searchTerm && (
                        <div className="absolute z-50 mt-2 w-full">
                          <div className="bg-white rounded-xl shadow-lg border border-indigo-100/50 overflow-hidden">
                            {productosFiltrados.length > 0 ? (
                              <div className="max-h-64 overflow-y-auto divide-y divide-indigo-100/50">
                                {productosFiltrados.map((producto) => (
                                  <div
                                    key={producto.id}
                                    onClick={() => {
                                      const newItem = {
                                        id: items.length + 1,
                                        codigo: producto.codigo,
                                        nombre: producto.nombre,
                                        descripcion: producto.descripcion,
                                        cantidad: 1,
                                        precioUnitario: producto.precio,
                                        descuento: 0,
                                        total: producto.precio,
                                        idproducto: producto.id
                                      };
                                      setItems([...items, newItem]);
                                      setSearchTerm("");
                                      setShowProductList(false);
                                    }}
                                    className="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer group transition-colors duration-200"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                          {producto.codigo}
                                        </span>
                                      </div>
                                      <h3 className="text-lg font-bold text-indigo-900 truncate">
                                        {producto.nombre}
                                      </h3>
                                      <div className="text-teal-600 font-bold text-base">
                                        {formatMoney(producto.precio)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center bg-gray-50">
                                <div className="mb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-indigo-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-indigo-900 font-medium">No se encontraron productos</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabla de productos */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">Detalle de Productos/Servicios</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full border-collapse">
                          <thead className="sticky top-0 bg-gray-50 z-10">
                            <tr>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Nombre</th>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Código</th>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Descripción</th>
                              <th className="p-3 text-center font-semibold text-gray-700 border-b w-24">Cantidad</th>
                              <th className="p-3 text-right font-semibold text-gray-700 border-b w-32">Precio Unit.</th>
                              <th className="p-3 text-right font-semibold text-gray-700 border-b w-24">Desc. %</th>
                              <th className="p-3 text-right font-semibold text-gray-700 border-b w-32">Total</th>
                              <th className="p-3 border-b w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr 
                                key={item.id} 
                                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                              >
                                <td className="p-3 border-b">
                                  <input
                                    type="text"
                                    value={item.nombre}
                                    onChange={(e) => handleItemChange(item.id, "nombre", e.target.value)}
                                    className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <input
                                    type="text"
                                    value={item.codigo}
                                    onChange={(e) => handleItemChange(item.id, "codigo", e.target.value)}
                                    className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <textarea
                                    value={item.descripcion}
                                    onChange={(e) => handleItemChange(item.id, "descripcion", e.target.value)}
                                    className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={1}
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.cantidad}
                                    onChange={(e) => handleItemChange(item.id, "cantidad", parseInt(e.target.value) || 0)}
                                    className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-center"
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.precioUnitario}
                                    onChange={(e) => handleItemChange(item.id, "precioUnitario", parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-right"
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.descuento}
                                    onChange={(e) => handleItemChange(item.id, "descuento", parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-right"
                                  />
                                </td>
                                <td className="text-black p-3 border-b text-right font-medium">
                                  {formatMoney(item.total)}
                                </td>
                                <td className="p-3 border-b text-center">
                                  <button
                                    onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                    className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full"
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

                  {/* Totales y acciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Nota importante */}
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-300 shadow-md p-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 text-2xl">
                          <FaInfoCircle />
                        </span>
                        <h2 className="text-lg font-semibold text-gray-700">Documento Tributario</h2>
                      </div>
                      <p className="text-gray-600 text-sm text-center mt-2">
                        Este crédito fiscal es un documento legal. Verifique todos los datos antes de emitirlo.
                      </p>
                    </div>

                    {/* Totales */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm p-5">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Financiero</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between pb-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">Suma sin impuestos:</span>
                          <span className="text-gray-900">{formatMoney(sumaopesinimpues)}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">Total descuento:</span>
                          <span className="text-red-600">- {formatMoney(totaldescuento)}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">Ventas grabadas:</span>
                          <span className="text-gray-900">{formatMoney(ventasgrabadas)}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-200">
                          <span className="font-medium text-gray-700">IVA (13%):</span>
                          <span className="text-gray-900">{formatMoney(valoriva)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-blue-900">
                          <span>Total a pagar:</span>
                          <span>{formatMoney(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4 mt-8">
                    <button className="px-5 py-3 bg-white text-blue-800 font-medium rounded-lg border border-blue-300 shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center">
                      <FaPrint className="mr-2" />
                      Imprimir
                    </button>
                    <button className="px-5 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all duration-200 flex items-center justify-center">
                      <FaFileDownload className="mr-2" />
                      Exportar PDF
                    </button>
                    <button
                      onClick={handleSaveCredito}
                      className="px-5 py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center"
                    >
                      <FaSave className="mr-2" />
                      Emitir Crédito Fiscal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Pop-up de detalles del cliente */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-black text-xl font-semibold mb-4">Detalles del Cliente Jurídico</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Razón Social</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">NIT</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.nit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">NRC</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.nrc || "No registrado"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giro</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.giro || "No especificado"}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowClientDetails(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={selectCliente}
                className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de advertencia de stock */}
      {showStockWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-500 mr-2 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">Advertencia de Stock</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-3">Los siguientes productos han tenido cambios en su inventario:</p>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-black p-3 text-left border">Producto</th>
                      <th className="text-black p-3 text-left border">Código</th>
                      <th className="text-black p-3 text-left border">Stock Anterior</th>
                      <th className="text-black p-3 text-left border">Cantidad Vendida</th>
                      <th className="text-black p-3 text-left border">Nuevo Stock</th>
                      <th className="text-black p-3 text-left border">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosStockModificado.map((producto) => (
                      <tr key={producto.id} className="text-black border-b">
                        <td className="p-3 border font-medium">{producto.nombre}</td>
                        <td className="p-3 border">{producto.codigo}</td>
                        <td className="p-3 border">{producto.stockAnterior}</td>
                        <td className="p-3 border">{producto.cantidadVendida}</td>
                        <td className="p-3 border">
                          <span className={producto.stockNuevo < 0 ? "text-red-600 font-bold" : "font-medium"}>
                            {producto.stockNuevo}
                          </span>
                        </td>
                        <td className="p-3 border">
                          {producto.situacion === 'NEGATIVO' ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                              STOCK NEGATIVO
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                              STOCK EN CERO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                <strong>Nota:</strong> El crédito fiscal se ha generado correctamente, pero debe reponer el stock lo antes posible.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowStockWarning(false);
                  setProductosStockModificado([]);
                }}
                className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}