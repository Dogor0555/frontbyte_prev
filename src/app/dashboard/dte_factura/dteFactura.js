"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaSave, FaPrint, FaFileDownload, FaSearch, FaRegCalendarAlt, FaTags, FaUserEdit, FaShoppingCart, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { useReactToPrint } from 'react-to-print';

export default function FacturacionViewComplete({ initialProductos = [], initialClientes = [], user }) {
  // Estados para la factura
  const [cliente, setCliente] = useState(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [correoCliente, setCorreoCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [documentoCliente, setDocumentoCliente] = useState("");
  const [condicionPago, setCondicionPago] = useState("Contado");
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
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState(0);
  const [loadingFactura, setLoadingFactura] = useState(true);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [productosStockModificado, setProductosStockModificado] = useState([]);
  const ticketRef = useRef();
  

  // Estados para unidades de medida
  const [unidades, setUnidades] = useState([
    { codigo: "1", nombre: "metro" },
    { codigo: "2", nombre: "Yarda" },
    { codigo: "6", nombre: "milímetro" },
    { codigo: "9", nombre: "kilómetro cuadrado" },
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

   
  // Función para imprimir el ticket
 const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    pageStyle: `
      @page {
        size: 80mm 200mm;
        margin: 0;
      }
      body {
        padding: 0;
        margin: 0;
      }
      .ticket-container {
        width: 80mm;
        padding: 10px;
      }
    `,
    onAfterPrint: () => console.log("Impresión completada")
  });
  // Función para obtener el nombre de la unidad por su código
  const getNombreUnidad = (codigo) => {
    if (!codigo) return "No especificado";
    
    if (typeof codigo === 'string' && codigo.length > 3 && !/^\d+$/.test(codigo)) {
      return codigo;
    }
    
    const codigoNormalizado = codigo.toString().trim();
    const unidadEncontrada = unidades.find(u => u.codigo === codigoNormalizado);
    
    return unidadEncontrada ? unidadEncontrada.nombre : `Unidad (${codigoNormalizado})`;
  };

  // Función para formatear valores monetarios
  const formatMoney = (value) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Estados para clientes y productos
  const [clientes, setClientes] = useState(initialClientes);
  const [productos, setProductos] = useState(initialProductos);

  // Obtener el último número de factura del usuario
  const obtenerUltimoNumeroFactura = async () => {
    setLoadingFactura(true);
    try {
      const response = await fetch("http://localhost:3000/facturas/ultima", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const ultimoNumero = data.ultimaFactura !== undefined ? data.ultimaFactura + 1 : 1;
        setNumeroFactura(ultimoNumero);
      } else {
        console.error("Error en la respuesta del servidor:", response.status);
        setNumeroFactura(1);
      }
    } catch (error) {
      console.error("Error al obtener el último número de factura:", error);
      setNumeroFactura(1);
    } finally {
      setLoadingFactura(false);
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

  // Filtrar productos según búsqueda
  const productosFiltrados = productos.filter(
    (producto) =>
      (producto?.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (producto?.descripcion?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (producto?.codigo?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Filtrar clientes según búsqueda
  const clientesFiltrados = clientes.filter(
    (cliente) =>
      (cliente?.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.documento?.toString() || "").includes(searchTerm.toLowerCase())
  );

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
    setCorreoCliente(selectedClient.correo || "");
    setTelefonoCliente(selectedClient.telefono || "");
    setDocumentoCliente(selectedClient.documento?.toString() || "");
    setSearchTerm("");
    setShowClientList(false);
    setShowClientDetails(false);
  };

  // Mostrar detalles del producto en un pop-up
  const showProductDetailsPopup = (producto) => {
    setSelectedProduct(producto);
    setShowProductDetails(true);
  };

  // Seleccionar producto después de ver sus detalles
  const selectProduct = () => {
    const newItem = {
      id: items.length + 1,
      codigo: selectedProduct.codigo,
      nombre: selectedProduct.nombre,
      descripcion: selectedProduct.descripcion,
      cantidad: 1,
      precioUnitario: selectedProduct.precio,
      descuento: 0,
      total: selectedProduct.precio,
      idproducto: selectedProduct.id,
      unidad: selectedProduct.unidad
    };
    setItems([...items, newItem]);
    setSearchTerm("");
    setShowProductList(false);
    setShowProductDetails(false);
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

  // Agregar nuevo item
  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
    setItems([
      ...items,
      {
        id: newId,
        codigo: "",
        nombre: "",
        descripcion: "",
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        total: 0,
        idproducto: null,
        unidad: ""
      },
    ]);
  };

  // Inicializar fecha de vencimiento (30 días después)
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    setFechaVencimiento(nextMonth.toISOString().split("T")[0]);
  }, []);

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

    if (entero < 1000) {
      const centenas = Math.floor(entero / 100);
      const resto = entero % 100;
      let palabras = centenas === 1 ? 'ciento' : unidades[centenas] + 'cientos';
      if (resto) palabras += ' ' + convertirNumeroAPalabras(resto);
      return palabras;
    }

    return 'mil';
  };

  // Componente del ticket de impresión
 const TicketPrint = () => {
  const [fechaActual, setFechaActual] = useState("");
  const [fechaDevolucion, setFechaDevolucion] = useState("");

  useEffect(() => {
    // Esto solo se ejecuta en el cliente
    const today = new Date();
    const devolucion = new Date();
    devolucion.setDate(today.getDate() + 3);
    
    setFechaActual(today.toLocaleDateString());
    setFechaDevolucion(devolucion.toLocaleDateString());
  }, []);

  // Función segura para formatear precios
  const formatPrice = (price) => {
    // Convertir a número si es string
    const numericPrice = typeof price === 'string' 
      ? parseFloat(price.replace(',', '.')) 
      : Number(price);
    
    // Verificar si es un número válido
    return isNaN(numericPrice) 
      ? '0.00€' 
      : numericPrice.toFixed(2) + '€';
  };

  return (
    <div className="ticket-container p-4 bg-white text-black max-w-xs mx-auto font-mono">
      {/* Encabezado */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{user.nombre || "MiTienda.com"}</h1>
        <p className="text-sm">C.I.F.: {user.nit || "01234567A"}</p>
        <p className="text-sm">{user.direccion || "C/ Principal, 123"}</p>
        <p className="text-sm">{user.telefono || "999 888 777"}</p>
        <p className="text-sm">{user.correo || "contacto@mitienda.com"}</p>
      </div>

      {/* Datos de la factura */}
      <div className="border-t border-b border-black py-2 my-2">
        <p className="text-sm">Factura Simpl.: FAC-{numeroFactura.toString().padStart(6, '0')}</p>
        {fechaActual && <p className="text-sm">Fecha: {fechaActual}</p>}
        <p className="text-sm">Método de pago: {condicionPago}</p>
      </div>

      {/* Tabla de artículos */}
      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Artículo</th>
            <th className="text-right py-1">Ud</th>
            <th className="text-right py-1">Precio</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const precioUnitario = typeof item.precioUnitario === 'number' 
              ? item.precioUnitario 
              : parseFloat(item.precioUnitario) || 0;
            
            const total = precioUnitario * (item.cantidad || 0);
            
            return (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-1">{item.nombre}</td>
                <td className="text-right py-1">{item.cantidad}</td>
                <td className="text-right py-1">{formatPrice(item.precioUnitario)}</td>
                <td className="text-right py-1">{formatPrice(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totales */}
      <div className="border-t border-black pt-2 mb-4">
        <div className="flex justify-between">
          <span>TOTAL SIN I.V.A.</span>
          <span>{formatPrice(sumaopesinimpues)}</span>
        </div>
        <div className="flex justify-between">
          <span>I.V.A. 21%</span>
          <span>{formatPrice(valoriva)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Pie de página */}
      <div className="text-center text-xs">
        <p className="border-t border-black pt-2">
          EL PERÍODO DE DEVOLUCIONES<br />
          {fechaDevolucion && `CADUCA EL DÍA ${fechaDevolucion}`}
        </p>
      </div>
    </div>
  );
};

    // Guardar factura en el formato que espera el backend
  const handleSaveInvoice = async () => {
    try {
      if (!cliente) {
        alert("Por favor, selecciona un cliente.");
        return;
      }

      if (items.length === 0) {
        alert("Por favor, agrega al menos un producto a la factura.");
        return;
      }

      const now = new Date();
      const fechaemision = now.toISOString().split('T')[0];
      const horaemision = now.toTimeString().split(' ')[0];

      const facturaData = {
        sellorec: `FAC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        ncontrol: `DTE-${now.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        modelofac: "01",
        verjson: "1.0",
        tipotran: "01",
        fechaemision,
        horaemision,
        transaccioncontable: `TRX-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        idpersonanatural: cliente.id,
        tipoventa: condicionPago.toLowerCase().includes("crédito") ? "crédito" : "contado",
        formapago: "tarjeta",
        estado: "activo",
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
          ventasgrabadas: item.precioUnitario * item.cantidad * (1 - item.descuento / 100),
          unidad: item.unidad
        }))
      };

      const response = await fetch("http://localhost:3000/facturas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify(facturaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar la factura");
      }

      const result = await response.json();
      
      alert("Factura creada exitosamente");
      
      if (result.advertenciaStock) {
        setProductosStockModificado(result.advertenciaStock.productos);
        setShowStockWarning(true);
      }

      if (result.factura && result.factura.numero) {
        setNumeroFactura(result.factura.numero);
      } else {
        setNumeroFactura(prev => prev + 1);
      }

      setItems([]);
      setCliente(null);
      setNombreCliente("");
      setCorreoCliente("");
      setTelefonoCliente("");
      setDocumentoCliente("");
      setCondicionPago("Contado");
      setObservaciones("");
      setSumaopesinimpues(0);
      setTotaldescuento(0);
      setVentasgrabadas(0);
      setValoriva(0);
      setTotal(0);

      await obtenerUltimoNumeroFactura();

    } catch (error) {
      console.error("Error al guardar la factura:", error);
      alert(`Error al guardar la factura: ${error.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay para móviles */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}
      >
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-br from-blue-50 to-gray-100 min-h-full p-6">
            <div className="max-w-6xl mx-auto">
              {/* Tarjeta principal */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 mb-8">
                {/* Encabezado */}
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold">Factura Electrónica</h1>
                      <p className="text-blue-200 mt-1">Sistema de Facturación Electrónica</p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      {loadingFactura ? (
                        <p className="text-2xl font-bold">Cargando...</p>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">N° {String(numeroFactura).padStart(4, '0')}</p>
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
                    {/* Cliente */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                      <div className="flex items-center mb-4">
                        <FaUserEdit className="text-blue-800 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-800">Datos del Cliente</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
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
                              className="w-full pl-10 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                              placeholder="Buscar cliente por nombre o documento"
                            />
                            {showClientList && searchTerm && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                                {clientesFiltrados.length > 0 ? (
                                  clientesFiltrados.map((cliente) => (
                                    <div
                                      key={cliente.id}
                                      onClick={() => showClientDetailsPopup(cliente)}
                                      className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="text-lg font-semibold text-blue-950">{cliente.nombre}</div>
                                      <div className="mt-1">
                                        <span className="inline-flex items-center text-sm bg-blue-800 text-gray-100 px-3 py-1 rounded-full">
                                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                          </svg>
                                          {cliente.documento ? cliente.documento.toString() : "Sin documento"}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-gray-500 flex flex-col items-center">
                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>No se encontraron clientes</span>
                                    <span className="text-xs mt-1">Intenta con otro término de búsqueda</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={nombreCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                          <input
                            type="text"
                            value={documentoCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                          <input
                            type="email"
                            value={correoCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                          <input
                            type="text"
                            value={telefonoCliente}
                            readOnly
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detalles de la factura */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                      <div className="flex items-center mb-4">
                        <FaRegCalendarAlt className="text-blue-800 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-800">Detalles de la Factura</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condición de Pago</label>
                          <select
                            value={condicionPago}
                            onChange={(e) => setCondicionPago(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                          >
                            <option>Contado</option>
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
                            placeholder="Observaciones o notas adicionales"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de búsqueda de productos */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex items-center mb-4">
                      <FaShoppingCart className="text-blue-800 mr-2" />
                      <h2 className="text-xl font-semibold text-gray-800">Agregar Productos</h2>
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
                            placeholder="Buscar producto por código o descripción"
                          />
                        </div>
                        <button
                          onClick={addItem}
                          className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center"
                        >
                          <FaPlus className="mr-2" />
                          Agregar Manualmente
                        </button>
                      </div>

                      {/* Lista de productos sugeridos */}
                      {showProductList && searchTerm && (
                        <div className="absolute z-50 mt-2 w-full">
                          <div className="bg-white rounded-xl shadow-lg border border-indigo-100/50 overflow-hidden">
                            {productosFiltrados.length > 0 ? (
                              <div className="max-h-64 overflow-y-auto divide-y divide-indigo-100/50">
                                {productosFiltrados.map((producto) => (
                                  <div
                                    key={producto.codigo}
                                    onClick={() => showProductDetailsPopup(producto)}
                                    className="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer group transition-colors duration-200"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                          Código: {producto.codigo}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </div>
                                      </div>
                                      
                                      <h3 className="text-lg font-bold text-indigo-900 truncate">
                                        {producto.nombre}
                                      </h3>
                                      
                                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                        {producto.descripcion}
                                      </p>
                                      
                                      <div className="flex justify-between items-center">
                                        <div className="text-teal-600 font-bold text-base">
                                          {formatMoney(producto.precio)}
                                        </div>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                          {getNombreUnidad(producto.unidad)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center bg-gray-50">
                                <div className="mb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-indigo-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 005.656 0M9 12V9m0 0a4 4 0 118 0v3M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                      <h3 className="text-lg font-semibold text-gray-800">Productos Seleccionados</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full border-collapse">
                          <thead className="sticky top-0 bg-gray-50 z-10">
                            <tr>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Nombre</th>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Código</th>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Descripción</th>
                              <th className="p-3 text-left font-semibold text-gray-700 border-b">Unidad</th>
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
                                    readOnly
                                    className="w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-black cursor-not-allowed"
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <input
                                    type="text"
                                    value={item.codigo}
                                    readOnly
                                    className="w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-black cursor-not-allowed"
                                  />
                                </td>
                                <td className="p-3 border-b">
                                  <div className="relative max-w-[250px]">
                                    <textarea
                                      value={item.descripcion}
                                      onChange={(e) => handleItemChange(item.id, "descripcion", e.target.value)}
                                      className="w-full p-2 bg-transparent border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                                      style={{
                                        minHeight: '40px',
                                        maxHeight: '120px',
                                        resize: 'vertical',
                                        overflowY: 'auto'
                                      }}
                                      rows={1}
                                      placeholder="Descripción del producto"
                                    />
                                    {item.descripcion && item.descripcion.length > 100 && (
                                      <span className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-1 rounded">
                                        {item.descripcion.length} chars
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 border-b">
                                  <span className="text-black">
                                    {getNombreUnidad(item.unidad)}
                                  </span>
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
                                    value={item.precioUnitario}
                                    readOnly
                                    className="w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-black text-right cursor-not-allowed"
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
                                    onClick={() => removeItem(item.id)}
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
                    {/* Separador decorativo */}
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-300 shadow-md p-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 text-2xl">
                          <FaInfoCircle />
                        </span>
                        <h2 className="text-lg font-semibold text-gray-700">¡Importante!</h2>
                      </div>
                      <p className="text-gray-600 text-sm text-center mt-2">
                        Revisa bien los datos antes de continuar con el pago. Si tienes dudas, contáctanos. 📞
                      </p>
                    </div>

                    {/* Totales */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm p-5">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h2>
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
                  

      {/* 5. Botón de impresión */}
      <button 
        onClick={handlePrint}
        className="px-5 py-3 bg-white text-blue-800 font-medium rounded-lg border border-blue-300 shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center"
      >
        <FaPrint className="mr-2" />
        Imprimir
      </button>
                    <button className="px-5 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all duration-200 flex items-center justify-center">
                      <FaFileDownload className="mr-2" />
                      Exportar PDF
                    </button>
                    <button
                      onClick={handleSaveInvoice}
                      className="px-5 py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center"
                    >
                      <FaSave className="mr-2" />
                      Guardar Factura
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

      {/* Componente de ticket oculto para impresión */}
      <div style={{ display: 'none' }}>
        <div ref={ticketRef}>
          <TicketPrint />
        </div>
      </div>

      {/* Pop-up de detalles del cliente */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-black text-xl font-semibold mb-4">Detalles del Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Documento</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.documento || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.correo || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedClient.telefono || "N/A"}</p>
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

      {/* Pop-up de detalles del producto */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-black text-xl font-semibold mb-4">Detalles del Producto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedProduct.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{selectedProduct.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md max-h-[200px] overflow-y-auto">
                  <p className="text-black whitespace-pre-wrap">{selectedProduct.descripcion}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unidad</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{getNombreUnidad(selectedProduct.unidad)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <p className="text-black mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md">{formatMoney(selectedProduct.precio)}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowProductDetails(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={selectProduct}
                className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de advertencia de stock modificado */}
      {showStockWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-500 mr-2 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">Advertencia de Stock</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-3">Se han realizado ventas que han afectado el stock de los siguientes productos:</p>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-black p-3 text-left border">Producto</th>
                      <th className="text-black p-3 text-left border">Código</th>
                      <th className="text-black p-3 text-left border">Stock Anterior</th>
                      <th className="text-black p-3 text-left border">Cantidad Vendida</th>
                      <th className="text-black p-3 text-left border">Nuevo Stock</th>
                      <th className="text-black p-3 text-left border">Situación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosStockModificado.map((producto) => {
                      let unidadCodigo = "";
                      
                      if (producto.unidad && typeof producto.unidad === 'object' && producto.unidad.codigo) {
                        unidadCodigo = producto.unidad.codigo;
                      } 
                      else if (producto.unidad) {
                        unidadCodigo = producto.unidad;
                      }
                      else if (producto.idproducto) {
                        const productoOriginal = productos.find(p => p.id === producto.idproducto);
                        if (productoOriginal) {
                          unidadCodigo = productoOriginal.unidad;
                        }
                      }

                      const nombreUnidad = unidadCodigo ? getNombreUnidad(unidadCodigo) : "No especificado";

                      return (
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                <strong>Nota:</strong> La factura se ha generado correctamente, pero debe reponer el stock lo antes posible.
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
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}