"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash, FaSave, FaPrint, FaFileDownload, FaSearch, FaRegCalendarAlt, FaTags, FaUserEdit, FaShoppingCart, FaInfoCircle, FaExclamationTriangle, FaTimes, FaMoneyBill, FaPercent, FaSpinner } from "react-icons/fa";
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
  const [modalType, setModalType] = useState(""); 
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

  // Inicializar correo desde user o, si no hay, desde localStorage
  useEffect(() => {
    const fromUser =
      (user && (user.correoEmpleado || user.emailemp || user.email)) || "";

    if (fromUser) {
      setCorreoVendedor(fromUser);
      return;
    }

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
    { codigo: "55", nombre: "Kilómetro" },
    { codigo: "56", nombre: "Medio millar" },
    { codigo: "57", nombre: "Ciento" },
    { codigo: "58", nombre: "Docena" },
    { codigo: "59", nombre: "Unidad" },
    { codigo: "99", nombre: "Otra" },
  ]);

  const validarDatosFactura = () => {
    if (!nombreReceptor.trim()) {
      const mensaje = "El nombre del cliente es obligatorio";
      setErrorValidacion(mensaje);
      alert(mensaje);
      return false;
    }
    
    if (!numeroDocumentoReceptor.trim()) {
      const mensaje = "El documento del cliente es obligatorio";
      setErrorValidacion(mensaje);
      alert(mensaje);
      return false;
    }
    
    if (items.length === 0) {
      const mensaje = "Debe agregar al menos un item a la factura";
      setErrorValidacion(mensaje);
      alert(mensaje);
      return false;
    }
    
    if (formasPago.length === 0) {
      const mensaje = "Debe especificar al menos una forma de pago";
      setErrorValidacion(mensaje);
      alert(mensaje);
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
        alert("Error: No se pudo determinar la forma de pago");
        setGuardandoFactura(false); 
        return;
      }
      
      console.log("Enviando encabezado:", datosFactura);
      
      const responseEncabezado = await fetch("http://localhost:3000/facturas/encabezado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(datosFactura)
      });

      if (responseEncabezado.ok) {
        const result = await responseEncabezado.json();
        console.log("Encabezado de factura guardado:", result);
        
        const detallesGuardados = await guardarDetallesFactura(result.iddtefactura);
        
        if (detallesGuardados) {
          setShowConfirmModal(false);
          alert(`Factura ${result.ncontrol} guardada exitosamente`);
          reiniciarEstados();
        }
      } else {
        const errorText = await responseEncabezado.text();
        throw new Error(`Error del servidor: ${errorText}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar la factura: " + error.message);
    } finally {
      setGuardandoFactura(false);
    }
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
};


const verDatosFactura = () => {
  if (items.length === 0) {
    alert("La factura debe tener al menos un item");
    return;
  }
  
  const datosFactura = prepararDatosFactura();
  
  console.log("====== DATOS COMPLETOS DE FACTURA (SOLO VISUALIZACIÓN) ======");
  console.log("ENCABEZADO:");
  console.log(JSON.stringify(datosFactura, null, 2));
  
  const detalles = items.map((item, index) => {
    const subtotalItem = item.precioUnitario * item.cantidad;
    const descuentoItem = subtotalItem * (item.descuento / 100);
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
      preciouni: parseFloat(item.precioUnitario.toFixed(2)),
      montodescu: parseFloat(descuentoItem.toFixed(2)),
      ventanosuj: 0.00,
      ventaexenta: esExento ? parseFloat(baseImponible.toFixed(2)) : 0.00,
      ventagravada: esGravado ? parseFloat(baseImponible.toFixed(2)) : 0.00,
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
  
  alert("Datos de factura mostrados en consola. Revisa la consola del navegador (F12).");
};

const actualizarStockProductos = async (itemsFactura) => {
  try {
    // Filtrar solo items que son productos, necesitan actualización de stock y NO son servicios
    const productosParaActualizar = itemsFactura.filter(item => 
      item.actualizarStock && item.productoId && item.tipo === "producto"
    );

    console.log("Productos a actualizar stock:", productosParaActualizar);

    // Actualizar stock para cada producto
    for (const producto of productosParaActualizar) {
      try {
        const response = await fetch(`http://localhost:3000/productos/decrementStock/${producto.productoId}`, {
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
      const subtotalItem = item.precioUnitario * item.cantidad;
      const descuentoItem = subtotalItem * (item.descuento / 100);
      const baseImponible = subtotalItem - descuentoItem;

      const esGravado = item.tipo === "producto" || item.tipo === "impuestos";
      const esExento = item.tipo === "noAfecto";

      const tasaIVA = 13;
      const ivaItem = esGravado ? 
        (baseImponible * tasaIVA) / (100 + tasaIVA) : 0;

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
        preciouni: parseFloat(item.precioUnitario.toFixed(2)),
        montodescu: parseFloat(descuentoItem.toFixed(2)),
        ventanosuj: 0.00,
        ventaexenta: esExento ? parseFloat(baseImponible.toFixed(2)) : 0.00,
        ventagravada: esGravado ? parseFloat(baseImponible.toFixed(2)) : 0.00,
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

    const responseDetalles = await fetch(`http://localhost:3000/facturas/${iddtefactura}/detalles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(datosDetalles),
    });

    if (responseDetalles.ok) {
      const resultDetalles = await responseDetalles.json();
      console.log("Detalles de factura guardados:", resultDetalles);
      
      // ACTUALIZAR STOCK DESPUÉS DE GUARDAR LOS DETALLES
      await actualizarStockProductos(items);
      
      return true;
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
        const ultimoNumero = typeof data.ultimaFactura === 'number' ? data.ultimaFactura + 1 : 1;
        setNumeroFactura(ultimoNumero);
      } else {
        console.warn("No se pudo obtener el último número, usando 1 por defecto");
        setNumeroFactura(1);
      }
    } catch (error) {
      console.error("Error al obtener el último número de factura:", error);
      setNumeroFactura(1);
    }
  };

  const prepararDatosFactura = () => {
    const subtotal = sumaopesinimpues - totaldescuento;
    const totalPagar = total;
    
    const ahora = new Date();
    const fechaEmision = fechaHoraEmision.fechaEmision || ahora.toISOString().split('T')[0];
    const horaEmision = fechaHoraEmision.horaEmision || ahora.toTimeString().split(' ')[0];

    let formapagoValue = "Efectivo";
    
    if (formasPago && formasPago.length > 0) {
      const metodoPago = formasPago[0]?.metodo?.toLowerCase() || "";
      
    if (formasPago && formasPago.length > 0) {
        const metodoPago = formasPago[0]?.metodo || "";
        formapagoValue = metodoPago || "Efectivo";
      }
    }

    const gravadasBase = items
      .filter(item => item.tipo === "producto" || item.tipo === "impuestos")
      .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    
    const exentasBase = items
      .filter(item => item.tipo === "noAfecto")
      .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    
    const gravadasConDescuento = gravadasBase - 
      (items.filter(item => item.tipo === "producto" || item.tipo === "impuestos")
        .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad * (item.descuento / 100)), 0)) - 
      descuentoGrabadasMonto;
    
    const exentasConDescuento = exentasBase - 
      (items.filter(item => item.tipo === "noAfecto")
        .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad * (item.descuento / 100)), 0)) - 
      descuentoExentasMonto;

    const tasaIVA = 13;
    const ivaIncluido = gravadasConDescuento > 0 ? 
      (gravadasConDescuento * tasaIVA) / (100 + tasaIVA) : 0;

      return {
        idcliente: cliente?.id || 1,
        sellorec: "", 
        modelofac: "01",
        verjson: "1.0",
        tipotran: "1",
        fechaemision: fechaEmision,
        horaemision: horaEmision,
        transaccioncontable: `TRX-${numeroFactura}`,
        tipoventa: condicionPago.toLowerCase() === "contado" ? "contado" : "credito",
        formapago: formapagoValue,
        estado: "",

        sumaopesinimpues: parseFloat(sumaopesinimpues.toFixed(2)),
        totaldescuento: parseFloat(totaldescuento.toFixed(2)),
        valoriva: parseFloat(ivaIncluido.toFixed(2)), 
        subtotal: parseFloat(subtotal.toFixed(2)),
        ivapercibido: parseFloat(ivaIncluido.toFixed(2)),
        montototalope: parseFloat(subtotal.toFixed(2)),
        totalotrosmnoafectos: parseFloat(exentasConDescuento.toFixed(2)),
        totalapagar: parseFloat(totalPagar.toFixed(2)),
        valorletras: convertirNumeroALetras(totalPagar),
        tipocontingencia: "",
        motivocontin: "",

        totalnosuj: 0.00,
        totalexenta: parseFloat(exentasConDescuento.toFixed(2)),
        totalgravada: parseFloat(gravadasConDescuento.toFixed(2)),
        subtotalventas: parseFloat(subtotal.toFixed(2)),

        descunosuj: 0.00,
        descuexenta: parseFloat(descuentoExentasMonto.toFixed(2)),
        descugravada: parseFloat(descuentoGrabadasMonto.toFixed(2)),
        porcentajedescuento: totaldescuento > 0 ? parseFloat(((totaldescuento / sumaopesinimpues) * 100).toFixed(2)) : 0.00,
        totaldescu: parseFloat(totaldescuento.toFixed(2)),
        tributosf: null,
        codigot: "",
        descripciont: "",
        valort: 0.00,

        ivaperci1: parseFloat(ivaIncluido.toFixed(2)),
        ivarete1: 0.00,
        reterenta: 0.00,

        montototaloperacion: parseFloat(subtotal.toFixed(2)),
        totalpagar: parseFloat(totalPagar.toFixed(2)), 
        totalpagar: parseFloat(totalPagar.toFixed(2)),
        totalletras: convertirNumeroALetras(totalPagar),
        totaliva: parseFloat(ivaIncluido.toFixed(2)),
        saldofavor: 0.00,

        condicionoperacion: 1,
        codigo: "01",
        montopago: parseFloat(totalPagar.toFixed(2)),
        referencia: "",
        plazo: null,
        periodo: null,
        numpagoelectronico: "",
        nombrecibe: datosEntrega.receptorNombre || nombreReceptor || "",
        docurecibe: datosEntrega.receptorDocumento || numeroDocumentoReceptor || "",

        documentofirmado: null
      };
  };

  const convertirNumeroALetras = (numero) => {
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

    if (entero === 0) return "CERO";

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

    return partes.join(" ");
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

  const clientesFiltrados = Array.isArray(clientes) ? clientes.filter(
    (cliente) =>
      (cliente?.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.nit?.toString() || "").includes(searchTerm.toLowerCase()) ||
      (cliente?.dui?.toString() || "").includes(searchTerm.toLowerCase())
  ) : [];

useEffect(() => {
  const suma = items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  
  const descuentoItems = items.reduce((sum, item) => 
    sum + (item.precioUnitario * item.cantidad * (item.descuento / 100)), 0);

  const gravadasBase = items
    .filter(item => item.tipo === "producto" || item.tipo === "impuestos")
    .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  
  const exentasBase = items
    .filter(item => item.tipo === "noAfecto")
    .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

  const descuentoGrabadas = descuentoGrabadasMonto;
  const descuentoExentas = descuentoExentasMonto;
  
  const descuentoTotal = descuentoItems + descuentoGrabadas + descuentoExentas;
  
  const gravadasConDescuento = gravadasBase - 
    (items.filter(item => item.tipo === "producto" || item.tipo === "impuestos")
      .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad * (item.descuento / 100)), 0)) - 
    descuentoGrabadas;
  
  const exentasConDescuento = exentasBase - 
    (items.filter(item => item.tipo === "noAfecto")
      .reduce((sum, item) => sum + (item.precioUnitario * item.cantidad * (item.descuento / 100)), 0)) - 
    descuentoExentas;

  const tasaIVA = 13; 
  const ivaIncluido = gravadasConDescuento > 0 ? 
    (gravadasConDescuento * tasaIVA) / (100 + tasaIVA) : 0;

  const total = gravadasConDescuento + exentasConDescuento;

  setSumaopesinimpues(parseFloat(suma.toFixed(2)));
  setTotaldescuento(parseFloat(descuentoTotal.toFixed(2)));
  setVentasgrabadas(parseFloat(gravadasConDescuento.toFixed(2)));
  setValoriva(parseFloat(ivaIncluido.toFixed(2))); 
  setTotal(parseFloat(total.toFixed(2)));
  
  setGravadasSinDescuentoState(parseFloat(gravadasBase.toFixed(2)));
  setExentasSinDescuentoState(parseFloat(exentasBase.toFixed(2)));
  setExentasConDescuentoState(parseFloat(exentasConDescuento.toFixed(2)));
}, [items, descuentoGrabadasMonto, descuentoExentasMonto]);

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
              <h1 className="text-2xl font-bold text-gray-800">Facturación</h1>
              <p className="text-gray-600">Sistema de facturación electrónica</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <p className="text-lg font-semibold text-blue-600">N° {String(numeroFactura).padStart(4, '0')}</p>
              </div>
              <FechaHoraEmision onFechaHoraChange={handleFechaHoraChange} />
            </div>
          </div>
        </header>

        {/* Contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            {/* Tarjeta principal */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">

              {/* Mostrar mensaje de error si existe */}
              {errorValidacion && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    <span>{errorValidacion}</span>
                  </div>
                </div>
              )}

              {/* Datos del cliente */}
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
                      <span className="text-gray-700">Subtotal sin impuestos:</span>
                      <span className="font-medium">{formatMoney(sumaopesinimpues)}</span>
                    </div>
                    
                    {descuentoGrabadasMonto > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span className="text-sm">Descuento ventas gravadas:</span>
                        <span className="text-sm font-medium">-{formatMoney(descuentoGrabadasMonto)}</span>
                      </div>
                    )}
                    {descuentoExentasMonto > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span className="text-sm">Descuento ventas exentas:</span>
                        <span className="text-sm font-medium">-{formatMoney(descuentoExentasMonto)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-red-600">
                      <span className="text-gray-700">Total descuentos:</span>
                      <span className="font-medium">-{formatMoney(totaldescuento)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-700 font-semibold">Sub Total:</span>
                      <span className="font-semibold">{formatMoney(sumaopesinimpues - totaldescuento)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Monto Total de la operación:</span>
                      <span className="font-medium">{formatMoney(sumaopesinimpues - totaldescuento)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">IVA (13%):</span>
                      <span className="font-medium">{formatMoney(valoriva)}</span>
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
                <button 
                  onClick={() => setShowDiscountModal(true)}
                  className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  <FaTags className="mr-2" />
                  Agregar Descuentos
                </button>
                {(descuentoGrabadasMonto > 0 || descuentoExentasMonto > 0) && (
                  <div className="mt-2 text-sm text-gray-600">
                    {descuentoGrabadasMonto > 0 && <p>Descuento ventas gravadas: {formatMoney(descuentoGrabadasMonto)}</p>}
                    {descuentoExentasMonto > 0 && <p>Descuento ventas exentas: {formatMoney(descuentoExentasMonto)}</p>}
                  </div>
                )}
              </div>

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

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={guardarFactura}
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
                      <FaSave className="mr-2" />
                      Guardar Factura
                    </>
                  )}
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

      {/* Modal para Descuentos */}
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