"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaSave, FaPrint, FaFileDownload, FaSearch, FaRegCalendarAlt, FaTags, FaUserEdit, FaShoppingCart, FaInfoCircle, FaExclamationTriangle, FaTimes, FaMoneyBill, FaPercent } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { useReactToPrint } from 'react-to-print';

export default function FacturacionViewComplete({ initialProductos = [], initialClientes = [], user }) {
  // Estados para la factura
  const [cliente, setCliente] = useState(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [documentoCliente, setDocumentoCliente] = useState("");
  const [condicionPago, setCondicionPago] = useState("Contado");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [items, setItems] = useState([]);
  const [sumaopesinimpues, setSumaopesinimpues] = useState(0);
  const [totaldescuento, setTotaldescuento] = useState(0);
  const [ventasgrabadas, setVentasgrabadas] = useState(0);
  const [valoriva, setValoriva] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "selector" | "producto" | "noAfecto" | "impuestos"
  const [clientes, setClientes] = useState(initialClientes);
  const [productos, setProductos] = useState(initialProductos);
  const [productosCargados, setProductosCargados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorCargaProductos, setErrorCargaProductos] = useState(null);
  
  const ticketRef = useRef();

  

  // Catálogo de unidades
  const [unidades, setUnidades] = useState([
    { codigo: "1", nombre: "metro" },
    { codigo: "2", nombre: "Yarda" },
    { codigo: "6", nombre: "milímetro" },
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

  // Obtener el último número de factura del usuario
  const obtenerUltimoNumeroFactura = async () => {
    try {
      const response = await fetch("http://localhost:3000/facturas/ultima", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const ultimoNumero = data.ultimaFactura !== undefined ? data.ultimaFactura + 1 : 1;
        setNumeroFactura(ultimoNumero);
      } else {
        setNumeroFactura(1);
      }
    } catch (error) {
      console.error("Error al obtener el último número de factura:", error);
      setNumeroFactura(1);
    }
  };

  // Detectar si el dispositivo es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Obtener el último número de factura al cargar el componente
  useEffect(() => {
    obtenerUltimoNumeroFactura();
  }, []);

  // Cargar productos cuando se abre el modal
  useEffect(() => {
    if (showModal && modalType === "producto") {
      const fetchProductos = async () => {
        setCargandoProductos(true);
        setErrorCargaProductos(null);
        
        try {
          const response = await fetch('http://localhost:3000/productos/getAll', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setProductosCargados(data);
          } else {
            const errorMsg = `Error ${response.status}: ${response.statusText}`;
            setErrorCargaProductos(errorMsg);
            console.error(errorMsg);
          }
        } catch (error) {
          const errorMsg = `Error de conexión: ${error.message}`;
          setErrorCargaProductos(errorMsg);
          console.error(errorMsg);
        } finally {
          setCargandoProductos(false);
        }
      };
      
      fetchProductos();
    }
  }, [showModal, modalType]);

  // Filtrar clientes según búsqueda
  const clientesFiltrados = Array.isArray(clientes) ? clientes.filter(
    (cliente) =>
      (cliente?.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.nit?.toString() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.dui?.toString() || "").includes(searchTerm.toLowerCase())
  ) : [];

  // Calcular totales cuando cambian los items
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

  // Mostrar detalles del cliente en un pop-up
  const showClientDetailsPopup = (cliente) => {
    setSelectedClient(cliente);
    setShowClientDetails(true);
  };

  // Seleccionar cliente después de ver sus detalles
  const selectCliente = () => {
    setCliente(selectedClient);
    setNombreCliente(selectedClient.nombre);
    
    // Determinar qué documento mostrar según el tipo
    if (selectedClient.tipodocumento === "13") {
      setDocumentoCliente(selectedClient.dui || "");
    } else if (selectedClient.tipodocumento === "36") {
      setDocumentoCliente(selectedClient.nit || "");
    } else if (selectedClient.tipodocumento === "03") {
      setDocumentoCliente(selectedClient.pasaporte || "");
    } else {
      setDocumentoCliente(selectedClient.nit || selectedClient.dui || selectedClient.pasaporte || "");
    }
    
    setSearchTerm("");
    setShowClientList(false);
    setShowClientDetails(false);
  };

  // Actualizar un item de la factura
  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "cantidad" || field === "precioUnitario" || field === "descuento") {
          const subtotalItem = updatedItem.cantidad * updatedItem.precioUnitario;
          updatedItem.total = subtotalItem * (1 - updatedItem.descuento / 100);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  // Eliminar un item de la factura
  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Inicializar fecha de vencimiento (30 días después)
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    setFechaVencimiento(nextMonth.toISOString().split("T")[0]);
  }, []);

  // Función para formatear valores monetarios
  const formatMoney = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Función para abrir modal de selección de tipo de detalle
  const openModalSelector = () => {
    setModalType("selector");
    setShowModal(true);
  };

  // Función para seleccionar tipo de detalle y abrir el modal correspondiente
  const selectTipoDetalle = (tipo) => {
    setModalType(tipo);
  };

  // Función para agregar item desde el modal
  const agregarItemDesdeModal = (tipo, datos) => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
    
    const newItem = {
      id: newId,
      tipo: tipo,
      ...datos,
      total: datos.cantidad * datos.precioUnitario * (1 - (datos.descuento || 0) / 100)
    };
    
    setItems([...items, newItem]);
    setShowModal(false);
    setModalType("");
    setProductoSeleccionado(null);
  };

  // Función para convertir código de unidad a texto
  const obtenerNombreUnidad = (codigoUnidad) => {
    const unidad = unidades.find(u => u.codigo === codigoUnidad.toString());
    return unidad ? unidad.nombre : "Unidad";
  };

  // Función para calcular el total del producto en el modal
  const calcularTotalProducto = () => {
    if (!productoSeleccionado) return;
    
    const cantidad = parseFloat(document.getElementById('cantidadProducto')?.value) || 1;
    const precio = parseFloat(productoSeleccionado.precio) || 0;
    const impuestoSelect = document.getElementById('impuestoProducto');
    const tasaImpuesto = impuestoSelect.value === "20" ? 0.13 : impuestoSelect.value === "21" ? 0.15 : 0;
    
    const subtotal = cantidad * precio;
    const impuesto = subtotal * tasaImpuesto;
    const total = subtotal + impuesto;
    
    document.getElementById('totalProducto').textContent = `$${total.toFixed(2)}`;
  };

  // Función para manejar la selección de producto
  const handleSeleccionProducto = (productoId) => {
    const producto = productosCargados.find(p => p.id === parseInt(productoId));
    if (producto) {
      setProductoSeleccionado(producto);
      
      // Calcular total inicial
      setTimeout(() => {
        calcularTotalProducto();
      }, 100);
    }
  };

  // Renderizado del componente
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}>
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Facturación</h1>
              <p className="text-gray-600">Sistema de facturación electrónica</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-lg font-semibold text-blue-800">N° {String(numeroFactura).padStart(4, '0')}</p>
              <p className="text-sm text-blue-600">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        {/* Contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            {/* Tarjeta principal */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* Datos del cliente */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos del Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowClientList(true);
                        }}
                        className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Buscar cliente"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                    <input
                      type="text"
                      value={documentoCliente}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={nombreCliente}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condición de Pago</label>
                    <select
                      value={condicionPago}
                      onChange={(e) => setCondicionPago(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option>Contado</option>
                      <option>Crédito 30 días</option>
                      <option>Crédito 60 días</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Detalle de Factura */}
              <div className="text-black mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Detalle de Factura</h2>
                  <button
                    onClick={openModalSelector}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    <FaPlus className="mr-2" />
                    Agregar Detalle
                  </button>
                </div>

                {/* Tabla de items */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Unidad de Medida</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Descripción</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Cantidad</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Precio</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Sub Total</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-4 text-center text-gray-500 border-b">
                            No hay items agregados. Haga clic en "Agregar Detalle" para comenzar.
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 border-b">
                              <span className="text-sm">
                                {item.unidadMedida} - {obtenerNombreUnidad(item.unidadMedida)}
                              </span>
                            </td>
                            <td className="px-4 py-2 border-b">
                              <input
                                type="text"
                                value={item.descripcion}
                                onChange={(e) => handleItemChange(item.id, "descripcion", e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-2 border-b">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleItemChange(item.id, "cantidad", parseFloat(e.target.value))}
                                className="w-20 p-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-2 border-b">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precioUnitario}
                                onChange={(e) => handleItemChange(item.id, "precioUnitario", parseFloat(e.target.value))}
                                className="w-24 p-1 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-2 font-medium border-b">
                              {formatMoney(item.total)}
                            </td>
                            <td className="px-4 py-2 border-b">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Retención IVA:</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Retención Renta:</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-700 font-semibold">Sub Total:</span>
                      <span className="font-semibold">{formatMoney(sumaopesinimpues)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monto Total de la operación:</span>
                      <span className="font-medium">{formatMoney(ventasgrabadas)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-900 font-bold text-lg">Total a pagar:</span>
                      <span className="text-blue-800 font-bold text-lg">{formatMoney(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Agregar Descuentos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Agregar Descuentos</h3>
                <button className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
                  <FaTags className="mr-2" />
                  Agregar Descuentos
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4">
                <button className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                  <FaSave className="mr-2" />
                  Guardar Factura
                </button>
                <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  <FaPrint className="mr-2" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Modal Selector de Tipo de Detalle */}
      {showModal && modalType === "selector" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Detalle</h2>
            <p className="text-gray-600 mb-6">Seleccione el tipo de detalle que desea agregar:</p>
            
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => selectTipoDetalle("producto")}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <FaShoppingCart className="text-blue-800" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Producto o Servicio</h3>
                    <p className="text-sm text-gray-500">Agregar un producto o servicio</p>
                  </div>
                </div>
                <FaPlus className="text-blue-800" />
              </button>

              <button
                onClick={() => selectTipoDetalle("noAfecto")}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <FaMoneyBill className="text-green-800" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Monto No Afecto</h3>
                    <p className="text-sm text-gray-500">Agregar un monto no afecto</p>
                  </div>
                </div>
                <FaPlus className="text-green-800" />
              </button>

              <button
                onClick={() => selectTipoDetalle("impuestos")}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <FaPercent className="text-purple-800" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Impuestos/Tasas</h3>
                    <p className="text-sm text-gray-500">Agregar impuestos o tasas</p>
                  </div>
                </div>
                <FaPlus className="text-purple-800" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Producto o Servicio */}
      {showModal && modalType === "producto" && (
        <div className="text-black fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col">
            {/* Encabezado */}
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold">Agregar Producto o Servicio</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setProductoSeleccionado(null);
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaTimes size={22} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
                {/* Columna izquierda - Información básica del producto */}
                <div className="space-y-5">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">Item DTE</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo:</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="1">1 - Bien</option>
                      <option value="2">2 - Servicio</option>
                      <option value="3">3 - Bien y Servicio</option>              
                    </select>
                  </div>
                  
                  {/* Cantidad y Unidad */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        defaultValue="1"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        id="cantidadProducto"
                        onChange={calcularTotalProducto}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Unidad</label>
                      <input
                        type="text"
                        id="unidadProducto"
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={productoSeleccionado ? obtenerNombreUnidad(productoSeleccionado.unidad) : "Unidad"}
                      />
                    </div>
                  </div>
                  
                  {/* Campos para nombre y precio (solo lectura) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre Producto</label>
                    <input
                      type="text"
                      id="nombreProducto"
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={productoSeleccionado ? productoSeleccionado.nombre : ""}
                      placeholder="Seleccione un producto"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Precio</label>
                    <input
                      type="text"
                      id="precioProducto"
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={productoSeleccionado ? `$${parseFloat(productoSeleccionado.precio).toFixed(2)}` : "$0.00"}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo Venta</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="1">Gravado</option>
                      <option value="2">Exento</option>
                      <option value="3">No sujeto</option>
                    </select>
                  </div>
                </div>

                {/* Columna central - BUSCADOR DE PRODUCTOS */}
                <div className="space-y-5">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">Buscar Producto</h3>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        Seleccionar Producto
                      </label>
                      <span className="text-xs text-red-600">Requerido</span>
                    </div>
                    
                    {/* Campo de búsqueda */}
                    <div className="relative mb-3">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Escriba al menos 2 caracteres para buscar..."
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                          // Actualizar término de búsqueda
                          const searchValue = e.target.value.toLowerCase();
                          setSearchTerm(searchValue);
                        }}
                      />
                    </div>
                    
                    {cargandoProductos && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Cargando productos...</p>
                      </div>
                    )}
                    
                    {errorCargaProductos && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="text-sm">Error: {errorCargaProductos}</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="text-red-600 underline text-xs mt-1"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                    
                    {/* Lista de productos filtrados - Solo se muestra cuando hay búsqueda */}
                    {searchTerm && searchTerm.length >= 2 ? (
                      <div className="border border-gray-300 rounded-lg h-96 overflow-y-auto">
                        {productosCargados
                          .filter(producto => 
                            producto.nombre.toLowerCase().includes(searchTerm) || 
                            producto.codigo.toLowerCase().includes(searchTerm)
                          )
                          .map((producto) => (
                            <div 
                              key={producto.id}
                              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                                productoSeleccionado?.id === producto.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                              }`}
                              onClick={() => {
                                setProductoSeleccionado(producto);
                                calcularTotalProducto();
                              }}
                            >
                              <div className="font-medium text-gray-900">{producto.nombre}</div>
                              <div className="text-sm text-gray-600 flex justify-between mt-1">
                                <span>Código: {producto.codigo}</span>
                                <span className="font-semibold text-green-600">${parseFloat(producto.precio).toFixed(2)}</span>
                              </div>
                            </div>
                          ))
                        }
                        
                        {/* Mensaje si no hay resultados de búsqueda */}
                        {productosCargados.filter(producto => 
                          producto.nombre.toLowerCase().includes(searchTerm) || 
                          producto.codigo.toLowerCase().includes(searchTerm)
                        ).length === 0 && (
                          <div className="p-6 text-center text-gray-500">
                            <FaSearch className="mx-auto mb-2 text-2xl text-gray-400" />
                            <p>No se encontraron productos</p>
                            <p className="text-xs mt-1">con el término "{searchTerm}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Estado inicial - instrucciones de búsqueda */
                      <div className="border border-gray-200 rounded-lg h-96 bg-gray-50 flex items-center justify-center">
                        <div className="text-center text-gray-500 px-6">
                          <FaSearch className="mx-auto mb-4 text-4xl text-gray-300" />
                          <h4 className="text-lg font-medium text-gray-700 mb-2">Buscar Productos</h4>
                          <p className="text-sm mb-2">Escriba al menos 2 caracteres para comenzar la búsqueda</p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>• Puede buscar por nombre del producto</p>
                            <p>• O por código del producto</p>
                            <p>• Los resultados aparecerán automáticamente</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna derecha - Información de tributos y totales */}
                <div className="space-y-5">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">Información de tributos</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Impuesto:</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={calcularTotalProducto}
                      id="impuestoProducto"
                    >
                      <option value="20">20 - Impuesto al Valor Agregado 13%</option>
                      <option value="59">59 - Turismo: por alojamiento (5%)</option>
                      <option value="71">71 - Turismo: salida del país por vía aérea $7.00</option>
                      <option value="D1">D1 - FOVIAL ($0.20 Ctvs. por galón)</option>
                      <option value="C8">C8 - COTRANS ($0.10 Ctvs. por galón)</option>
                      <option value="D5">D5 - Otras tasas casos especiales</option>
                      <option value="D4">D4 - Otros impuestos casos especiales</option>
                      <option value="C5">C5 - Impuesto ad- valorem por diferencial de precios de Bebidas Alcohólicas (8%)</option>
                      <option value="C6">C6 - Impuesto ad- valorem por diferencial de precios al tabaco cigarrillos (39%)</option>
                      <option value="C7">C7 - Impuesto ad- valorem por diferencial de precios al tabaco cigarros (100%)</option>
                      <option value="19">19 - Fabricante de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulante</option>
                      <option value="28">28 - Importador de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                      <option value="31">31 - Detallistas o Expendedores de Bebidas Alcohólicas</option>
                      <option value="32">32 - Fabricante de Cerveza</option>
                      <option value="33">33 - Importador de Cerveza</option>
                      <option value="34">34 - Fabricante de Productos de Tabaco</option>
                      <option value="35">35 - Importador de Productos de Tabaco</option>
                      <option value="36">36 - Fabricante de Armas de Fuego, Municiones y Artículos. Similares</option>
                      <option value="37">37 - Importador de Arma de Fueg,Munición y Artis. Simil</option>
                      <option value="38">38 - Fabricante de Explosivos</option>
                      <option value="39">39 - Importador de Explosivos</option>
                      <option value="42">42 - Fabricante de Productos Pirotécnicos</option>
                      <option value="43">43 - Importador de Productos Pirotécnicos</option>
                      <option value="44">44 - Productor de Tabaco</option>
                      <option value="50">50 - Distribuidor de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                      <option value="51">51 - Bebidas Alcohólicas</option>
                      <option value="52">52 - Cerveza</option>
                      <option value="53">53 - Productos del Tabaco</option>
                      <option value="54">54 - Bebidas Carbonatadas o Gaseosas Simples o Endulzadas</option>
                      <option value="55">55 - Otros Específicos</option>
                      <option value="58">58 - Alcohol</option>
                      <option value="77">77 - Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                      <option value="78">78 - Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                      <option value="79">79 - Sobre Llamadas Telefónicas Provenientes del Ext.</option>
                      <option value="85">85 - Detallista de Jugos, Néctares, Bebidas con Jugo и Refrescos</option>
                      <option value="86">86 - Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                      <option value="91">91 - Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                      <option value="92">92 - Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                      <option value="A1">A1 - Específicos y Ad-valorem</option>
                      <option value="A5">A5 - Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes</option>
                      <option value="A7">A7 - Alcohol Etílico</option>
                      <option value="A9">A9 - Sacos Sintéticos</option>
                    </select>
                  </div>
                  
                  {/* Resumen de totales */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-center">Resumen del Item</h4>
                    
                    <div className="space-y-3">
                     
                      
                      <div className="flex justify-between py-2">
                        <span className="text-gray-700">Descuento:</span>
                        <span className="font-semibold text-gray-900" id="descuentoProducto">$0.00</span>
                      </div>
                      
                      <div className="flex justify-between py-2">
                        <span className="text-gray-700">IVA:</span>
                        <span className="font-semibold text-gray-900" id="ivaProducto">$0.00</span>
                      </div>
                      
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-gray-900">Total:</span>
                          <span className="text-xl font-bold text-blue-700" id="totalProducto">$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información del producto seleccionado */}
                  {productoSeleccionado && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Producto Seleccionado</h4>
                      <p className="text-sm text-green-700">
                        <strong>{productoSeleccionado.nombre}</strong>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Código: {productoSeleccionado.codigo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setProductoSeleccionado(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors flex items-center mb-3 sm:mb-0"
                >
                  <FaTimes className="mr-2" />
                  Cancelar
                </button>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setModalType("selector")}
                    className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Agregar Documentos
                  </button>
                  <button
                    onClick={() => {
                      if (!productoSeleccionado) {
                        alert("Por favor seleccione un producto");
                        return;
                      }
                      
                      const cantidad = parseFloat(document.getElementById('cantidadProducto').value) || 1;
                      const precio = parseFloat(productoSeleccionado.precio) || 0;
                      
                      agregarItemDesdeModal("producto", {
                        descripcion: productoSeleccionado.nombre,
                        cantidad: cantidad,
                        precioUnitario: precio,
                        descuento: 0,
                        unidadMedida: productoSeleccionado.unidad || "9"
                      });
                    }}
                    className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center shadow-md"
                  >
                    <FaPlus className="mr-2" />
                    Agregar Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Monto No Afecto */}
      {showModal && modalType === "noAfecto" && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col">
            {/* Encabezado */}
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold">Item DTE</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalType("");
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaTimes size={22} />
              </button>
            </div>

            {/* Subtítulo */}
            <div className="px-6 pt-4 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800">Adición detalle de DTE</h3>
            </div>

            {/* Contenido principal */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-6 text-xl">Otros montos No Afectos</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Columna izquierda - Descripción */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-lg font-semibold text-gray-900">Descripción</label>
                      <span className="text-sm text-red-600 font-medium">Requerido</span>
                    </div>
                    <input
                      type="text"
                      id="descripcionNoAfecto"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="Descripción"
                    />
                  </div>
                  
                  {/* Columna derecha - Monto */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-lg font-semibold text-gray-900">Monto</label>
                      <span className="text-sm text-red-600 font-medium">Requerido</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="montoNoAfecto"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="Monto"
                      onChange={(e) => {
                        // Calcular automáticamente los totales
                        const monto = parseFloat(e.target.value) || 0;
                        document.getElementById('subtotalNoAfecto').textContent = monto.toFixed(2);
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setModalType("");
                  }}
                  className="px-8 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center"
                >
                  <FaTimes className="mr-2" />
                  Cancelar
                </button>
                
                <button
                  onClick={() => {
                    // Lógica para agregar el monto no afecto
                    const descripcion = document.getElementById('descripcionNoAfecto').value.trim();
                    const monto = parseFloat(document.getElementById('montoNoAfecto').value) || 0;
                    
                    if (!descripcion || monto <= 0) {
                      alert("Por favor complete todos los campos requeridos");
                      return;
                    }
                    
                    // Agregar con unidad de medida 99 (Otra)
                    agregarItemDesdeModal("noAfecto", {
                      descripcion: descripcion,
                      cantidad: 1,
                      precioUnitario: monto,
                      descuento: 0,
                      unidadMedida: "99" // Unidad de medida para "Otra"
                    });
                  }}
                  className="px-10 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center shadow-md"
                >
                  <FaPlus className="mr-2" />
                  Agregar Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Impuestos/Tasas */}
      {showModal && modalType === "impuestos" && (
        <div className="text-black fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-auto">
            {/* Encabezado */}
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">Item DTE</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalType("");
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaTimes size={22} />
              </button>
            </div>

            {/* Contenido principal */}
            <div className="p-6">
              {/* Subtítulo */}
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Adición detalle de DTE</h3>

              {/* Impuestos/Tasas con afección al IVA */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Impuestos/Tasas con afección al IVA</h4>
                
                {/* Impuesto */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Impuesto</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Otros impuestos casos especiales</option>
                    <option value="19">19 - Fabricante de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulante</option>
                    <option value="20">20 - Impuesto al Valor Agregado 13%</option>
                    <option value="28">28 - Importador de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                    <option value="31">31 - Detallistas o Expendedores de Bebidas Alcohólicas</option>
                    <option value="32">32 - Fabricante de Cerveza</option>
                    <option value="33">33 - Importador de Cerveza</option>
                    <option value="34">34 - Fabricante de Productos de Tabaco</option>
                    <option value="35">35 - Importador de Productos de Tabaco</option>
                    <option value="36">36 - Fabricante de Armas de Fuego, Municiones y Artículos. Similares</option>
                    <option value="37">37 - Importador de Arma de Fueg,Munición y Artis. Simil</option>
                    <option value="38">38 - Fabricante de Explosivos</option>
                    <option value="39">39 - Importador de Explosivos</option>
                    <option value="42">42 - Fabricante de Productos Pirotécnicos</option>
                    <option value="43">43 - Importador de Productos Pirotécnicos</option>
                    <option value="44">44 - Productor de Tabaco</option>
                    <option value="50">50 - Distribuidor de Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizante o Estimulante</option>
                    <option value="51">51 - Bebidas Alcohólicas</option>
                    <option value="52">52 - Cerveza</option>
                    <option value="53">53 - Productos del Tabaco</option>
                    <option value="54">54 - Bebidas Carbonatadas o Gaseosas Simples o Endulzadas</option>
                    <option value="55">55 - Otros Específicos</option>
                    <option value="58">58 - Alcohol</option>
                    <option value="59">59 - Turismo: por alojamiento (5%)</option>
                    <option value="71">71 - Turismo: salida del país por vía aérea $7.00</option>
                    <option value="77">77 - Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                    <option value="78">78 - Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                    <option value="79">79 - Sobre Llamadas Telefónicas Provenientes del Ext.</option>
                    <option value="85">85 - Detallista de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                    <option value="86">86 - Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                    <option value="91">91 - Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos</option>
                    <option value="92">92 - Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas</option>
                    <option value="A1">A1 - Específicos y Ad-valorem</option>
                    <option value="A5">A5 - Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes</option>
                    <option value="A7">A7 - Alcohol Etílico</option>
                    <option value="A9">A9 - Sacos Sintéticos</option>
                    <option value="C5">C5 - Impuesto ad- valorem por diferencial de precios de Bebidas Alcohólicas (8%)</option>
                    <option value="C6">C6 - Impuesto ad- valorem por diferencial de precios al tabaco cigarrillos (39%)</option>
                    <option value="C7">C7 - Impuesto ad- valorem por diferencial de precios al tabaco cigarros (100%)</option>
                    <option value="C8">C8 - COTRANS ($0.10 Ctvs. por galón)</option>
                    <option value="D1">D1 - FOVIAL ($0.20 Ctvs. por galón)</option>
                    <option value="D4">D4 - Otros impuestos casos especiales</option>
                    <option value="D5">D5 - Otras tasas casos especiales</option>
                  </select>
                </div>
                
                {/* Grid de descripción y monto */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <input
                      type="text"
                      id="descripcionImpuesto"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción"
                    />
                  </div>
                </div>
                
                {/* Grid de Monto y Tipo */}
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="montoImpuesto"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Monto"
                    />
                    <span className="text-xs text-red-600">Requerido.</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select 
                      id="tipoImpuesto"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gravado">Gravado</option>
                      <option value="exento">Exento</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setModalType("");
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const descripcion = document.getElementById('descripcionImpuesto').value.trim();
                    const monto = parseFloat(document.getElementById('montoImpuesto').value) || 0;
                    const tipo = document.getElementById('tipoImpuesto').value;
                    
                    if (!descripcion || monto <= 0) {
                      alert("Por favor complete todos los campos requeridos");
                      return;
                    }
                    
                    // Agregar con unidad de medida 99 (Otra)
                    agregarItemDesdeModal("impuestos", {
                      descripcion: descripcion,
                      cantidad: 1,
                      precioUnitario: monto,
                      descuento: 0,
                      unidadMedida: "99",
                      tipo: tipo
                    });
                  }}
                  className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Agregar Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de lista de clientes */}
      {showClientList && searchTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Cliente</h2>
            <div className="max-h-60 overflow-y-auto">
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => showClientDetailsPopup(cliente)}
                    className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-medium">{cliente.nombre}</div>
                    <div className="text-sm text-gray-600">
                      {cliente.nit || cliente.dui || "Sin documento"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No se encontraron clientes
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowClientList(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de detalles del cliente */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Cliente</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">{selectedClient.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Documento</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">
                  {selectedClient.nit || selectedClient.dui || "N/A"}
                </p>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}