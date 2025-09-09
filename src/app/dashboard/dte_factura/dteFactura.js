"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaSave, FaPrint, FaFileDownload, FaSearch, FaRegCalendarAlt, FaTags, FaUserEdit, FaShoppingCart, FaInfoCircle, FaExclamationTriangle, FaTimes, FaMoneyBill, FaPercent } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import DatosEmisorReceptor from "./components/DatosEmisorReceptor";
import { codactividad } from "./data/data";
import ClientListModal from "./components/modals/ClientListModal";
import SelectorModal from "./components/modals/SelectorModal";
import ProductModal from "./components/modals/ProductModal";
import NonTaxableModal from "./components/modals/NonTaxableModal";
import TaxModal from "./components/modals/TaxModal";
import { useReactToPrint } from 'react-to-print';

export default function FacturacionViewComplete({ initialProductos = [], initialClientes = [], user, sucursalUsuario }) {
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
  // --- Emisor (vendedor logueado) ---
  const [actividadEconomica, setActividadEconomica] = useState("");
  const [direccionEmisor, setDireccionEmisor] = useState("");
  const [correoVendedor, setCorreoVendedor] = useState("");
  const [telefonoEmisor, setTelefonoEmisor] = useState("");
  // --- Receptor (cliente de la factura) ---
  const [tipoDocumentoReceptor, setTipoDocumentoReceptor] = useState("");
  const [numeroDocumentoReceptor, setNumeroDocumentoReceptor] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [direccionReceptor, setDireccionReceptor] = useState("");
  const [correoReceptor, setCorreoReceptor] = useState("");
  const [telefonoReceptor, setTelefonoReceptor] = useState("");
  const [complementoReceptor, setComplementoReceptor] = useState("");
  const [tipoDocumentoLabel, setTipoDocumentoLabel] = useState("Documento");


  // Inicializar correo desde user o, si no hay, desde localStorage
  useEffect(() => {
    // 1) Desde el user que viene del SSR (si tu page.js lo pasa)
    const fromUser =
      (user && (user.correoEmpleado || user.emailemp || user.email)) || "";

    if (fromUser) {
      setCorreoVendedor(fromUser);
      return;
    }

    // 2) Fallback desde localStorage (el login ya guarda 'empleado' con correo)
    try {
      const emp = JSON.parse(localStorage.getItem("empleado"));
      if (emp?.correo) setCorreoVendedor(emp.correo);
    } catch {
      /* ignore */
    }
  }, [user]);




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



  // Determina etiqueta y valor del documento principal del cliente
  const getTipoDocumentoInfo = (cli) => {
    if (!cli) return { label: "Documento", value: "" };

    const code = (cli.tipodocumento ?? "").toString().padStart(2, "0");
    // Mapeo principal según DTE (SV)
    const map = {
      "13": { label: "DUI", value: cli.dui },
      "36": { label: "NIT", value: cli.nit },
      "03": { label: "Pasaporte", value: cli.pasaporte },
      // Si en el futuro agregas más tipos, extiende aquí:
      // "XX": { label: "Carnet de Residente", value: cli.carnetresidente },
      // "YY": { label: "NRC", value: cli.nrc },
    };

    if (map[code]?.value) return map[code];

    // Fallback por disponibilidad, por si no coincide el código o el campo viene vacío
    if (cli.nit) return { label: "NIT", value: cli.nit };
    if (cli.dui) return { label: "DUI", value: cli.dui };
    if (cli.pasaporte) return { label: "Pasaporte", value: cli.pasaporte };
    if (cli.nrc) return { label: "NRC", value: cli.nrc };
    if (cli.carnetresidente) return { label: "Carnet de Residente", value: cli.carnetresidente };

    return { label: "Documento", value: "" };
  };

  // Seleccionar cliente después de ver sus detalles
  const selectCliente = () => {
    setCliente(selectedClient);
    setNombreCliente(selectedClient.nombre);


    const { label, value } = getTipoDocumentoInfo(selectedClient);
    setTipoDocumentoLabel(label);
    setDocumentoCliente(value ?? "");
    const numeroDoc = selectedClient.tipodocumento === "13" ? selectedClient.dui
      : selectedClient.tipodocumento === "36" ? selectedClient.nit
        : selectedClient.tipodocumento === "03" ? selectedClient.pasaporte
          : selectedClient.tipodocumento === "02" ? selectedClient.carnetresidente
            : (selectedClient.nit ?? selectedClient.dui ?? selectedClient.pasaporte ?? selectedClient.carnetresidente ?? "");
    setNumeroDocumentoReceptor(numeroDoc ?? "");

    setNombreReceptor(selectedClient.nombre ?? "");
    // Dirección guardada del cliente en BD (tu módulo de clientes usa 'complemento' como dirección detallada)
    setDireccionReceptor(selectedClient.complemento ?? "");           // <- solo lectura en DTE
    setCorreoReceptor(selectedClient.correo ?? "");
    setTelefonoReceptor(selectedClient.telefono ?? "");
    // Complemento del DTE: lo limpiamos para que el cajero escriba algo específico de esta factura (opcional)
    setComplementoReceptor("");
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

  useEffect(() => {
  if (sucursalUsuario) {
    try {
      setActividadEconomica(`${sucursalUsuario.codactividad}`);
      setDireccionEmisor(sucursalUsuario.complemento || "");
      setTelefonoEmisor(sucursalUsuario.telefono || "");
      
      if (!correoVendedor && sucursalUsuario.usuario?.correo) {
        setCorreoVendedor(sucursalUsuario.usuario.correo);
      }
    } catch (error) {
      console.error("Error al procesar datos de sucursal:", error);
    }
  }
}, [sucursalUsuario, correoVendedor]);

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
              <DatosEmisorReceptor
                // Estados del receptor
                tipoDocumentoReceptor={tipoDocumentoReceptor}
                setTipoDocumentoReceptor={setTipoDocumentoReceptor}
                numeroDocumentoReceptor={numeroDocumentoReceptor}
                setNumeroDocumentoReceptor={setNumeroDocumentoReceptor}
                nombreReceptor={nombreReceptor}
                setNombreReceptor={setNombreReceptor}
                direccionReceptor={direccionReceptor}
                setDireccionReceptor={setDireccionReceptor}
                correoReceptor={correoReceptor}
                setCorreoReceptor={setCorreoReceptor}
                telefonoReceptor={telefonoReceptor}
                setTelefonoReceptor={setTelefonoReceptor}
                complementoReceptor={complementoReceptor}
                setComplementoReceptor={setComplementoReceptor}
                
                // Estados del emisor
                actividadEconomica={actividadEconomica}
                setActividadEconomica={setActividadEconomica}
                direccionEmisor={direccionEmisor}
                setDireccionEmisor={setDireccionEmisor}
                correoVendedor={correoVendedor}
                setCorreoVendedor={setCorreoVendedor}
                telefonoEmisor={telefonoEmisor}
                setTelefonoEmisor={setTelefonoEmisor}

                actividadesEconomicas={codactividad}
              />

              
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
                        onChange={(e) => { setSearchTerm(e.target.value); setShowClientList(true); }}
                        className="w-full pl-10 p-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Buscar cliente"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800">
                      Documento ({getTipoDocumentoInfo(selectedClient).label})
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md text-gray-900">
                      {getTipoDocumentoInfo(selectedClient).value || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={nombreCliente}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
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
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Modal Selector de Tipo de Detalle */}
      <SelectorModal
        isOpen={showModal && modalType === "selector"}
        onClose={() => setShowModal(false)}
        onSelectTipoDetalle={selectTipoDetalle}
      />

      {/* Modal para Producto o Servicio */}
      <ProductModal
        isOpen={showModal && modalType === "producto"}
        onClose={() => {
          setShowModal(false);
          setProductoSeleccionado(null);
        }}
        onAddItem={(itemData) => agregarItemDesdeModal("producto", itemData)}
        onBackToSelector={() => setModalType("selector")}
        productosCargados={productosCargados}
        cargandoProductos={cargandoProductos}
        errorCargaProductos={errorCargaProductos}
        unidades={unidades}
        obtenerNombreUnidad={obtenerNombreUnidad}
      />

      {/* Modal para Monto No Afecto */}
      <NonTaxableModal
        isOpen={showModal && modalType === "noAfecto"}
        onClose={() => {
          setShowModal(false);
          setModalType("");
        }}
        onAddItem={(itemData) => agregarItemDesdeModal("noAfecto", itemData)}
      />

      {/* Modal para Impuestos/Tasas */}
      <TaxModal
        isOpen={showModal && modalType === "impuestos"}
        onClose={() => {
          setShowModal(false);
          setModalType("");
        }}
        onAddItem={(itemData) => agregarItemDesdeModal("impuestos", itemData)}
      />

      {/* Pop-up de lista de clientes */}
      <ClientListModal
        isOpen={showClientList && searchTerm}
        onClose={() => setShowClientList(false)}
        clients={clientesFiltrados}
        onSelectClient={showClientDetailsPopup}
      />

      {/* Pop-up de detalles del cliente */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Cliente</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md text-gray-900">{selectedClient.nombre}</p>
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