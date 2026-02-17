"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaSave, FaPrint, FaFileDownload, FaSearch, FaRegCalendarAlt, FaTags, FaUserEdit, FaShoppingCart, FaInfoCircle, FaExclamationTriangle, FaTimes, FaMoneyBill, FaPercent, FaSpinner, FaEye } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import DatosEmisorReceptor from "./components/DatosEmisorReceptor";
import { codactividad } from "./data/data";
import ClientListModal from "./components/modals/ClientListModal";
import SelectorModal from "./components/modals/SelectorModal";
import ProductModal from "./components/modals/ProductModal";
import NonTaxableModal from "./components/modals/NonTaxableModal";
import TaxModal from "./components/modals/TaxModal";
import DiscountModal from "./components/modals/DiscountModal";
import FormaPago from "./components/FormaPago";
import DatosEntrega from "./components/DatosAdicionalesEntrega";
import FechaHoraEmision from "./components/FechaHoraEmision";
import ConfirmacionFacturaModal from "./components/modals/ConfirmacionFacturaModal";
import VistaPreviaModal from "../dte_factura/components/modals/VistaPreviaModal"; // Reutilizamos el modal de factura
import MensajeModal from "./components/MensajeModal";
import { useReactToPrint } from 'react-to-print';
import Handlebars from 'handlebars';
import { API_BASE_URL } from "@/lib/api";

export default function NotaRemisionView({ initialProductos = [], initialClientes = [], user, sucursalUsuario }) {
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
  const [modalType, setModalType] = useState(""); 
  const [clientes, setClientes] = useState(initialClientes);
  const [productos, setProductos] = useState(initialProductos);
  const [productosCargados, setProductosCargados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorCargaProductos, setErrorCargaProductos] = useState(null);
  const [actividadEconomica, setActividadEconomica] = useState("");
  const [direccionEmisor, setDireccionEmisor] = useState("");
  const [correoVendedor, setCorreoVendedor] = useState("");
  const [telefonoEmisor, setTelefonoEmisor] = useState("");
  const [tipoDocumentoReceptor, setTipoDocumentoReceptor] = useState("");
  const [numeroDocumentoReceptor, setNumeroDocumentoReceptor] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [direccionReceptor, setDireccionReceptor] = useState("");
  const [correoReceptor, setCorreoReceptor] = useState("");
  const [telefonoReceptor, setTelefonoReceptor] = useState("");
  const [complementoReceptor, setComplementoReceptor] = useState("");
  const [idReceptor, setIdReceptor] = useState(null);
  const [tipoDocumentoLabel, setTipoDocumentoLabel] = useState("Documento");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [descuentoGrabadasMonto, setDescuentoGrabadasMonto] = useState(0);
  const [descuentoExentasMonto, setDescuentoExentasMonto] = useState(0);
  const [exentasConDescuentoState, setExentasConDescuentoState] = useState(0);
  const [gravadasSinDescuentoState, setGravadasSinDescuentoState] = useState(0);
  const [exentasSinDescuentoState, setExentasSinDescuentoState] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formasPago, setFormasPago] = useState([]);
  const [guardandoFactura, setGuardandoFactura] = useState(false);
  const [datosEntrega, setDatosEntrega] = useState({
    emisorDocumento: "",
    emisorNombre: "",
    receptorDocumento: "",
    receptorNombre: ""
  });
  const [fechaHoraEmision, setFechaHoraEmision] = useState({
    fechaEmision: "",
    horaEmision: ""
  });
  const [totalModal, setTotalModal] = useState(0);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [emisorDocumento, setEmisorDocumento] = useState("");
  const [emisorNombre, setEmisorNombre] = useState("");
  const [tributosDetallados, setTributosDetallados] = useState({});
  
  // Nuevo estado para retención de IVA
  const [retencionIVA, setRetencionIVA] = useState({
    aplicar: false,
    porcentaje: 1, // 1% o 13%
    monto: 0
  });
  
  // Nuevo estado para percepción de IVA
  const [percepcionIVA, setPercepcionIVA] = useState({
    aplicar: false,
    porcentaje: 1, // 1%
    monto: 0
  });
  
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensajeConfig, setMensajeConfig] = useState({
    tipo: "exito",
    titulo: "",
    mensaje: "",
    detalles: "",
    idFactura: null
  });
  const [descargandoTicket, setDescargandoTicket] = useState(false);
  const [actividadEconomicaCliente, setActividadEconomicaCliente] = useState("");
  const [actividadesEconomicasCliente, setActividadesEconomicasCliente] = useState([]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [template, setTemplate] = useState(null);

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
    { codigo: "55", nombre: "Kilómetro" },
    { codigo: "56", nombre: "Medio millar" },
    { codigo: "57", nombre: "Ciento" },
    { codigo: "58", nombre: "Docena" },
    { codigo: "59", nombre: "Unidad" },
    { codigo: "99", nombre: "Otra" },
  ]);

  const calcularPrecioNetoEIVA = (precioBruto) => {
    const precioNeto = precioBruto / 1.13;
    const iva = precioBruto - precioNeto;
    return {
      neto: parseFloat(precioNeto.toFixed(2)),
      iva: parseFloat(iva.toFixed(2)),
      bruto: parseFloat(precioBruto.toFixed(2))
    };
  };

  // Función para calcular la retención de IVA
  const calcularRetencionIVA = (porcentaje = null) => {
    const porc = porcentaje !== null ? porcentaje : retencionIVA.porcentaje;
    
    // Calcular base gravada después de descuentos
    const gravadasBase = items
      .filter(item => item.tipo === "producto" || item.tipo === "impuestos")
      .reduce((sum, item) => sum + (item.ventaGravada || 0), 0);
    
    const gravadasConDescuento = Math.max(0, gravadasBase - descuentoGrabadasMonto);
    
    // Calcular retención
    const montoRetencion = (gravadasConDescuento * porc) / 100;
    return parseFloat(montoRetencion.toFixed(2));
  };

  const calcularPercepcionIVA = (porcentaje = null) => {
    const porc = porcentaje !== null ? porcentaje : percepcionIVA.porcentaje;
    
    const gravadasBase = items
      .filter(item => item.tipo === "producto" || item.tipo === "impuestos")
      .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    
    const descuentoGravadasItems = items
      .filter(item => item.tipo === "producto" || item.tipo === "impuestos")
      .reduce((sum, item) => sum + (item.descuento || 0), 0);
    
    const gravadasConDescuento = gravadasBase - descuentoGravadasItems - descuentoGrabadasMonto;

    const montoPercepcion = (gravadasConDescuento * porc) / 100;
    return parseFloat(montoPercepcion.toFixed(2));
  };

  const validarFormatoDocumento = (tipoDocumento, numeroDocumento) => {
    if (!tipoDocumento || !numeroDocumento.trim()) {
      return { valido: false, mensaje: "El número de documento es requerido" };
    }

    const VALIDACIONES_DOCUMENTO = {
      "13": { regex: /^\d{8}-\d{1}$/, mensaje: "Formato de DUI inválido. Debe ser: 12345678-9" },
      "36": { regex: /^\d{4}-\d{6}-\d{3}-\d{1}$/, mensaje: "Formato de NIT inválido. Debe ser: 1234-123456-123-1" },
      "03": { regex: /^[A-Za-z0-9]{5,20}$/, mensaje: "Pasaporte debe contener solo letras y números (5-20 caracteres)" },
      "02": { regex: /^[A-Za-z0-9]{5,20}$/, mensaje: "Carnet de residente debe contener solo letras y números (5-20 caracteres)" }
    };

    const validacion = VALIDACIONES_DOCUMENTO[tipoDocumento];
    if (!validacion) {
      return { valido: false, mensaje: "Tipo de documento no válido" };
    }

    if (!validacion.regex.test(numeroDocumento)) {
      return { valido: false, mensaje: validacion.mensaje };
    }

    return { valido: true, mensaje: "" };
  };

  const mostrarModalMensaje = (tipo, titulo, mensaje, detalles = "", idFactura = null) => {
    setMensajeConfig({
      tipo,
      titulo,
      mensaje,
      detalles,
      idFactura
    });
    setMostrarMensaje(true);
  };

  const descargarTicketFactura = async (idFactura) => {
    setDescargandoTicket(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/facturas/${idFactura}/ver-compacto`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const newTab = window.open(url, '_blank');
        
        if (!newTab) {
          throw new Error('El navegador bloqueó la nueva pestaña. Por favor, permite ventanas emergentes.');
        }
        
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `nota_remision_${idFactura}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        mostrarModalMensaje(
          "exito", 
          "Ticket Abierto", 
          "El ticket de la nota de remisión se ha abierto en una nueva pestaña.",
          `Archivo: ${filename}`
        );
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
        
      } else {
        throw new Error('Error al generar el ticket');
      }
    } catch (error) {
      console.error('Error al abrir ticket:', error);
      mostrarModalMensaje(
        "error",
        "Error al Abrir Ticket",
        "No se pudo abrir el ticket de la nota de remisión.",
        error.message
      );
    } finally {
      setDescargandoTicket(false);
    }
  };

  const validarDatosFactura = () => {
    if (!nombreReceptor.trim()) {
      const mensaje = "El nombre del cliente es obligatorio";
      setErrorValidacion(mensaje);
      mostrarModalMensaje("error", "Datos Incompletos", mensaje);
      return false;
    }
    
    if (!numeroDocumentoReceptor.trim()) {
      const mensaje = "El documento del cliente es obligatorio";
      setErrorValidacion(mensaje);
      mostrarModalMensaje("error", "Datos Incompletos", mensaje);
      return false;
    }

    if (tipoDocumentoReceptor) {
      const validacionDocumento = validarFormatoDocumento(tipoDocumentoReceptor, numeroDocumentoReceptor);
      if (!validacionDocumento.valido) {
        const mensaje = `Documento inválido: ${validacionDocumento.mensaje}`;
        setErrorValidacion(mensaje);
        mostrarModalMensaje("error", "Documento Inválido", mensaje);
        return false;
      }
    }
    
    if (items.length === 0) {
      const mensaje = "Debe agregar al menos un item a la nota de remisión";
      setErrorValidacion(mensaje);
      mostrarModalMensaje("error", "Nota de Remisión Vacía", mensaje);
      return false;
    }
    
    if (formasPago.length === 0) {
      const mensaje = "Debe especificar al menos una forma de pago";
      setErrorValidacion(mensaje);
      mostrarModalMensaje("error", "Forma de Pago Requerida", mensaje);
      return false;
    }

    setErrorValidacion("");
    return true;
  };

  const guardarFactura = async () => {
    if (guardandoFactura) return;
    
    if (!validarDatosFactura()) {
      return;
    }
    
    try {
      setGuardandoFactura(true); 
      
      const datosFactura = prepararDatosFactura();
      
      if (!datosFactura.formapago) {
        mostrarModalMensaje(
          "error",
          "Error de Validación",
          "No se pudo determinar la forma de pago"
        );
        setGuardandoFactura(false);
        return;
      }
      
      console.log("Enviando encabezado:", datosFactura);
      
      const responseEncabezado = await fetch(`${API_BASE_URL}/notasremision/encabezado`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(datosFactura)
      });

      if (responseEncabezado.ok) {
        const result = await responseEncabezado.json();
        console.log("Encabezado de nota de remisión guardado:", result);
        
        const detallesResult = await guardarDetallesFactura(result.iddtefactura);
        
        if (detallesResult) {
          setShowConfirmModal(false);
          
          let mensajeTitulo = "Nota de Remisión Guardada";
          let mensajeDetalles = "";
          let idFacturaParaDescarga = result.iddtefactura;

          if (detallesResult.contingencia && detallesResult.aviso) {
            mensajeTitulo = "Nota de Remisión en Contingencia";
            mensajeDetalles = `${detallesResult.aviso}\n${detallesResult.message}`;
          } else if (detallesResult.transmitido) {
            mensajeTitulo = "Nota de Remisión Transmitida";
            mensajeDetalles = `Nota de Remisión ${result.ncontrol} guardada y transmitida exitosamente`;
          } else {
            mensajeDetalles = `Nota de Remisión ${result.ncontrol} guardada exitosamente`;
          }
          
          mostrarModalMensaje(
            "exito",
            mensajeTitulo,
            "La nota de remisión se ha procesado correctamente.",
            mensajeDetalles,
            idFacturaParaDescarga
          );
          
          reiniciarEstados();
          setShowPreviewModal(false);
        }
      } else {
        const errorText = await responseEncabezado.text();
        throw new Error(`Error del servidor: ${errorText}`);
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarModalMensaje(
        "error",
        "Error al Guardar",
        "No se pudo guardar la nota de remisión.",
        error.message
      );
      setShowPreviewModal(false);
    } finally {
      setGuardandoFactura(false);
    }
  };

  useEffect(() => {
    fetch('/templates/plantilla_factura.hbs')
      .then(response => response.text())
      .then(text => {
        Handlebars.registerHelper('two', (value) => {
          if (value === undefined || value === null || isNaN(value)) return "0.00";
          const numValue = typeof value === 'number' ? value : parseFloat(value);
          return numValue.toFixed(2);
        });

        Handlebars.registerHelper('money', (value) => {
          if (value === undefined || value === null || isNaN(value)) return "$0.00";
          const numValue = typeof value === 'number' ? value : parseFloat(value);
          return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        });

        Handlebars.registerHelper('isContado', (value) => {
          return value === 1;
        });

        Handlebars.registerHelper('unitName', (codigoUnidad) => {
          if (!codigoUnidad) return '';
          const unidad = unidades.find(u => u.codigo === codigoUnidad.toString());
          return unidad ? unidad.nombre : '';
        });
        
        setTemplate(() => Handlebars.compile(text));
      })
      .catch(error => console.error("Error al cargar la plantilla de vista previa:", error));
  }, []);

  const handleConfirmarYGuardar = () => {
    if (guardandoFactura) return;

    if (!validarDatosFactura()) return;
    if (!template) {
      mostrarModalMensaje("error", "Plantilla no cargada", "La plantilla para la vista previa aún no está lista. Intente de nuevo.");
      return;
    }

    const datosParaPlantilla = prepararDatosFactura(true);
    setPreviewHtml(template(datosParaPlantilla));
    setShowPreviewModal(true);
  };

  const reiniciarFormulario = () => {
    setItems([]);
    setCliente(null);
    setNombreCliente("");
    setDocumentoCliente("");
    setCondicionPago("Contado");
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setFechaVencimiento(nextMonth.toISOString().split("T")[0]);
    setSumaopesinimpues(0);
    setTotaldescuento(0);
    setVentasgrabadas(0);
    setValoriva(0);
    setTotal(0);
    setDescuentoGrabadasMonto(0);
    setDescuentoExentasMonto(0);
    setFormasPago([]);
    setRetencionIVA({
      aplicar: false,
      porcentaje: 1,
      monto: 0
    });
    setPercepcionIVA({
      aplicar: false,
      porcentaje: 1,
      monto: 0
    });
    obtenerUltimoNumeroFactura();
  };

  const reiniciarEstados = () => {
    setCliente(null);
    setNombreCliente("");
    setDocumentoCliente("");
    setTipoDocumentoReceptor("");
    setNumeroDocumentoReceptor("");
    setNombreReceptor("");
    setDireccionReceptor("");
    setCorreoReceptor("");
    setTelefonoReceptor("");
    setComplementoReceptor("");
    setTipoDocumentoLabel("Documento");
    setItems([]);
    setSumaopesinimpues(0);
    setTotaldescuento(0);
    setVentasgrabadas(0);
    setValoriva(0);
    setTotal(0);
    setDescuentoGrabadasMonto(0);
    setDescuentoExentasMonto(0);
    setExentasConDescuentoState(0);
    setGravadasSinDescuentoState(0);
    setExentasSinDescuentoState(0);
    setCondicionPago("Contado");
    setFormasPago([]);
    setRetencionIVA({
      aplicar: false,
      porcentaje: 1,
      monto: 0
    });
    setPercepcionIVA({
      aplicar: false,
      porcentaje: 1,
      monto: 0
    });
    setDatosEntrega({
      emisorDocumento: "",
      emisorNombre: "",
      receptorDocumento: "",
      receptorNombre: ""
    });
    
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setFechaVencimiento(nextMonth.toISOString().split("T")[0]);
    obtenerUltimoNumeroFactura();
    setShowModal(false);
    setShowDiscountModal(false);
    setShowConfirmModal(false);
    setShowClientList(false);
    setShowClientDetails(false);
    setSearchTerm("");
    setTributosDetallados({});
    
    // LIMPIAR ACTIVIDADES ECONÓMICAS DEL CLIENTE
    setActividadEconomicaCliente("");
    setActividadesEconomicasCliente([]);
  };


  const verDatosFactura = () => {
    if (items.length === 0) {
      mostrarModalMensaje("error", "Nota de Remisión Vacía", "La nota de remisión debe tener al menos un item");
      return;
    }

    const datosFactura = prepararDatosFactura();
    
    console.log("====== DATOS COMPLETOS DE NOTA DE REMISIÓN (SOLO VISUALIZACIÓN) ======");
    console.log("ENCABEZADO:");
    console.log(JSON.stringify(datosFactura, null, 2));
    console.log("========== Items ==================")
    console.log(items)
    
    const detalles = items.map((item, index) => {
      const subtotalItem = item.precioUnitario * item.cantidad;
      const descuentoItem = item.descuento || 0;
      const baseImponible = subtotalItem - descuentoItem;

      const esGravado = item.tipo === "producto" || item.tipo === "impuestos";
      const esExento = item.tipo === "noAfecto";

      const codigoItem = item.codigo || (item.tipo === "producto" ? `PROD-${item.id}` : `ITEM-${item.id}`);

      return {
        numitem: index + 1,
        tipoitem: "1",
        numerodocumento: null,
        cantidad: parseFloat(item.cantidad.toFixed(2)),
        codigo: codigoItem,
        codtributo: null,
        unimedida: item.unidadMedida || "59",
        descripcion: item.descripcion,
        preciouni: parseFloat(item.precioUnitario.toFixed(8)),
        montodescu: parseFloat(descuentoItem.toFixed(8)),
        ventanosuj: 0.00,
        ventaexenta: esExento ? parseFloat(baseImponible.toFixed(8)) : 0.00,
        ventagravada: esGravado ? parseFloat(baseImponible.toFixed(8)) : 0.00,
        tributos: null,
        psv: 0,
        nogravado: 0.00,
        ivaitem: 0.00
      };
    });
    
    const datosDetalles = {
      transmitir: true,
      idEnvio: Math.floor(1000 + Math.random() * 9000),
      detalles: detalles,
    };
    
    console.log("DETALLES:");
    console.log(JSON.stringify(datosDetalles, null, 2));
    console.log("=============================================================");
    
    mostrarModalMensaje(
      "exito",
      "Datos en Consola",
      "Datos de nota de remisión mostrados en consola.",
      "Revisa la consola del navegador (F12) para ver los detalles completos."
    );
  };

  const actualizarStockProductos = async (itemsFactura) => {
    try {
      const productosParaActualizar = itemsFactura.filter(item => 
        item.actualizarStock && item.productoId && item.tipo === "producto"
      );

      console.log("Productos a actualizar stock:", productosParaActualizar);

      for (const producto of productosParaActualizar) {
        try {
          const response = await fetch(`${API_BASE_URL}/productos/decrementStock/${producto.productoId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ cantidad: producto.cantidad })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`Stock actualizado para producto ${producto.productoId}:`, result);
          } else {
            console.error(`Error al actualizar stock para producto ${producto.productoId}:`, response.statusText);
          }
        } catch (error) {
          console.error(`Error al actualizar stock para producto ${producto.productoId}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error("Error general en actualización de stock:", error);
      throw error;
    }
  };

  const guardarDetallesFactura = async (iddtefactura) => {
    try {
      const detalles = items.map((item, index) => {
        const esGravado = item.tipo === "producto" || item.tipo === "impuestos";
        const esExento = item.tipo === "noAfecto";
        const esNoSujeto = item.tipo === "noSuj";

        const baseGravada = esGravado ? item.ventaGravada : 0;
        const baseExenta = esExento ? item.ventaExenta : 0;
        const baseNoSujeta = esNoSujeto ? item.ventaNoSujeta : 0;

        const tasaIVA = 0.13;
        const ivaItem = baseGravada * tasaIVA;

        const codigoItem = item.codigo || (item.tipo === "producto" ? `PROD-${item.id}` : `ITEM-${item.id}`);

        return {
          numitem: index + 1,
          tipoitem: "1",
          numerodocumento: null,
          cantidad: parseFloat(item.cantidad.toFixed(2)),
          codigo: codigoItem,
          codtributo: null,
          unimedida: item.unidadMedida || "59",
          descripcion: item.descripcion,
          preciouni: parseFloat(item.precioUnitario.toFixed(8)), // Precio original
          montodescu: parseFloat(item.descuento.toFixed(8)), // Descuento total
          ventanosuj: parseFloat(baseNoSujeta.toFixed(8)),
          ventaexenta: parseFloat(baseExenta.toFixed(8)),
          ventagravada: parseFloat(baseGravada.toFixed(8)),
          tributos: item.tributos,
          psv: 0,
          nogravado: 0.00,
          ivaitem: parseFloat(ivaItem.toFixed(2)) 
        };
      });

      const datosDetalles = {
        transmitir: true,
        idEnvio: Math.floor(1000 + Math.random() * 9000),
        detalles: detalles,
      };

      console.log("Enviando detalles a guardar:", JSON.stringify(datosDetalles, null, 2));

      const responseDetalles = await fetch(`${API_BASE_URL}/notasremision/${iddtefactura}/detalles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(datosDetalles),
      });

      if (responseDetalles.ok) {
        const resultDetalles = await responseDetalles.json();
        console.log("Detalles de nota de remisión guardados:", resultDetalles);
        
        await actualizarStockProductos(items);
        
        return resultDetalles;
      } else {
        const errorText = await responseDetalles.text();
        console.error("Error response from server:", errorText);
        throw new Error(`Error al guardar los detalles: ${errorText}`);
      }
    } catch (error) {
      console.error("Error al guardar detalles:", error);
      throw error;
    }
  };

  const obtenerUltimoNumeroFactura = async () => {
    // No hay endpoint específico para última nota de remisión en el snippet proporcionado.
    // Se establece en 0 o 1 por defecto para evitar mostrar un número incorrecto de facturas.
    setNumeroFactura(1);
  };

  const prepararDatosFactura = (paraVistaPrevia = false) => {
    const subtotalBruto = items.reduce((sum, item) => {
      return sum + (item.precioUnitario * item.cantidad);
    }, 0);

    const descuentoItems = items.reduce((sum, item) => 
      sum + (item.descuento || 0), 0);

    const baseGravadaNeto = items.reduce((sum, item) => 
      sum + (item.ventaGravada || 0), 0);
    
    const baseExentaNeto = items.reduce((sum, item) => 
      sum + (item.ventaExenta || 0), 0);

    const baseNoSujetaNeto = items.reduce((sum, item) => 
      sum + (item.ventaNoSujeta || 0), 0);

    let baseGravadaFinal = Math.max(0, baseGravadaNeto - descuentoGrabadasMonto);
    let baseExentaFinal = Math.max(0, baseExentaNeto - descuentoExentasMonto);

    const tasaIVA = 0.13;
    const ivaCalculado = baseGravadaFinal * tasaIVA;

    const descuentoTotal = descuentoItems + descuentoGrabadasMonto + descuentoExentasMonto;
    
    const subtotalNeto = baseGravadaFinal + baseExentaFinal + baseNoSujetaNeto;
    
    // Aplicar retención de IVA si está activa
    const montoRetencionIVA = retencionIVA.aplicar ? retencionIVA.monto : 0;

    // Aplicar percepción de IVA si está activa
    const montoPercepcionIVA = percepcionIVA.aplicar ? percepcionIVA.monto : 0;
    
    const totalFinal = subtotalNeto + ivaCalculado - montoRetencionIVA + montoPercepcionIVA;

    const ahora = new Date();
    const offset = -6;
    const salvadorTime = new Date(ahora.getTime() + (offset * 60 * 60 * 1000));
    
    const year = salvadorTime.getUTCFullYear();
    const month = String(salvadorTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(salvadorTime.getUTCDate()).padStart(2, '0');
    const fechaEmision = `${year}-${month}-${day}`;
    
    const horaEmision = ahora.toTimeString().split(' ')[0];

    let formapagoValue = "Efectivo";
    if (formasPago && formasPago.length > 0) {
      const metodoPago = formasPago[0]?.metodo || "";
      formapagoValue = metodoPago || "Efectivo";
    }

    const montototaloperacion = subtotalBruto - descuentoTotal;

    const actividadSeleccionada = actividadesEconomicasCliente.find(
      act => act.codigo === actividadEconomicaCliente
    );

    const descripcionActividad = actividadSeleccionada ? actividadSeleccionada.descripcion : "";

    if (paraVistaPrevia) { // paraVistaPrevia
      const cuerpoDocumento = items.map((item, index) => {
        const esGravado = item.tipo === "producto" || item.tipo === "impuestos";
        const esExento = item.tipo === "noAfecto";
        const esNoSujeto = item.tipo === "noSuj";

        const baseGravada = esGravado ? item.ventaGravada : 0;
        const ivaItem = baseGravada * tasaIVA;

        return {
          numItem: index + 1,
          cantidad: item.cantidad,
          uniMedida: item.unidadMedida || "59",
          descripcion: item.descripcion,
          precioUni: item.precioUnitario,
          montoDescu: item.descuento || 0,
          ventaNoSuj: esNoSujeto ? item.ventaNoSujeta : 0,
          ventaExenta: esExento ? item.ventaExenta : 0,
          ventaGravada: esGravado ? item.ventaGravada : 0,
          ivaItem: ivaItem,
        };
      });

      return {
        identificacion: {
          version: "1.0",
          tipoDteLabel: "NOTA DE REMISIÓN",
          tipoMoneda: "USD",
          tipoModelo: "1",
          tipoOperacion: "1",
          codigoGeneracion: `(Aún no generado)`,
          numeroControl: `TRX-${numeroFactura}`,
          fecEmi: fechaEmision,
          horEmi: horaEmision,
        },
        selloRecibido: "(Sello de recepción pendiente)",
        barcodeDataUri: "", // El QR se genera en el backend
        emisor: {
          nombre: sucursalUsuario?.usuario?.nombre || "Nombre Emisor",
          nit: sucursalUsuario?.usuario?.nit || "0000-000000-000-0",
          nrc: sucursalUsuario?.nrc || "-",
          descActividad: codactividad.find(c => c.codigo === actividadEconomica)?.nombre || "Actividad no especificada",
          direccion: {
            complemento: direccionEmisor,
            municipio: sucursalUsuario?.municipio?.nombre || "",
            departamento: sucursalUsuario?.departamento?.nombre || "",
          },
          telefono: telefonoEmisor,
          correo: correoVendedor,
          nombreComercial: sucursalUsuario?.nombre || "Nombre Comercial",
          tipoEstablecimiento: "Sucursal",
        },
        receptor: {
          nombre: nombreReceptor,
          tipoDocumento: tipoDocumentoLabel,
          numDocumento: numeroDocumentoReceptor,
          descActividad: descripcionActividad,
          direccion: {
            complemento: direccionReceptor,
            municipio: cliente?.municipio?.nombre || "",
            departamento: cliente?.departamento?.nombre || "",
          },
          telefono: telefonoReceptor,
          correo: correoReceptor,
        },
        cuerpoDocumento: cuerpoDocumento,
        resumen: {
          totalLetras: convertirNumeroALetras(totalFinal),
          condicionOperacion: condicionPago.toLowerCase() === "contado" ? 1 : 2,
          totalNoSuj: parseFloat(baseNoSujetaNeto.toFixed(2)),
          totalExenta: parseFloat(baseExentaFinal.toFixed(2)),
          totalGravada: parseFloat(baseGravadaFinal.toFixed(2)),
          totalIva: parseFloat(ivaCalculado.toFixed(2)),
          ivarete1: parseFloat(montoRetencionIVA.toFixed(2)), // RETENCIÓN IVA
          ivaPercibido: parseFloat(montoPercepcionIVA.toFixed(2)), // PERCEPCIÓN IVA
          totalPagar: parseFloat(totalFinal.toFixed(2)),
          montoTotalOperacion: parseFloat(montototaloperacion.toFixed(2)),
          descuGravada: parseFloat(descuentoGrabadasMonto.toFixed(2)),
          reteRenta: 0,
          totalNoGravado: 0,
        },
        extension: {
          observaciones: "Vista previa del documento.",
          responsables: {
            emisor: {
              nombre: datosEntrega.emisorNombre || emisorNombre,
              documento: datosEntrega.emisorDocumento || emisorDocumento
            },
            receptor: {
              nombre: datosEntrega.receptorNombre || nombreReceptor,
              documento: datosEntrega.receptorDocumento || numeroDocumentoReceptor
            }
          }
        }
      };
    }

    return {
      idcliente: idReceptor,
      tipo_dte: "04",
      sellorec: "", 
      modelofac: "04",
      verjson: "1.0",
      tipotran: "04",
      fechaemision: fechaEmision,
      horaemision: horaEmision,
      transaccioncontable: `TRX-${numeroFactura}`,
      tipoventa: condicionPago.toLowerCase() === "contado" ? "contado" : "crédito",
      formapago: formapagoValue,
      estado: "",

      sumaopesinimpues: parseFloat(subtotalBruto.toFixed(2)),
      totaldescuento: parseFloat(descuentoTotal.toFixed(2)),
      valoriva: parseFloat(ivaCalculado.toFixed(2)),
      subtotal: parseFloat(subtotalNeto.toFixed(2)), // CORREGIDO: Subtotal neto (sin IVA)
      ivapercibido: parseFloat(ivaCalculado.toFixed(2)),
      ivarete1: retencionIVA.aplicar ? parseFloat(retencionIVA.monto.toFixed(2)) : 0.00, // RETENCIÓN IVA
      montototalope: parseFloat(montototaloperacion.toFixed(2)),
      totalotrosmnoafectos: parseFloat(baseExentaFinal.toFixed(2)),
      totalapagar: parseFloat(totalFinal.toFixed(2)),
      valorletras: convertirNumeroALetras(totalFinal),
      tipocontingencia: "",
      motivocontin: "",

      totalnosuj: parseFloat(baseNoSujetaNeto.toFixed(2)),
      totalexenta: parseFloat(baseExentaFinal.toFixed(2)),
      totalgravada: parseFloat(baseGravadaFinal.toFixed(2)),
      subtotalventas: parseFloat(subtotalNeto.toFixed(2)), // CORREGIDO: Subtotal neto

      descunosuj: 0.00,
      descuexenta: parseFloat(descuentoExentasMonto.toFixed(2)),
      descugravada: parseFloat(descuentoGrabadasMonto.toFixed(2)),
      porcentajedescuento: descuentoTotal > 0 ? parseFloat(((descuentoTotal / subtotalBruto) * 100).toFixed(2)) : 0.00,
      totaldescu: parseFloat(descuentoTotal.toFixed(2)),
      tributosf: null,
      codigot: "",
      descripciont: "",
      valort: 0.00,

      ivaperci1: percepcionIVA.aplicar ? parseFloat(percepcionIVA.monto.toFixed(2)) : 0.00, // PERCEPCIÓN IVA
      reterenta: 0.00,

      montototaloperacion: parseFloat(montototaloperacion.toFixed(2)),
      totalpagar: parseFloat(totalFinal.toFixed(2)),
      totalletras: convertirNumeroALetras(totalFinal),
      totaliva: parseFloat(ivaCalculado.toFixed(2)),
      saldofavor: 0.00,

      condicionoperacion: 1,
      codigo: "01",
      montopago: parseFloat(totalFinal.toFixed(2)),
      referencia: "",
      plazo: null,
      periodo: null,
      numpagoelectronico: "",

      nombrecibe: datosEntrega.receptorNombre || nombreReceptor || "",
      docurecibe: datosEntrega.receptorDocumento || numeroDocumentoReceptor || "",
      correo_seleccionado: correoReceptor,

      actividad_economica_cliente: actividadEconomicaCliente || null,
      desc_actividad_economica_cliente: descripcionActividad || null,

      documentofirmado: null
    };
  };

  const convertirNumeroALetras = (numero) => {
    numero = parseFloat(numero.toFixed(2));

    const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
    const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
    const decenas = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
    const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

    const convertirMenorQueMil = (n) => {
      if (n === 100) return "CIEN";
      let texto = "";
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (c > 0) texto += centenas[c] + " ";
      if (d === 1) texto += especiales[u] + " ";
      else if (d === 2 && u !== 0) texto += "VEINTI" + unidades[u].toLowerCase() + " ";
      else {
        if (d > 2) texto += decenas[d] + (u > 0 ? " Y " : "");
        if (u > 0) texto += unidades[u] + " ";
      }
      return texto.trim();
    };

    const entero = Math.floor(numero);
    const decimales = Math.round((numero - entero) * 100);

    if (entero === 0) return `CERO CON ${decimales.toString().padStart(2, "0")}/100`;

    let partes = [];
    let resto = entero;

    const millones = Math.floor(resto / 1000000);
    if (millones > 0) {
      partes.push(millones === 1 ? "UN MILLÓN" : `${convertirMenorQueMil(millones)} MILLONES`);
      resto %= 1000000;
    }

    const miles = Math.floor(resto / 1000);
    if (miles > 0) {
      partes.push(miles === 1 ? "MIL" : `${convertirMenorQueMil(miles)} MIL`);
      resto %= 1000;
    }

    if (resto > 0) {
      partes.push(convertirMenorQueMil(resto));
    }

    const textoEntero = partes.join(" ");
    const textoDecimales = `${decimales.toString().padStart(2, "0")}/100`;

    return `${textoEntero} CON ${textoDecimales} DÓLARES`;
  };

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    obtenerUltimoNumeroFactura();
  }, []);

  // Efecto para actualizar el monto de retención cuando cambien los items o descuentos
  useEffect(() => {
    if (retencionIVA.aplicar) {
      const nuevoMonto = calcularRetencionIVA();
      setRetencionIVA(prev => ({
        ...prev,
        monto: nuevoMonto
      }));
    }
  }, [items, descuentoGrabadasMonto, retencionIVA.porcentaje]);

  // Efecto para actualizar el monto de percepción cuando cambien los items o descuentos
  useEffect(() => {
    if (percepcionIVA.aplicar) {
      const nuevoMonto = calcularPercepcionIVA();
      setPercepcionIVA(prev => ({
        ...prev,
        monto: nuevoMonto
      }));
    }
  }, [items, descuentoGrabadasMonto, percepcionIVA.porcentaje]);

  useEffect(() => {
    if (showModal && modalType === "producto") {
      const fetchProductos = async () => {
        setCargandoProductos(true);
        setErrorCargaProductos(null);

        try {
          const response = await fetch(`${API_BASE_URL}/productos/getAll`, {
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

  const clientesFiltrados = Array.isArray(clientes) ? clientes.filter(
    (cliente) =>
      (cliente?.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.nit?.toString() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.dui?.toString() || "").includes(searchTerm.toLowerCase())
  ) : [];

  useEffect(() => {
    const subtotalBruto = items.reduce((sum, item) => {
      return sum + (item.precioUnitario * item.cantidad);
    }, 0);

    const descuentoItems = items.reduce((sum, item) => 
      sum + (item.descuento || 0), 0);

    const baseGravadaNeto = items.reduce((sum, item) => 
      sum + (item.ventaGravada || 0), 0);
    
    const baseExentaNeto = items.reduce((sum, item) => 
      sum + (item.ventaExenta || 0), 0);

    const baseNoSujetaNeto = items.reduce((sum, item) => 
      sum + (item.ventaNoSujeta || 0), 0);

    let baseGravadaFinal = Math.max(0, baseGravadaNeto - descuentoGrabadasMonto);
    let baseExentaFinal = Math.max(0, baseExentaNeto - descuentoExentasMonto);

    const tasaIVA = 0.13;
    const ivaCalculado = baseGravadaFinal * tasaIVA;

    // Calcular retención de IVA si aplica
    const montoRetencionIVA = retencionIVA.aplicar ? calcularRetencionIVA() : 0;
    
    // Calcular percepción de IVA si aplica
    const montoPercepcionIVA = percepcionIVA.aplicar ? calcularPercepcionIVA() : 0;

    const descuentoTotal = descuentoItems + descuentoGrabadasMonto + descuentoExentasMonto;
    const subtotalNeto = baseGravadaFinal + baseExentaFinal + baseNoSujetaNeto;
    
    // Calcular total final (Restar retención, Sumar percepción)
    const totalFinal = subtotalNeto + ivaCalculado - montoRetencionIVA + montoPercepcionIVA;

    // Actualizar estado de retención
    if (retencionIVA.aplicar) {
      setRetencionIVA(prev => ({
        ...prev,
        monto: montoRetencionIVA
      }));
    }
    // Actualizar estado de percepción
    if (percepcionIVA.aplicar) {
      setPercepcionIVA(prev => ({
        ...prev,
        monto: montoPercepcionIVA
      }));
    }

    setSumaopesinimpues(parseFloat(subtotalBruto.toFixed(2)));
    setTotaldescuento(parseFloat(descuentoTotal.toFixed(2)));
    setVentasgrabadas(parseFloat(baseGravadaFinal.toFixed(2)));
    setValoriva(parseFloat(ivaCalculado.toFixed(2)));
    setTotal(parseFloat(totalFinal.toFixed(2)));
    
    setGravadasSinDescuentoState(parseFloat(baseGravadaNeto.toFixed(2)));
    setExentasSinDescuentoState(parseFloat(baseExentaNeto.toFixed(2)));
    setExentasConDescuentoState(parseFloat(baseExentaFinal.toFixed(2)));
  }, [items, descuentoGrabadasMonto, descuentoExentasMonto, retencionIVA.aplicar, retencionIVA.porcentaje, percepcionIVA.aplicar, percepcionIVA.porcentaje]);

  const obtenerDescripcionTributo = (codigo) => {
    const tributosMap = {
      "20": "IVA 13%",
      "59": "Turismo: por alojamiento (5%)",
      "71": "Turismo: salida del país por vía aérea $7.00",
      "D1": "FOVIAL ($0.20 por galón)",
      "C8": "COTRANS ($0.10 por galón)",
      "D5": "Otras tasas casos especiales",
      "D4": "Otros impuestos casos especiales",
      "C5": "Impuesto ad-valorem bebidas alcohólicas (8%)",
      "C6": "Impuesto ad-valorem tabaco cigarrillos (39%)",
      "C7": "Impuesto ad-valorem tabaco cigarros (100%)",
    };
    
    return tributosMap[codigo] || `Tributo ${codigo}`;
  };

  const showClientDetailsPopup = (cliente) => {
    setSelectedClient(cliente);
    setShowClientDetails(true);
  };

  const handleApplyDiscounts = (discounts) => {
    setDescuentoGrabadasMonto(discounts.grabadas);
    setDescuentoExentasMonto(discounts.exentas);
  };

  const handleDatosEntregaChange = (nuevosDatos) => {
    setDatosEntrega(nuevosDatos);
  };

  const handleFechaHoraChange = (datos) => {
    setFechaHoraEmision(datos);
  };

  const getTipoDocumentoInfo = (cli) => {
    if (!cli) return { label: "Documento", value: "" };

    const code = (cli.tipodocumento ?? "").toString().padStart(2, "0");
    const map = {
      "13": { label: "DUI", value: cli.dui },
      "36": { label: "NIT", value: cli.nit },
      "03": { label: "Pasaporte", value: cli.pasaporte },
    };

    if (map[code]?.value) return map[code];

    if (cli.nit) return { label: "NIT", value: cli.nit };
    if (cli.dui) return { label: "DUI", value: cli.dui };
    if (cli.pasaporte) return { label: "Pasaporte", value: cli.pasaporte };
    if (cli.nrc) return { label: "NRC", value: cli.nrc };
    if (cli.carnetresidente) return { label: "Carnet de Residente", value: cli.carnetresidente };

    return { label: "Documento", value: "" };
  };

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
    setDireccionReceptor(selectedClient.complemento ?? "");
    setCorreoReceptor(selectedClient.correo ?? "");
    setTelefonoReceptor(selectedClient.telefono ?? "");
    setComplementoReceptor("");
    setSearchTerm("");
    setShowClientList(false);
    setShowClientDetails(false);
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === "cantidad" || field === "precioUnitario") {
          const subtotal = updatedItem.cantidad * updatedItem.precioUnitario;
          
          if (updatedItem.tipo === "producto" || updatedItem.tipo === "impuestos") {
            const precioBrutoConDescuento = Math.max(0, updatedItem.precioUnitario - (updatedItem.valorDescuento || 0));
            const precioNeto = precioBrutoConDescuento / 1.13;
            updatedItem.precioNeto = parseFloat(precioNeto.toFixed(4));
            updatedItem.ventaGravada = parseFloat((precioNeto * updatedItem.cantidad).toFixed(2));
            updatedItem.descuentoGravado = parseFloat(((updatedItem.valorDescuento || 0) * updatedItem.cantidad).toFixed(2));
          } 
          else if (updatedItem.tipo === "noAfecto") {
            const precioConDescuento = Math.max(0, updatedItem.precioUnitario - (updatedItem.valorDescuento || 0));
            updatedItem.precioNeto = parseFloat(precioConDescuento.toFixed(4));
            updatedItem.ventaExenta = parseFloat((precioConDescuento * updatedItem.cantidad).toFixed(2));
            updatedItem.descuentoExento = parseFloat(((updatedItem.valorDescuento || 0) * updatedItem.cantidad).toFixed(2));
          }

          else {
            const precioConDescuento = Math.max(0, updatedItem.precioUnitario - (updatedItem.valorDescuento || 0));
            updatedItem.precioNeto = parseFloat(precioConDescuento.toFixed(4));
            updatedItem.ventaNoSujeta = parseFloat((precioConDescuento * updatedItem.cantidad).toFixed(2));
            updatedItem.descuentoNoSujeto = parseFloat(((updatedItem.valorDescuento || 0) * updatedItem.cantidad).toFixed(2));
          }
          
          updatedItem.descuento = parseFloat(((updatedItem.valorDescuento || 0) * updatedItem.cantidad).toFixed(2));
          updatedItem.total = parseFloat((subtotal - (updatedItem.descuento || 0)).toFixed(2));
        }
        
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

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

        setEmisorDocumento(sucursalUsuario.usuario.nit || sucursalUsuario.dui || "");
        setEmisorNombre(sucursalUsuario.usuario.nombre || sucursalUsuario.usuario.razonsocial || "");
        
        if (!correoVendedor && sucursalUsuario.usuario?.correo) {
          setCorreoVendedor(sucursalUsuario.usuario.correo);
        }
      } catch (error) {
        console.error("Error al procesar datos de sucursal:", error);
      }
    }
  }, [sucursalUsuario, correoVendedor]);

  const idEmisor =  sucursalUsuario.usuario.id;

  const formatMoney = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "$0.00";
    }
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    return `$${numValue.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const openModalSelector = () => {
    setModalType("selector");
    setShowModal(true);
  };

  const selectTipoDetalle = (tipo) => {
    setModalType(tipo);
  };

  const agregarItemDesdeModal = (tipo, datos) => {
    console.log("=== DEBUG: Item recibido desde modal ===");
    console.log("Tipo:", tipo);
    console.log("Datos recibidos:", {
      precioUnitario: datos.precioUnitario,
      precioUnitarioConDescuento: datos.precioUnitarioConDescuento,
      precioNeto: datos.precioNeto,
      descuento: datos.descuento,
      cantidad: datos.cantidad,
      ventaGravada: datos.ventaGravada,
      ventaExenta: datos.ventaExenta,
      ventaNoSujeta: datos.ventaNoSujeta,
      descuentoGravado: datos.descuentoGravado,
      descuentoExento: datos.descuentoExento,
      descuentoNoSujeto: datos.descuentoNoSujeto,
      total: datos.total
    });
    console.log("======================================");

    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

    const newItem = {
      id: newId,
      tipo: tipo,
      descripcion: datos.descripcion,
      cantidad: datos.cantidad,
      codigo: datos.codigo,
      precioUnitario: datos.precioUnitario, 
      precioUnitarioConDescuento: datos.precioUnitarioConDescuento, 
      precioNeto: datos.precioNeto, 
      descuento: datos.descuento, 
      valorDescuento: datos.valorDescuento,
      unidadMedida: datos.unidadMedida,
      tributos: datos.tributos,
      productoId: datos.productoId,
      actualizarStock: datos.actualizarStock,
      stockAnterior: datos.stockAnterior,
      esServicio: datos.esServicio,
      
      ventaGravada: datos.ventaGravada || 0,
      ventaExenta: datos.ventaExenta || 0,
      ventaNoSujeta: datos.ventaNoSujeta || 0,
      descuentoGravado: datos.descuentoGravado || 0,
      descuentoExento: datos.descuentoExento || 0,
      descuentoNoSujeto: datos.descuentoNoSujeto || 0,
      total: datos.total 
    };
    
    setItems([...items, newItem]);
    setShowModal(false);
    setModalType("");
    setProductoSeleccionado(null);
    setTotalModal(0);
  };

  const obtenerNombreUnidad = (codigoUnidad) => {
    const unidad = unidades.find(u => u.codigo === codigoUnidad.toString());
    return unidad ? unidad.nombre : "Unidad";
  };

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

  const handleSeleccionProducto = (productoId) => {
    const producto = productosCargados.find(p => p.id === parseInt(productoId));
    if (producto) {
      setProductoSeleccionado(producto);

      setTimeout(() => {
        calcularTotalProducto();
      }, 100);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${!isMobile ? "md:translate-x-0 md:w-64" : ""}`}>
        <Sidebar />
      </div>

      <div className="text-black flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Nota de Remisión</h1>
              <p className="text-gray-600">Sistema de facturación electrónica</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* <div className="bg-green-100 p-3 rounded-lg">
                <p className="text-lg font-semibold text-green-600">N° {String(numeroFactura).padStart(4, '0')}</p>
              </div> */}
              <FechaHoraEmision onFechaHoraChange={handleFechaHoraChange} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">

              {errorValidacion && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    <span>{errorValidacion}</span>
                  </div>
                </div>
              )}

              <DatosEmisorReceptor
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
                idReceptor={idReceptor}
                setIdReceptor={setIdReceptor}
                
                actividadEconomica={actividadEconomica}
                setActividadEconomica={setActividadEconomica}
                direccionEmisor={direccionEmisor}
                setDireccionEmisor={setDireccionEmisor}
                correoVendedor={correoVendedor}
                setCorreoVendedor={setCorreoVendedor}
                telefonoEmisor={telefonoEmisor}
                setTelefonoEmisor={setTelefonoEmisor}
                idEmisor={idEmisor}

                actividadEconomicaCliente={actividadEconomicaCliente}
                setActividadEconomicaCliente={setActividadEconomicaCliente}
                actividadesEconomicasCliente={actividadesEconomicasCliente}
                setActividadesEconomicasCliente={setActividadesEconomicasCliente}

                actividadesEconomicas={codactividad}
              />

              <div className="text-black mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Detalle de Nota de Remisión</h2>
                  <button
                    onClick={openModalSelector}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    <FaPlus className="mr-2" />
                    Agregar Detalle
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Unidad de Medida</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Descripción</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Cantidad</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Precio</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Sub Total</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Desc. Gravado</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Desc. Exento</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Desc. Sujeto</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Total Gravado</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Total Exento</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Total No Sujeto</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">IVA Item</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Total</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.length === 0 ? (
                        <tr><td colSpan="14" className="px-4 py-4 text-center text-gray-500 border-b">No hay items agregados. Haga clic en "Agregar Detalle" para comenzar.</td></tr>
                      ) : (
                        items.map((item) => {
                          // USAR LOS VALORES DIRECTOS QUE YA VIENEN CALCULADOS DEL MODAL
                          const subtotal = item.precioNeto * item.cantidad;
                          const totalGravado = item.ventaGravada || 0;
                          const totalExento = item.ventaExenta || 0;
                          const totalNoSujeto = item.ventaNoSujeta || 0;
                          const ivaItem = item.ventaGravada ? item.ventaGravada * 0.13 : 0;
                          const totalItem = totalGravado + totalExento + totalNoSujeto;

                          return (
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
                                {formatMoney(subtotal)}
                              </td>
                              <td className="px-4 py-2 border-b text-center">
                                <span className="text-sm text-red-600 font-medium">
                                  {formatMoney(item.descuentoGravado || 0)}
                                </span>
                              </td>
                              <td className="px-4 py-2 border-b text-center">
                                <span className="text-sm text-red-600 font-medium">
                                  {formatMoney(item.descuentoExento || 0)}
                                </span>
                              </td>
                              <td className="px-4 py-2 border-b text-center">
                                <span className="text-sm text-red-600 font-medium">
                                  {formatMoney(item.descuentoNoSujeto || 0)}
                                </span>
                              </td>
                              <td className="px-4 py-2 border-b text-center text-green-600 font-medium">
                                {formatMoney(totalGravado)}
                              </td>
                              <td className="px-4 py-2 border-b text-center text-green-600 font-medium">
                                {formatMoney(totalExento)}
                              </td>
                              <td className="px-4 py-2 border-b text-center text-green-600 font-medium">
                                {formatMoney(totalNoSujeto)}
                              </td>
                              <td className="px-4 py-2 border-b text-center text-green-600 font-medium">
                                {formatMoney(ivaItem)}
                              </td>
                              <td className="px-4 py-2 border-b text-center font-bold text-blue-700">
                                {formatMoney(totalItem)}
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
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal sin impuestos:</span>
                      <span className="font-medium">{formatMoney(sumaopesinimpues)}</span>
                    </div>
                    
                    {(() => {
                      const totalDescuentoGravado = items.reduce((sum, item) => sum + (item.descuentoGravado || 0), 0);
                      const totalDescuentoExento = items.reduce((sum, item) => sum + (item.descuentoExento || 0), 0);
                      const totalDescuentoNoSujeto = items.reduce((sum, item) => sum + (item.descuentoNoSujeto || 0), 0);
                      
                      return (
                        <>
                          {totalDescuentoGravado > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span className="text-sm">Descuento ventas gravadas:</span>
                              <span className="text-sm font-medium">-{formatMoney(totalDescuentoGravado)}</span>
                            </div>
                          )}
                          {totalDescuentoExento > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span className="text-sm">Descuento ventas exentas:</span>
                              <span className="text-sm font-medium">-{formatMoney(totalDescuentoExento)}</span>
                            </div>
                          )}
                          {totalDescuentoNoSujeto > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span className="text-sm">Descuento ventas no sujetas:</span>
                              <span className="text-sm font-medium">-{formatMoney(totalDescuentoNoSujeto)}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    <div className="flex justify-between text-red-600">
                      <span className="text-gray-700">Total descuentos:</span>
                      <span className="font-medium">-{formatMoney(totaldescuento)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-700 font-semibold">Sub Total después de descuentos:</span>
                      <span className="font-semibold">{formatMoney(sumaopesinimpues - totaldescuento)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-1 pl-4 border-l-2 border-gray-300">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gravado:</span>
                        <span className="font-medium">
                          {formatMoney(
                            items.reduce((sum, item) => sum + (item.ventaGravada || 0), 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exento:</span>
                        <span className="font-medium">
                          {formatMoney(
                            items.reduce((sum, item) => sum + (item.ventaExenta || 0), 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">No Sujeto:</span>
                        <span className="font-medium">
                          {formatMoney(
                            items.reduce((sum, item) => sum + (item.ventaNoSujeta || 0), 0)
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-700">IVA (13% sobre ventas gravadas):</span>
                      <span className="font-medium text-green-600">+{formatMoney(valoriva)}</span>
                    </div>
                    
                    {/* Mostrar retención de IVA si aplica */}
                    {retencionIVA.aplicar && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span className="text-gray-600">
                          Retención IVA ({retencionIVA.porcentaje}%):
                        </span>
                        <span className="font-medium">
                          -{formatMoney(retencionIVA.monto)}
                        </span>
                      </div>
                    )}
                    
                    {/* Mostrar percepción de IVA si aplica */}
                    {percepcionIVA.aplicar && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span className="text-gray-600">
                          Percepción IVA ({percepcionIVA.porcentaje}%):
                        </span>
                        <span className="font-medium">
                          +{formatMoney(percepcionIVA.monto)}
                        </span>
                      </div>
                    )}

                    {Object.values(tributosDetallados)
                      .filter(tributo => tributo.codigo !== "20")
                      .map((tributo) => (
                        <div key={tributo.codigo} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {tributo.codigo} - {tributo.descripcion}:
                          </span>
                          <span className="font-medium text-green-600">
                            +{formatMoney(tributo.valor)}
                          </span>
                        </div>
                      ))
                    }
                    
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-900 font-bold text-lg">Total a pagar:</span>
                      <span className="text-green-800 font-bold text-lg">{formatMoney(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retención de IVA */}
              {/* SECCIÓN COMENTADA - NO MOSTRAR CUADROS DE RETENCIÓN IVA
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Retención de IVA</h3>
                
                <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-6">
                  {/* Checkbox para aplicar retención */}
                  {/* <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aplicarRetencionIVA"
                      checked={retencionIVA.aplicar}
                      onChange={(e) => {
                        const aplicar = e.target.checked;
                        setRetencionIVA({
                          aplicar,
                          porcentaje: aplicar ? retencionIVA.porcentaje : 1,
                          monto: aplicar ? calcularRetencionIVA() : 0
                        });
                      }}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="aplicarRetencionIVA" className="ml-2 text-gray-700 font-medium">
                      Aplicar Retención de IVA
                    </label>
                  </div>

                  {/* Selector de porcentaje */}
                  {/* {retencionIVA.aplicar && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="retencion1porciento"
                          name="porcentajeRetencion"
                          value="1"
                          checked={retencionIVA.porcentaje === 1}
                          onChange={(e) => {
                            const nuevoPorcentaje = parseInt(e.target.value);
                            setRetencionIVA(prev => ({
                              ...prev,
                              porcentaje: nuevoPorcentaje,
                              monto: calcularRetencionIVA(nuevoPorcentaje)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="retencion1porciento" className="ml-2 text-gray-700">
                          1% 
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="retencion13porciento"
                          name="porcentajeRetencion"
                          value="13"
                          checked={retencionIVA.porcentaje === 13}
                          onChange={(e) => {
                            const nuevoPorcentaje = parseInt(e.target.value);
                            setRetencionIVA(prev => ({
                              ...prev,
                              porcentaje: nuevoPorcentaje,
                              monto: calcularRetencionIVA(nuevoPorcentaje)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="retencion13porciento" className="ml-2 text-gray-700">
                          13% 
                        </label>
                      </div>

                      {/* Mostrar monto calculado */}
                      {/* <div className="ml-4">
                        <span className="text-sm text-gray-600">Monto a retener:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          {formatMoney(retencionIVA.monto)}
                        </span>
                      </div>
                    </div>
                  )} */}
                {/* </div>

                {retencionIVA.aplicar && (
                  <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    <p>
                      <FaInfoCircle className="inline mr-1 text-blue-500" />
                      Se aplicará retención del {retencionIVA.porcentaje}% sobre el total gravado del crédito.
                    </p>
                  </div>
                )}
              </div> */}
              {/* FIN SECCIÓN COMENTADA */}

              {/* Percepción de IVA */}
              {/* SECCIÓN COMENTADA - NO MOSTRAR CUADROS DE PERCEPCIÓN IVA
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Percepción de IVA</h3>
                
                <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-6">
                  {/* Checkbox para aplicar percepción */}
                  {/* <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aplicarPercepcionIVA"
                      checked={percepcionIVA.aplicar}
                      onChange={(e) => {
                        const aplicar = e.target.checked;
                        setPercepcionIVA({
                          aplicar,
                          porcentaje: aplicar ? percepcionIVA.porcentaje : 1,
                          monto: aplicar ? calcularPercepcionIVA() : 0
                        });
                      }}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="aplicarPercepcionIVA" className="ml-2 text-gray-700 font-medium">
                      Aplicar Percepción de IVA
                    </label>
                  </div>

                  {/* Selector de porcentaje */}
                  {/* {percepcionIVA.aplicar && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="percepcion1porciento"
                          name="porcentajePercepcion"
                          value="1"
                          checked={percepcionIVA.porcentaje === 1}
                          onChange={(e) => {
                            const nuevoPorcentaje = parseInt(e.target.value);
                            setPercepcionIVA(prev => ({
                              ...prev,
                              porcentaje: nuevoPorcentaje,
                              monto: calcularPercepcionIVA(nuevoPorcentaje)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="percepcion1porciento" className="ml-2 text-gray-700">
                          1% 
                        </label>
                      </div>

                      {/* Mostrar monto calculado */}
                      {/* <div className="ml-4">
                        <span className="text-sm text-gray-600">Monto a percibir:</span>
                        <span className="ml-2 font-semibold text-blue-600">
                          {formatMoney(percepcionIVA.monto)}
                        </span>
                      </div>
                    </div>
                  )} */}
                {/* </div>

                {percepcionIVA.aplicar && (
                  <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    <p>
                      <FaInfoCircle className="inline mr-1 text-blue-500" />
                      Se aplicará percepción del {percepcionIVA.porcentaje}% sobre el total gravado del crédito.
                    </p>
                  </div>
                )}
              </div> */}
              {/* FIN SECCIÓN COMENTADA */}

              <FormaPago 
                condicionPago={condicionPago}
                setCondicionPago={setCondicionPago}
                formasPago={formasPago}
                setFormasPago={setFormasPago}
                totalFactura={total}
              />

              <DatosEntrega 
                onDatosEntregaChange={handleDatosEntregaChange}
                receptorDocumento={numeroDocumentoReceptor}
                receptorNombre={nombreReceptor}
                emisorDocumento={emisorDocumento}
                emisorNombre={emisorNombre}
              />

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleConfirmarYGuardar}
                  disabled={guardandoFactura}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    guardandoFactura 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700" 
                  } text-white`}
                >
                  {guardandoFactura ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaEye className="mr-2" />
                      Guardar Nota
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <SelectorModal
        isOpen={showModal && modalType === "selector"}
        onClose={() => setShowModal(false)}
        onSelectTipoDetalle={selectTipoDetalle}
      />

      <ProductModal
        isOpen={showModal && modalType === "producto"}
        onClose={() => {
          setShowModal(false);
          setProductoSeleccionado(null);
          setTotalModal(0);
        }}
        onAddItem={(itemData) => agregarItemDesdeModal("producto", itemData)}
        onBackToSelector={() => setModalType("selector")}
        productosCargados={productosCargados}
        cargandoProductos={cargandoProductos}
        errorCargaProductos={errorCargaProductos}
        unidades={unidades}
        obtenerNombreUnidad={obtenerNombreUnidad}
        totalCalculado={totalModal} 
        onTotalChange={setTotalModal}
      />

      <NonTaxableModal
        isOpen={showModal && modalType === "noAfecto"}
        onClose={() => {
          setShowModal(false);
          setModalType("");
        }}
        onAddItem={(itemData) => agregarItemDesdeModal("noAfecto", itemData)}
      />

      <TaxModal
        isOpen={showModal && modalType === "impuestos"}
        onClose={() => {
          setShowModal(false);
          setModalType("");
        }}
        onAddItem={(itemData) => agregarItemDesdeModal("impuestos", itemData)}
      />

      <ClientListModal
        isOpen={showClientList && searchTerm}
        onClose={() => setShowClientList(false)}
        clients={clientesFiltrados}
        onSelectClient={showClientDetailsPopup}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApplyDiscounts={handleApplyDiscounts}
        currentGrabadasDiscount={descuentoGrabadasMonto}  
        currentExentasDiscount={descuentoExentasMonto}    
      />

      <ConfirmacionFacturaModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={guardarFactura}
        datosFactura={prepararDatosFactura()}
      />

      <MensajeModal
        isOpen={mostrarMensaje}
        onClose={() => setMostrarMensaje(false)}
        tipo={mensajeConfig.tipo}
        titulo={mensajeConfig.titulo}
        mensaje={mensajeConfig.mensaje}
        detalles={mensajeConfig.detalles}
        idFactura={mensajeConfig.idFactura}
        onDescargarTicket={descargarTicketFactura}
        descargando={descargandoTicket}
      />

      <VistaPreviaModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        htmlContent={previewHtml}
        onConfirm={guardarFactura}
        isSaving={guardandoFactura}
      />

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