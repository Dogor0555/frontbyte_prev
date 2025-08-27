"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaBars, FaBuilding, FaPlus, FaTimes, FaEdit, FaTrash, FaUserPlus, FaUser, FaSave, FaTimes as FaClose } from "react-icons/fa";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import { useRouter } from "next/navigation";
import Select from "react-select";

// Definición de límites para los campos
const LIMITES = {
    NOMBRE: 100,
    NIT: 14,
    NRC: 8,
    GIRO: 100,
    CORREO: 100,
    TELEFONO: 8,
    COMPLEMENTO: 100,
    NOMBRE_COMERCIAL: 100,
    COD_ACTIVIDAD: 6
};

export default function PersonaJuridica({ initialEmpresas = [], user }) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [empresas, setEmpresas] = useState(initialEmpresas || []);
    const [filteredEmpresas, setFilteredEmpresas] = useState(initialEmpresas || []);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
    const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [telefonoError, setTelefonoError] = useState("");
    const [nitError, setNitError] = useState("");
    const [nrcError, setNrcError] = useState("");
    const [complementoError, setComplementoError] = useState("");
    const [formData, setFormData] = useState({
        nombre: "",
        nit: "",
        nrc: "",
        giro: "",
        correo: "",
        telefono: "",
        complemento: "",
        codactividad: "",
        nombrecomercial: "",
        departamento: "",
        municipio: "",
    });
    const [clientToDelete, setClientToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartamento, setSelectedDepartamento] = useState("");
    const [selectedMunicipio, setSelectedMunicipio] = useState("");
    const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

    // Lista de códigos de actividad
    const codactividad = [
    { codigo: "01111", nombre: "Cultivo de cereales excepto arroz y para forrajes" },
    { codigo: "01112", nombre: "Cultivo de legumbres" },
    { codigo: "01113", nombre: "Cultivo de semillas oleaginosas" },
    { codigo: "01114", nombre: "Cultivo de plantas para la preparación de semillas" },
    { codigo: "01119", nombre: "Cultivo de otros cereales excepto arroz y forrajeros n.c.p." },
    { codigo: "01120", nombre: "Cultivo de arroz" },
    { codigo: "01131", nombre: "Cultivo de raíces y tubérculos" },
    { codigo: "01132", nombre: "Cultivo de brotes, bulbos, vegetales tubérculos y cultivos similares" },
    { codigo: "01133", nombre: "Cultivo hortícola de fruto" },
    { codigo: "01134", nombre: "Cultivo de hortalizas de hoja y otras hortalizas ncp" },
    { codigo: "01140", nombre: "Cultivo de caña de azúcar" },
    { codigo: "01150", nombre: "Cultivo de tabaco" },
    { codigo: "01161", nombre: "Cultivo de algodón" },
    { codigo: "01162", nombre: "Cultivo de fibras vegetales excepto algodón" },
    { codigo: "01191", nombre: "Cultivo de plantas no perennes para la producción de semillas y flores" },
    { codigo: "01192", nombre: "Cultivo de cereales y pastos para la alimentación animal" },
    { codigo: "01199", nombre: "Producción de cultivos no estacionales ncp" },
    { codigo: "01220", nombre: "Cultivo de frutas tropicales" },
    { codigo: "01230", nombre: "Cultivo de cítricos" },
    { codigo: "01240", nombre: "Cultivo de frutas de pepita y hueso" },
    { codigo: "01251", nombre: "Cultivo de frutas ncp" },
    { codigo: "01252", nombre: "Cultivo de otros frutos y nueces de árboles y arbustos" },
    { codigo: "01260", nombre: "Cultivo de frutos oleaginosos" },
    { codigo: "01271", nombre: "Cultivo de café" },
    { codigo: "01272", nombre: "Cultivo de plantas para la elaboración de bebidas excepto café" },
    { codigo: "01281", nombre: "Cultivo de especias y aromáticas" },
    { codigo: "01282", nombre: "Cultivo de plantas para la obtención de productos medicinales y farmacéuticos" },
    { codigo: "01291", nombre: "Cultivo de árboles de hule (caucho) para la obtención de látex" },
    { codigo: "01292", nombre: "Cultivo de plantas para la obtención de productos químicos y colorantes" },
    { codigo: "01299", nombre: "Producción de cultivos perennes ncp" },
    { codigo: "01300", nombre: "Propagación de plantas" },
    { codigo: "01301", nombre: "Cultivo de plantas y flores ornamentales" },
    { codigo: "01410", nombre: "Cría y engorde de ganado bovino" },
    { codigo: "01420", nombre: "Cría de caballos y otros equinos" },
    { codigo: "01440", nombre: "Cría de ovejas y cabras" },
    { codigo: "01450", nombre: "Cría de cerdos" },
    { codigo: "01460", nombre: "Cría de aves de corral y producción de huevos" },
    { codigo: "01491", nombre: "Cría de abejas apicultura para la obtención de miel y otros productos apícolas" },
    { codigo: "01492", nombre: "Cría de conejos" },
    { codigo: "01493", nombre: "Cría de iguanas y garrobos" },
    { codigo: "01494", nombre: "Cría de mariposas y otros insectos" },
    { codigo: "01499", nombre: "Cría y obtención de productos animales n.c.p." },
    { codigo: "01500", nombre: "Cultivo de productos agrícolas en combinación con la cría de animales" },
    { codigo: "01611", nombre: "Servicios de maquinaria agrícola" },
    { codigo: "01612", nombre: "Control de plagas" },
    { codigo: "01613", nombre: "Servicios de riego" },
    { codigo: "01614", nombre: "Servicios de contratación de mano de obra para la agricultura" },
    { codigo: "01619", nombre: "Servicios agrícolas ncp" },
    { codigo: "01621", nombre: "Actividades para mejorar la reproducción, el crecimiento y el rendimiento de los animales y sus productos" },
    { codigo: "01622", nombre: "Servicios de mano de obra pecuaria" },
    { codigo: "01629", nombre: "Servicios pecuarios ncp" },
    { codigo: "01631", nombre: "Labores post cosecha de preparación de los productos agrícolas para su comercialización o para la industria" },
    { codigo: "01632", nombre: "Servicio de beneficio de café" },
    { codigo: "01633", nombre: "Servicio de beneficiado de plantas textiles (incluye el beneficiado cuando este es realizado en la misma explotación agropecuaria)" },
    { codigo: "01640", nombre: "Tratamiento de semillas para la propagación" },
    { codigo: "01700", nombre: "Caza ordinaria y mediante trampas, repoblación de animales de caza y servicios conexos" },
    { codigo: "02100", nombre: "Silvicultura y otras actividades forestales" },
    { codigo: "02200", nombre: "Extracción de madera" },
    { codigo: "02300", nombre: "Recolección de productos diferentes a la madera" },
    { codigo: "02400", nombre: "Servicios de apoyo a la silvicultura" },
    { codigo: "03110", nombre: "Pesca marítima de altura y costera" },
    { codigo: "03120", nombre: "Pesca de agua dulce" },
    { codigo: "03210", nombre: "Acuicultura marítima" },
    { codigo: "03220", nombre: "Acuicultura de agua dulce" },
    { codigo: "03300", nombre: "Servicios de apoyo a la pesca y acuicultura" },
    { codigo: "05100", nombre: "Extracción de hulla" },
    { codigo: "05200", nombre: "Extracción y aglomeración de lignito" },
    { codigo: "06100", nombre: "Extracción de petróleo crudo" },
    { codigo: "06200", nombre: "Extracción de gas natural" },
    { codigo: "07100", nombre: "Extracción de minerales de hierro" },
    { codigo: "07210", nombre: "Extracción de minerales de uranio y torio" },
    { codigo: "07290", nombre: "Extracción de minerales metalíferos no ferrosos" },
    { codigo: "08100", nombre: "Extracción de piedra, arena y arcilla" },
    { codigo: "08910", nombre: "Extracción de minerales para la fabricación de abonos y productos químicos" },
    { codigo: "08920", nombre: "Extracción y aglomeración de turba" },
    { codigo: "08930", nombre: "Extracción de sal" },
    { codigo: "08990", nombre: "Explotación de otras minas y canteras ncp" },
    { codigo: "09100", nombre: "Actividades de apoyo a la extracción de petróleo y gas natural" },
    { codigo: "09900", nombre: "Actividades de apoyo a la explotación de minas y canteras" },
    { codigo: "10101", nombre: "Servicio de rastros y mataderos de bovinos y porcinos" },
    { codigo: "10102", nombre: "Matanza y procesamiento de bovinos y porcinos" },
    { codigo: "10103", nombre: "Matanza y procesamientos de aves de corral" },
    { codigo: "10104", nombre: "Elaboración y conservación de embutidos y tripas naturales" },
    { codigo: "10105", nombre: "Servicios de conservación y empaque de carnes" },
    { codigo: "10106", nombre: "Elaboración y conservación de grasas y aceites animales" },
    { codigo: "10107", nombre: "Servicios de molienda de carne" },
    { codigo: "10108", nombre: "Elaboración de productos de carne ncp" },
    { codigo: "10201", nombre: "Procesamiento y conservación de pescado, crustáceos y moluscos" },
    { codigo: "10209", nombre: "Fabricación de productos de pescado ncp" },
    { codigo: "10301", nombre: "Elaboración de jugos de frutas y hortalizas" },
    { codigo: "10302", nombre: "Elaboración y envase de jaleas, mermeladas y frutas deshidratadas" },
    { codigo: "10309", nombre: "Elaboración de productos de frutas y hortalizas n.c.p." },
    { codigo: "10401", nombre: "Fabricación de aceites y grasas vegetales y animales comestibles" },
    { codigo: "10402", nombre: "Fabricación de aceites y grasas vegetales y animales no comestibles" },
    { codigo: "10409", nombre: "Servicio de maquilado de aceites" },
    { codigo: "10501", nombre: "Fabricación de productos lácteos excepto sorbetes y quesos sustitutos" },
    { codigo: "10502", nombre: "Fabricación de sorbetes y helados" },
    { codigo: "10503", nombre: "Fabricación de quesos" },
    { codigo: "10611", nombre: "Molienda de cereales" },
    { codigo: "10612", nombre: "Elaboración de cereales para el desayuno y similares" },
    { codigo: "10613", nombre: "Servicios de beneficiado de productos agrícolas ncp (excluye Beneficio de azúcar rama 1072 y beneficio de café rama 0163)" },
    { codigo: "10621", nombre: "Fabricación de almidón" },
    { codigo: "10628", nombre: "Servicio de molienda de maíz húmedo molino para nixtamal" },
    { codigo: "10711", nombre: "Elaboración de tortillas" },
    { codigo: "10712", nombre: "Fabricación de pan, galletas y barquillos" },
    { codigo: "10713", nombre: "Fabricación de repostería" },
    { codigo: "10721", nombre: "Ingenios azucareros" },
    { codigo: "10722", nombre: "Molienda de caña de azúcar para la elaboración de dulces" },
    { codigo: "10723", nombre: "Elaboración de jarabes de azúcar y otros similares" },
    { codigo: "10724", nombre: "Maquilado de azúcar de caña" },
    { codigo: "10730", nombre: "Fabricación de cacao, chocolates y productos de confitería" },
    { codigo: "10740", nombre: "Elaboración de macarrones, fideos, y productos farináceos similares" },
    { codigo: "10750", nombre: "Elaboración de comidas y platos preparados para la reventa en" },
    { codigo: "10791", nombre: "Elaboración de productos de café" },
    { codigo: "10792", nombre: "Elaboración de especies, sazonadores y condimentos" },
    { codigo: "10793", nombre: "Elaboración de sopas, cremas y consomé" },
    { codigo: "10794", nombre: "Fabricación de bocadillos tostados y/o fritos" },
    { codigo: "10799", nombre: "Elaboración de productos alimenticios ncp" },
    { codigo: "10800", nombre: "Elaboración de alimentos preparados para animales" },
    { codigo: "11012", nombre: "Fabricación de aguardiente y licores" },
    { codigo: "11020", nombre: "Elaboración de vinos" },
    { codigo: "11030", nombre: "Fabricación de cerveza" },
    { codigo: "11041", nombre: "Fabricación de aguas gaseosas" },
    { codigo: "11042", nombre: "Fabricación y envasado de agua" },
    { codigo: "11043", nombre: "Elaboración de refrescos" },
    { codigo: "11048", nombre: "Maquilado de aguas gaseosas" },
    { codigo: "11049", nombre: "Elaboración de bebidas no alcohólicas" },
    { codigo: "12000", nombre: "Elaboración de productos de tabaco" },
    { codigo: "13111", nombre: "Preparación de fibras textiles" },
    { codigo: "13112", nombre: "Fabricación de hilados" },
    { codigo: "13120", nombre: "Fabricación de telas" },
    { codigo: "13130", nombre: "Acabado de productos textiles" },
    { codigo: "13910", nombre: "Fabricación de tejidos de punto y ganchillo" },
    { codigo: "13921", nombre: "Fabricación de productos textiles para el hogar" },
    { codigo: "13922", nombre: "Sacos, bolsas y otros artículos textiles" },
    { codigo: "13929", nombre: "Fabricación de artículos confeccionados con materiales textiles, excepto prendas de vestir n.c.p" },
    { codigo: "13930", nombre: "Fabricación de tapices y alfombras" },
    { codigo: "13941", nombre: "Fabricación de cuerdas de henequén y otras fibras naturales (lazos, pitas)" },
    { codigo: "13942", nombre: "Fabricación de redes de diversos materiales" },
    { codigo: "13948", nombre: "Maquilado de productos trenzables de cualquier material (petates, sillas, etc.)" },
    { codigo: "13991", nombre: "Fabricación de adornos, etiquetas y otros artículos para prendas de vestir" },
    { codigo: "13992", nombre: "Servicio de bordados en artículos y prendas de tela" },
    { codigo: "13999", nombre: "Fabricación de productos textiles ncp" },
    { codigo: "14101", nombre: "Fabricación de ropa interior, para dormir y similares" },
    { codigo: "14102", nombre: "Fabricación de ropa para niños" },
    { codigo: "14103", nombre: "Fabricación de prendas de vestir para ambos sexos" },
    { codigo: "14104", nombre: "Confección de prendas a medida" },
    { codigo: "14105", nombre: "Fabricación de prendas de vestir para deportes" },
    { codigo: "14106", nombre: "Elaboración de artesanías de uso personal confeccionadas especialmente de materiales textiles" },
    { codigo: "14108", nombre: "Maquilado de prendas de vestir, accesorios y otros" },
    { codigo: "14109", nombre: "Fabricación de prendas y accesorios de vestir n.c.p." },
    { codigo: "14200", nombre: "Fabricación de artículos de piel" },
    { codigo: "14301", nombre: "Fabricación de calcetines, calcetas, medias (panty house) y otros similares" },
    { codigo: "14302", nombre: "Fabricación de ropa interior de tejido de punto" },
    { codigo: "14309", nombre: "Fabricación de prendas de vestir de tejido de punto ncp" },
    { codigo: "15110", nombre: "Curtido y adobo de cueros; adobo y teñido de pieles" },
    { codigo: "15121", nombre: "Fabricación de maletas, bolsos de mano y otros artículos de marroquinería" },
    { codigo: "15122", nombre: "Fabricación de monturas, accesorios y vainas talabartería" },
    { codigo: "15123", nombre: "Fabricación de artesanías principalmente de cuero natural y sintético" },
    { codigo: "15128", nombre: "Maquilado de artículos de cuero natural, sintético y de otros materiales" },
    { codigo: "15201", nombre: "Fabricación de calzado" },
    { codigo: "15202", nombre: "Fabricación de partes y accesorios de calzado" },
    { codigo: "15208", nombre: "Maquilado de partes y accesorios de calzado" },
    { codigo: "16100", nombre: "Aserradero y acepilladura de madera" },
    { codigo: "16210", nombre: "Fabricación de madera laminada, terciada, enchapada y contrachapada, paneles para la construcción" },
    { codigo: "16220", nombre: "Fabricación de partes y piezas de carpintería para edificios y construcciones" },
    { codigo: "16230", nombre: "Fabricación de envases y recipientes de madera" },
    { codigo: "16292", nombre: "Fabricación de artesanías de madera, semillas, materiales trenzables" },
    { codigo: "16299", nombre: "Fabricación de productos de madera, corcho, paja y materiales trenzables ncp" },
    { codigo: "17010", nombre: "Fabricación de pasta de madera, papel y cartón" },
    { codigo: "17020", nombre: "Fabricación de papel y cartón ondulado y envases de papel y cartón" },
    { codigo: "17091", nombre: "Fabricación de artículos de papel y cartón de uso personal y doméstico" },
    { codigo: "17092", nombre: "Fabricación de productos de papel ncp" },
    { codigo: "18110", nombre: "Impresión" },
    { codigo: "18120", nombre: "Servicios relacionados con la impresión" },
    { codigo: "18200", nombre: "Reproducción de grabaciones" },
    { codigo: "19100", nombre: "Fabricación de productos de hornos de coque" },
    { codigo: "19201", nombre: "Fabricación de combustible" },
    { codigo: "19202", nombre: "Fabricación de aceites y lubricantes" },
    { codigo: "20111", nombre: "Fabricación de materias primas para la fabricación de colorantes" },
    { codigo: "20112", nombre: "Fabricación de materiales curtientes" },
    { codigo: "20113", nombre: "Fabricación de gases industriales" },
    { codigo: "20114", nombre: "Fabricación de alcohol etílico" },
    { codigo: "20119", nombre: "Fabricación de sustancias químicas básicas" },
    { codigo: "20120", nombre: "Fabricación de abonos y fertilizantes" },
    { codigo: "20130", nombre: "Fabricación de plástico y caucho en formas primarias" },
    { codigo: "20210", nombre: "Fabricación de plaquicidas y otros productos químicos de uso agropecuario" },
    { codigo: "20220", nombre: "Fabricación de pinturas, barnices y productos de revestimiento similares; tintas de imprenta y masillas" },
    { codigo: "20231", nombre: "Fabricación de jabones, detergentes y similares para limpieza" },
    { codigo: "20232", nombre: "Fabricación de perfumes, cosméticos y productos de higiene y cuidado personal, incluyendo tintes, champú, etc." },
    { codigo: "20291", nombre: "Fabricación de tintas y colores para escribir y pintar; fabricación de cintas para impresoras" },
    { codigo: "20292", nombre: "Fabricación de productos pirotécnicos, explosivos y municiones" },
    { codigo: "20299", nombre: "Fabricación de productos químicos n.c.p." },
    { codigo: "20300", nombre: "Fabricación de fibras artificiales" },
    { codigo: "21001", nombre: "Manufactura de productos farmacéuticos, sustancias químicas y productos botánicos" },
    { codigo: "21008", nombre: "Maquilado de medicamentos" },
    { codigo: "22110", nombre: "Fabricación de cubiertas y cámaras; renovación y recauchutado de cubiertas" },
    { codigo: "22190", nombre: "Fabricación de otros productos de caucho" },
    { codigo: "22201", nombre: "Fabricación de envases plásticos" },
    { codigo: "22202", nombre: "Fabricación de productos plásticos para uso personal o doméstico" },
    { codigo: "22208", nombre: "Maquila de plásticos" },
    { codigo: "22209", nombre: "Fabricación de productos plásticos n.c.p." },
    { codigo: "23101", nombre: "Fabricación de vidrio" },
    { codigo: "23102", nombre: "Fabricación de recipientes y envases de vidrio" },
    { codigo: "23108", nombre: "Servicio de maquilado" },
    { codigo: "23109", nombre: "Fabricación de productos de vidrio ncp" },
    { codigo: "23910", nombre: "Fabricación de productos refractarios" },
    { codigo: "23920", nombre: "Fabricación de productos de arcilla para la construcción" },
    { codigo: "23931", nombre: "Fabricación de productos de cerámica y porcelana no refractaria" },
    { codigo: "23932", nombre: "Fabricación de productos de cerámica y porcelana ncp" },
    { codigo: "23940", nombre: "Fabricación de cemento, cal y yeso" },
    { codigo: "23950", nombre: "Fabricación de artículos de hormigón, cemento y yeso" },
    { codigo: "23960", nombre: "Corte, tallado y acabado de la piedra" },
    { codigo: "23990", nombre: "Fabricación de productos minerales no metálicos ncp" },
    { codigo: "24100", nombre: "Industrias básicas de hierro y acero" },
    { codigo: "24200", nombre: "Fabricación de productos primarios de metales preciosos y metales no ferrosos" },
    { codigo: "24310", nombre: "Fundición de hierro y acero" },
    { codigo: "24320", nombre: "Fundición de metales no ferrosos" },
    { codigo: "25111", nombre: "Fabricación de productos metálicos para uso estructural" },
    { codigo: "25118", nombre: "Servicio de maquila para la fabricación de estructuras metálicas" },
    { codigo: "25120", nombre: "Fabricación de tanques, depósitos y recipientes de metal" },
    { codigo: "25130", nombre: "Fabricación de generadores de vapor, excepto calderas de agua caliente para calefacción central" },
    { codigo: "25200", nombre: "Fabricación de armas y municiones" },
    { codigo: "25910", nombre: "Forjado, prensado, estampado y laminado de metales; pulvimetalurgia" },
    { codigo: "25920", nombre: "Tratamiento y revestimiento de metales" },
    { codigo: "25930", nombre: "Fabricación de artículos de cuchillería, herramientas de mano y artículos de ferretería" },
    { codigo: "25991", nombre: "Fabricación de envases y artículos conexos de metal" },
    { codigo: "25992", nombre: "Fabricación de artículos metálicos de uso personal y/o doméstico" },
    { codigo: "25999", nombre: "Fabricación de productos elaborados de metal ncp" },
    { codigo: "26100", nombre: "Fabricación de componentes electrónicos" },
    { codigo: "26200", nombre: "Fabricación de computadoras y equipo conexo" },
    { codigo: "26300", nombre: "Fabricación de equipo de comunicaciones" },
    { codigo: "26400", nombre: "Fabricación de aparatos electrónicos de consumo para audio, video radio y televisión" },
    { codigo: "26510", nombre: "Fabricación de instrumentos y aparatos para medir, verificar, ensayar, navegar y de control de procesos industriales" },
    { codigo: "26520", nombre: "Fabricación de relojes y piezas de relojes" },
    { codigo: "26600", nombre: "Fabricación de equipo médico de irradiación y equipo electrónico de uso médico y terapéutico" },
    { codigo: "26700", nombre: "Fabricación de instrumentos de óptica y equipo fotográfico" },
    { codigo: "26800", nombre: "Fabricación de medios magnéticos y ópticos" },
    { codigo: "27100", nombre: "Fabricación de motores, generadores, transformadores eléctricos, aparatos de distribución y control de electricidad" },
    { codigo: "27200", nombre: "Fabricación de pilas, baterías y acumuladores" },
    { codigo: "27310", nombre: "Fabricación de cables de fibra óptica" },
    { codigo: "27320", nombre: "Fabricación de otros hilos y cables eléctricos" },
    { codigo: "27330", nombre: "Fabricación de dispositivos de cableados" },
    { codigo: "27400", nombre: "Fabricación de equipo eléctrico de iluminación" },
    { codigo: "27500", nombre: "Fabricación de aparatos de uso doméstico" },
    { codigo: "27900", nombre: "Fabricación de otros tipos de equipo eléctrico" },
    { codigo: "28110", nombre: "Fabricación de motores y turbinas, excepto motores para aeronaves, vehículos automotores y motocicletas" },
    { codigo: "28120", nombre: "Fabricación de equipo hidráulico" },
    { codigo: "28130", nombre: "Fabricación de otras bombas, compressores, grifos y válvulas" },
    { codigo: "28140", nombre: "Fabricación de cojinetes, engranajes, trenes de engranajes y piezas de transmisión" },
    { codigo: "28150", nombre: "Fabricación de hornos y quemadores" },
    { codigo: "28160", nombre: "Fabricación de equipo de elevación y manipulación" },
    { codigo: "28170", nombre: "Fabricación de maquinaria y equipo de oficina" },
    { codigo: "28180", nombre: "Fabricación de herramientas manuales" },
    { codigo: "28190", nombre: "Fabricación de otros tipos de maquinaria de uso general" },
    { codigo: "28210", nombre: "Fabricación de maquinaria agropecuaria y forestal" },
    { codigo: "28220", nombre: "Fabricación de máquinas para conformar metales y maquinaria herramienta" },
    { codigo: "28230", nombre: "Fabricación de maquinaria metalúrgica" },
    { codigo: "28240", nombre: "Fabricación de maquinaria para la explotación de minas y canteras y para obras de construcción" },
    { codigo: "28250", nombre: "Fabricación de maquinaria para la elaboración de alimentos, bebidas y tabaco" },
    { codigo: "28260", nombre: "Fabricación de maquinaria para la elaboración de productos textiles, prendas de vestir y cueros" },
    { codigo: "28291", nombre: "Fabricación de máquinas para imprenta" },
    { codigo: "28299", nombre: "Fabricación de maquinaria de uso especial ncp" },
    { codigo: "29100", nombre: "Fabricación vehículos automotores" },
    { codigo: "29200", nombre: "Fabricación de carrocerías para vehículos automotores; fabricación de remolques y semiremolques" },
    { codigo: "29300", nombre: "Fabricación de partes, piezas y accesorios para vehículos automotores" },
    { codigo: "30110", nombre: "Fabricación de buques" },
    { codigo: "30120", nombre: "Construcción y reparación de embarcaciones de recreo" },
    { codigo: "30200", nombre: "Fabricación de locomotoras y de material rodante" },
    { codigo: "30300", nombre: "Fabricación de aeronaves y naves espaciales" },
    { codigo: "30400", nombre: "Fabricación de vehículos militares de combate" },
    { codigo: "30910", nombre: "Fabricación de motocicletas" },
    { codigo: "30920", nombre: "Fabricación de bicicletas y sillones de ruedas para inválidos" },
    { codigo: "30990", nombre: "Fabricación de equipo de transporte ncp" },
    { codigo: "31001", nombre: "Fabricación de colchones y somier" },
    { codigo: "31002", nombre: "Fabricación de muebles y otros productos de madera a medida" },
    { codigo: "31008", nombre: "Servicios de maquilado de muebles" },
    { codigo: "31009", nombre: "Fabricación de muebles ncp" },
    { codigo: "32110", nombre: "Fabricación de joyas platerías y joyerías" },
    { codigo: "32120", nombre: "Fabricación de joyas de imitación (fantasía) y artículos conexos" },
    { codigo: "32200", nombre: "Fabricación de instrumentos musicales" },
    { codigo: "32301", nombre: "Fabricación de artículos de deporte" },
    { codigo: "32308", nombre: "Servicio de maquila de productos deportivos" },
    { codigo: "32401", nombre: "Fabricación de juegos de mesa y de salón" },
    { codigo: "32402", nombre: "Servicio de maquilado de juguetes y juegos" },
    { codigo: "32409", nombre: "Fabricación de juegos y juguetes n.c.p." },
    { codigo: "32500", nombre: "Fabricación de instrumentos y materiales médicos y odontológicos" },
    { codigo: "32901", nombre: "Fabricación de lápices, bolígrafos, sellos y artículos de librería en general" },
    { codigo: "32902", nombre: "Fabricación de escobas, cepillos, pinceles y similares" },
    { codigo: "32903", nombre: "Fabricación de artesanías de materiales diversos" },
    { codigo: "32904", nombre: "Fabricación de artículos de uso personal y domésticos n.c.p." },
    { codigo: "32905", nombre: "Fabricación de accesorios para las confecciones y la marroquinería n.c.p." },
    { codigo: "32908", nombre: "Servicios de maquila ncp" },
    { codigo: "32909", nombre: "Fabricación de productos manufacturados n.c.p." },
    { codigo: "33110", nombre: "Reparación y mantenimiento de productos elaborados de metal" },
    { codigo: "33120", nombre: "Reparación y mantenimiento de maquinaria" },
    { codigo: "33130", nombre: "Reparación y mantenimiento de equipo electrónico y óptico" },
    { codigo: "33140", nombre: "Reparación y mantenimiento de equipo eléctrico" },
    { codigo: "33150", nombre: "Reparación y mantenimiento de equipo de transporte, excepto vehículos automotores" },
    { codigo: "33190", nombre: "Reparación y mantenimiento de equipos n.c.p." },
    { codigo: "33200", nombre: "Instalación de maquinaria y equipo industrial" },
    { codigo: "35101", nombre: "Generación de energía eléctrica" },
    { codigo: "35102", nombre: "Transmisión de energía eléctrica" },
    { codigo: "35103", nombre: "Distribución de energía eléctrica" },
    { codigo: "35200", nombre: "Fabricación de gas, distribución de combustibles gaseosos por tuberías" },
    { codigo: "35300", nombre: "Suministro de vapor y agua caliente" },
    { codigo: "36000", nombre: "Captación, tratamiento y suministro de agua" },
    { codigo: "37000", nombre: "Evacuación de aguas residuales (alcantarillado)" },
    { codigo: "38110", nombre: "Recolección y transporte de desechos sólidos proveniente de hogares y sector urbano" },
    { codigo: "38120", nombre: "Recolección de desechos peligrosos" },
    { codigo: "38210", nombre: "Tratamiento y eliminación de desechos inicuos" },
    { codigo: "38220", nombre: "Tratamiento y eliminación de desechos peligrosos" },
    { codigo: "38301", nombre: "Reciclaje de desperdicios y desechos textiles" },
    { codigo: "38302", nombre: "Reciclaje de desperdicios y desechos de plástico y caucho" },
    { codigo: "38303", nombre: "Reciclaje de desperdicios y desechos de vidrio" },
    { codigo: "38304", nombre: "Reciclaje de desperdicios y desechos de papel y cartón" },
    { codigo: "38305", nombre: "Reciclaje de desperdicios y desechos metálicos" },
    { codigo: "38309", nombre: "Reciclaje de desperdicios y desechos no metálicos n.c.p." },
    { codigo: "39000", nombre: "Actividades de Saneamiento y otros Servicios de Gestión de Desechos" },
    { codigo: "41001", nombre: "Construcción de edificios residenciales" },
    { codigo: "41002", nombre: "Construcción de edificios no residenciales" },
    { codigo: "42100", nombre: "Construcción de carreteras, calles y caminos" },
    { codigo: "42200", nombre: "Construcción de proyectos de servicio público" },
    { codigo: "42900", nombre: "Construcción de obras de ingeniería civil n.c.p." },
    { codigo: "43110", nombre: "Demolición" },
    { codigo: "43120", nombre: "Preparación de terreno" },
    { codigo: "43210", nombre: "Instalaciones eléctricas" },
    { codigo: "43220", nombre: "Instalación de fontanería, calefacción y aire acondicionado" },
    { codigo: "43290", nombre: "Otras instalaciones para obras de construcción" },
    { codigo: "43300", nombre: "Terminación y acabado de edificios" },
    { codigo: "43900", nombre: "Otras actividades especializadas de construcción" },
    { codigo: "43901", nombre: "Fabricación de techos y materiales diversos" },
    { codigo: "45100", nombre: "Venta de vehículos automotores" },
    { codigo: "45201", nombre: "Reparación mecánica de vehículos automotores" },
    { codigo: "45202", nombre: "Reparaciones eléctricas del automotor y recarga de baterías" },
    { codigo: "45203", nombre: "Enderezado y pintura de vehículos automotores" },
    { codigo: "45204", nombre: "Reparaciones de radiadores, escapes y silenciadores" },
    { codigo: "45205", nombre: "Reparación y reconstrucción de vías, stop y otros artículos de fibra de vidrio" },
    { codigo: "45206", nombre: "Reparación de llantas de vehículos automotores" },
    { codigo: "45207", nombre: "Polarizado de vehículos (mediante la adhesión de papel especial a los vidrios)" },
    { codigo: "45208", nombre: "Lavado y pasteado de vehículos (carwash)" },
    { codigo: "45209", nombre: "Reparaciones de vehículos n.c.p." },
    { codigo: "45211", nombre: "Remolque de vehículos automotores" },
    { codigo: "45301", nombre: "Venta de partes, piezas y accesorios nuevos para vehículos automotores" },
    { codigo: "45302", nombre: "Venta de partes, piezas y accesorios usados para vehículos automotores" },
    { codigo: "45401", nombre: "Venta de motocicletas" },
    { codigo: "45402", nombre: "Venta de repuestos, piezas y accesorios de motocicletas" },
    { codigo: "45403", nombre: "Mantenimiento y reparación de motocicletas" },
    { codigo: "46100", nombre: "Venta al por mayor a cambio de retribución o por contrata" },
    { codigo: "46201", nombre: "Venta al por mayor de materias primas agrícolas" },
    { codigo: "46202", nombre: "Venta al por mayor de productos de la silvicultura" },
    { codigo: "46203", nombre: "Venta al por mayor de productos pecuarios y de granja" },
    { codigo: "46211", nombre: "Venta de productos para uso agropecuario" },
    { codigo: "46291", nombre: "Venta al por mayor de granos básicos (cereales, leguminosas)" },
    { codigo: "46292", nombre: "Venta al por mayor de semillas mejoradas para cultivo" },
    { codigo: "46293", nombre: "Venta al por mayor de café oro y uva" },
    { codigo: "46294", nombre: "Venta al por mayor de caña de azúcar" },
    { codigo: "46295", nombre: "Venta al por mayor de flores, plantas y otros productos naturales" },
    { codigo: "46296", nombre: "Venta al por mayor de productos agrícolas" },
    { codigo: "46297", nombre: "Venta al por mayor de ganado bovino (vivo)" },
    { codigo: "46298", nombre: "Venta al por mayor de animales porcinos, ovinos, caprino, canículas, apícolas, avícolas vivos" },
    { codigo: "46299", nombre: "Venta de otras especies vivas del reino animal" },
    { codigo: "46301", nombre: "Venta al por mayor de alimentos" },
    { codigo: "46302", nombre: "Venta al por mayor de bebidas" },
    { codigo: "46303", nombre: "Venta al por mayor de tabaco" },
    { codigo: "46371", nombre: "Venta al por mayor de frutas, hortalizas (verduras), legumbres y tubérculos" },
    { codigo: "46372", nombre: "Venta al por mayor de pollos, gallinas destacadas, pavos y otras aves" },
    { codigo: "46373", nombre: "Venta al por mayor de carne bovina y porcina, productos de carne y embutidos" },
    { codigo: "46374", nombre: "Venta al por mayor de huevos" },
    { codigo: "46375", nombre: "Venta al por mayor de productos lácteos" },
    { codigo: "46376", nombre: "Venta al por mayor de productos farináceos de panadería (pan dulce, cakes, respostería, etc.)" },
    { codigo: "46377", nombre: "Venta al por mayor de pastas alimenticias, aceites y grasas comestibles vegetal y animal" },
    { codigo: "46378", nombre: "Venta al por mayor de sal comestible" },
    { codigo: "46379", nombre: "Venta al por mayor de azúcar" },
    { codigo: "46391", nombre: "Venta al por mayor de abarrotes (vinos, licores, productos alimenticios envasados, etc.)" },
    { codigo: "46392", nombre: "Venta al por mayor de aguas gaseosas" },
    { codigo: "46393", nombre: "Venta al por mayor de agua purificada" },
    { codigo: "46394", nombre: "Venta al por mayor de refrescos y otras bebidas, líquidas o en polvo" },
    { codigo: "46395", nombre: "Venta al por mayor de cerveza y licores" },
    { codigo: "46396", nombre: "Venta al por mayor de hielo" },
    { codigo: "46411", nombre: "Venta al por mayor de hilados, tejidos y productos textiles de mercería" },
    { codigo: "46412", nombre: "Venta al por mayor de artículos textiles excepto confecciones para el hogar" },
    { codigo: "46413", nombre: "Venta al por mayor de confecciones textiles para el hogar" },
    { codigo: "46414", nombre: "Venta al por mayor de prendas de vestir y accesorios de vestir" },
    { codigo: "46415", nombre: "Venta al por mayor de ropa usada" },
    { codigo: "46416", nombre: "Venta al por mayor de calzado" },
    { codigo: "46417", nombre: "Venta al por mayor de artículos de marroquinería y talabartería" },
    { codigo: "46418", nombre: "Venta al por mayor de artículos de peletería" },
    { codigo: "46419", nombre: "Venta al por mayor de otros artículos textiles n.c.p." },
    { codigo: "46471", nombre: "Venta al por mayor de instrumentos musicales" },
    { codigo: "46472", nombre: "Venta al por mayor de colchones, almohadas, cojines, etc." },
    { codigo: "46473", nombre: "Venta al por mayor de artículos de aluminio para el hogar y para otros usos" },
    { codigo: "46474", nombre: "Venta al por mayor de depósitos y otros artículos plásticos para el hogar y otros usos, incluyendo los desechables de durapax y no desechables" },
    { codigo: "46475", nombre: "Venta al por mayor de cámaras fotográficas, accesorios y materiales" },
    { codigo: "46482", nombre: "Venta al por mayor de medicamentos, artículos y otros productos de uso veterinario" },
    { codigo: "46483", nombre: "Venta al por mayor de productos y artículos de belleza y de uso personal" },
    { codigo: "46484", nombre: "Venta de productos farmacéuticos y medicinales" },
    { codigo: "46491", nombre: "Venta al por mayor de productos medicinales, cosméticos, perfumería y productos de limpieza" },
    { codigo: "46492", nombre: "Venta al por mayor de relojes y artículos de joyería" },
    { codigo: "46493", nombre: "Venta al por mayor de electrodomésticos y artículos del hogar excepto bazar; artículos de iluminación" },
    { codigo: "46494", nombre: "Venta al por mayor de artículos de bazar y similares" },
    { codigo: "46495", nombre: "Venta al por mayor de artículos de óptica" },
    { codigo: "46496", nombre: "Venta al por mayor de revistas, periódicos, libros, artículos de librería y artículos de papel y cartón en general" },
    { codigo: "46497", nombre: "Venta de artículos deportivos, juguetes y rodados" },
    { codigo: "46498", nombre: "Venta al por mayor de productos usados para el hogar o el uso personal" },
    { codigo: "46499", nombre: "Venta al por mayor de enseres domésticos y de uso personal n.c.p." },
    { codigo: "46500", nombre: "Venta al por mayor de bicicletas, partes, accesorios y otros" },
    { codigo: "46510", nombre: "Venta al por mayor de computadoras, equipo periférico y programas informáticos" },
    { codigo: "46520", nombre: "Venta al por mayor de equipos de comunicación" },
    { codigo: "46530", nombre: "Venta al por mayor de maquinaria y equipo agropecuario, accesorios, partes y suministros" },
    { codigo: "46590", nombre: "Venta de equipos e instrumentos de uso profesional y científico y aparatos de medida y control" },
    { codigo: "46591", nombre: "Venta al por mayor de maquinaria equipo, accesorios y materiales para la industria de la madera y sus productos" },
    { codigo: "46592", nombre: "Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria gráfica y del papel, cartón y productos de papel y cartón" },
    { codigo: "46593", nombre: "Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria de productos químicos, plástico y caucho" },
    { codigo: "46594", nombre: "Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria metálica y de sus productos" },
    { codigo: "46595", nombre: "Venta al por mayor de equipamiento para uso médico, odontológico, veterinario y servicios conexos" },
    { codigo: "46596", nombre: "Venta al por mayor de maquinaria, equipo, accesorios y partes para la industria de la alimentación" },
    { codigo: "46597", nombre: "Venta al por mayor de maquinaria, equipo, accesorios y partes para la industria textil, confecciones y cuero" },
    { codigo: "46598", nombre: "Venta al por mayor de maquinaria, equipo y accesorios para la construcción y explotación de minas y canteras" },
    { codigo: "46599", nombre: "Venta al por mayor de otro tipo de maquinaria y equipo con sus accesorios y partes" },
    { codigo: "46610", nombre: "Venta al por mayor de otros combustibles sólidos, líquidos, gaseosos y de productos conexos" },
    { codigo: "46612", nombre: "Venta al por mayor de combustibles para automotores, aviones, barcos, maquinaria y otros" },
    { codigo: "46613", nombre: "Venta al por mayor de lubricantes, grasas y otros aceites para automotores, maquinaria industrial, etc." },
    { codigo: "46614", nombre: "Venta al por mayor de gas propano" },
    { codigo: "46615", nombre: "Venta al por mayor de leña y carbón" },
    { codigo: "46620", nombre: "Venta al por mayor de metales y minerales metalíferos" },
    { codigo: "46631", nombre: "Venta al por mayor de puertas, ventanas, vitrinas y similares" },
    { codigo: "46632", nombre: "Venta al por mayor de artículos de ferretería y pinturerías" },
    { codigo: "46633", nombre: "Vidrierías" },
    { codigo: "46634", nombre: "Venta al por mayor de maderas" },
    { codigo: "46639", nombre: "Venta al por mayor de materiales para la construcción n.c.p." },
    { codigo: "46691", nombre: "Venta al por mayor de sal industrial sin yodar" },
    { codigo: "46692", nombre: "Venta al por mayor de productos intermedios y desechos de origen textil" },
    { codigo: "46693", nombre: "Venta al por mayor de productos intermedios y desechos de origen metálico" },
    { codigo: "46694", nombre: "Venta al por mayor de productos intermedios y desechos de papel y cartón" },
    { codigo: "46695", nombre: "Venta al por mayor fertilizantes, abonos, agroquímicos y productos similares" },
    { codigo: "46696", nombre: "Venta al por mayor de productos intermedios y desechos de origen plástico" },
    { codigo: "46697", nombre: "Venta al por mayor de tintas para imprenta, productos curtientes y materias y productos colorantes" },
    { codigo: "46698", nombre: "Venta de productos intermedios y desechos de origen químico y de caucho" },
    { codigo: "46699", nombre: "Venta al por mayor de productos intermedios y desechos ncp" },
    { codigo: "46701", nombre: "Venta de algodón en oro" },
    { codigo: "46900", nombre: "Venta al por mayor de otros productos" },
    { codigo: "46901", nombre: "Venta al por mayor de cohetes y otros productos pirotécnicos" },
    { codigo: "46902", nombre: "Venta al por mayor de artículos diversos para consumo humano" },
    { codigo: "46903", nombre: "Venta al por mayor de armas de fuego, municiones y accesorios" },
    { codigo: "46904", nombre: "Venta al por mayor de toldos y tiendas de campaña de cualquier material" },
    { codigo: "46905", nombre: "Venta al por mayor de exhibidores publicitarios y rótulos" },
    { codigo: "46906", nombre: "Venta al por mayor de artículos promocionales diversos" },
    { codigo: "47111", nombre: "Venta en supermercados" },
    { codigo: "47112", nombre: "Venta en tiendas de artículos de primera necesidad" },
    { codigo: "47119", nombre: "Almacenes (venta de diversos artículos)" },
    { codigo: "47190", nombre: "Venta al por menor de otros productos en comercios no especializados" },
    { codigo: "47199", nombre: "Venta de establecimientos no especializados con surtido compuesto principalmente de alimentos, bebidas y tabaco" },
    { codigo: "47211", nombre: "Venta al por menor de frutas y hortalizas" },
    { codigo: "47212", nombre: "Venta al por menor de carnes, embutidos y productos de granja" },
    { codigo: "47213", nombre: "Venta al por menor de pescado y mariscos" },
    { codigo: "47214", nombre: "Venta al por menor de productos lácteos" },
    { codigo: "47215", nombre: "Venta al por menor de productos de panadería, repostería y galletas" },
    { codigo: "47216", nombre: "Venta al por menor de huevos" },
    { codigo: "47217", nombre: "Venta al por menor de carnes y productos cárnicos" },
    { codigo: "47218", nombre: "Venta al por menor de granos básicos y otros" },
    { codigo: "47219", nombre: "Venta al por menor de alimentos n.c.p." },
    { codigo: "47221", nombre: "Venta al por menor de hielo" },
    { codigo: "47223", nombre: "Venta de bebidas no alcohólicas, para su consumo fuera del establecimiento" },
    { codigo: "47224", nombre: "Venta de bebidas alcohólicas, para su consumo fuera del establecimiento" },
    { codigo: "47225", nombre: "Venta de bebidas alcohólicas para su consumo dentro del establecimiento" },
    { codigo: "47230", nombre: "Venta al por menor de tabaco" },
    { codigo: "47300", nombre: "Venta de combustibles, lubricantes y otros (gasolineras)" },
    { codigo: "47411", nombre: "Venta al por menor de computadoras y equipo periférico" },
    { codigo: "47412", nombre: "Venta de equipo y accesorios de telecomunicación" },
    { codigo: "47420", nombre: "Venta al por menor de equipo de audio y video" },
    { codigo: "47510", nombre: "Venta al por menor de hilados, tejidos y productos textiles de mercería; confecciones para el hogar y textiles n.c.p." },
    { codigo: "47521", nombre: "Venta al por menor de productos de madera" },
    { codigo: "47522", nombre: "Venta al por menor de artículos de ferretería" },
    { codigo: "47523", nombre: "Venta al por menor de productos de pinturerías" },
    { codigo: "47524", nombre: "Venta al por menor en vidrierías" },
    { codigo: "47529", nombre: "Venta al por menor de materiales de construcción y artículos conexos" },
    { codigo: "47530", nombre: "Venta al por menor de tapices, alfombras y revestimientos de paredes y pisos en comercios especializados" },
    { codigo: "47591", nombre: "Venta al por menor de muebles" },
    { codigo: "47592", nombre: "Venta al por menor de artículos de bazar" },
    { codigo: "47593", nombre: "Venta al por menor de aparatos electrodomésticos, repuestos y accesorios" },
    { codigo: "47594", nombre: "Venta al por menor de artículos eléctricos y de iluminación" },
    { codigo: "47598", nombre: "Venta al por menor de instrumentos musicales" },
    { codigo: "47610", nombre: "Venta al por menor de libros, periódicos y artículos de papelería en comercios especializados" },
    { codigo: "47620", nombre: "Venta al por menor de discos láser, cassettes, cintas de video y otros" },
    { codigo: "47630", nombre: "Venta al por menor de productos y equipos de deporte" },
    { codigo: "47631", nombre: "Venta al por menor de bicicletas, accesorios y repuestos" },
    { codigo: "47640", nombre: "Venta al por menor de juegos y juguetes en comercios especializados" },
    { codigo: "47711", nombre: "Venta al por menor de prendas de vestir y accesorios de vestir" },
    { codigo: "47712", nombre: "Venta al por menor de calzado" },
    { codigo: "47713", nombre: "Venta al por menor de artículos de peletería, marroquinería y talabartería" },
    { codigo: "47721", nombre: "Venta al por menor de medicamentos farmacéuticos y otros materiales y artículos de uso médico, odontológico y veterinario" },
    { codigo: "47722", nombre: "Venta al por menor de productos cosméticos y de tocador" },
    { codigo: "47731", nombre: "Venta al por menor de productos de joyería, bisutería, óptica, relojería" },
    { codigo: "47732", nombre: "Venta al por menor de plantas, semillas, animales y artículos conexos" },
    { codigo: "47733", nombre: "Venta al por menor de combustibles de uso doméstico (gas propano y gas licuado)" },
    { codigo: "47734", nombre: "Venta al por menor de artesanías, artículos cerámicos y recuerdos en general" },
    { codigo: "47735", nombre: "Venta al por menor de ataúdes, lápidas y cruces, trofeos, artículos religiosos en general" },
    { codigo: "47736", nombre: "Venta al por menor de armas de fuego, municiones y accesorios" },
    { codigo: "47737", nombre: "Venta al por menor de artículos de cohetería y pirotécnicos" },
    { codigo: "47738", nombre: "Venta al por menor de artículos desechables de uso personal y doméstico (servilletas, papel higiénico, pañales, toallas sanitarias, etc.)" },
    { codigo: "47739", nombre: "Venta al por menor de otros productos n.c.p." },
    { codigo: "47741", nombre: "Venta al por menor de artículos usados" },
    { codigo: "47742", nombre: "Venta al por menor de textiles y confecciones usados" },
    { codigo: "47743", nombre: "Venta al por menor de libros, revistas, papel y cartón usados" },
    { codigo: "47749", nombre: "Venta al por menor de productos usados n.c.p." },
    { codigo: "47811", nombre: "Venta al por menor de frutas, verduras y hortalizas" },
    { codigo: "47814", nombre: "Venta al por menor de productos lácteos" },
    { codigo: "47815", nombre: "Venta al por menor de productos de panadería, galletas y similares" },
    { codigo: "47816", nombre: "Venta al por menor de bebidas" },
    { codigo: "47818", nombre: "Venta al por menor en tiendas de mercado y puestos" },
    { codigo: "47821", nombre: "Venta al por menor de hilados, tejidos y productos textiles de mercería en puestos de mercados y ferias" },
    { codigo: "47822", nombre: "Venta al por menor de artículos textiles excepto confecciones para el hogar en puestos de mercados y ferias" },
    { codigo: "47823", nombre: "Venta al por menor de confecciones textiles para el hogar en puestos de mercados y ferias" },
    { codigo: "47824", nombre: "Venta al por menor de prendas de vestir, accesorios de vestir y similares en puestos de mercados y ferias" },
    { codigo: "47825", nombre: "Venta al por menor de ropa usada" },
    { codigo: "47826", nombre: "Venta al por menor de calzado, artículos de marroquinería y talabartería en puestos de mercados y ferias" },
    { codigo: "47827", nombre: "Venta al por menor de artículos de marroquinería y talabartería en puestos de mercados y ferias" },
    { codigo: "47829", nombre: "Venta al por menor de artículos textiles ncp en puestos de mercados y ferias" },
    { codigo: "47891", nombre: "Venta al por menor de animales, flores y productos conexos en puestos de feria y mercados" },
    { codigo: "47892", nombre: "Venta al por menor de productos medicinales, cosméticos, de tocador y de limpieza en puestos de ferias y mercados" },
    { codigo: "47893", nombre: "Venta al por menor de artículos de bazar en puestos de ferias y mercados" },
    { codigo: "47894", nombre: "Venta al por menor de artículos de papel, envases, libros, revistas y conexos en puestos de feria y mercados" },
    { codigo: "47895", nombre: "Venta al por menor de materiales de construcción, electrodomésticos, accesorios para autos y similares en puestos de feria y mercados" },
    { codigo: "47896", nombre: "Venta al por menor de equipos accesorios para las comunicaciones en puestos de feria y mercados" },
    { codigo: "47899", nombre: "Venta al por menor en puestos de ferias y mercados n.c.p." },
    { codigo: "47910", nombre: "Venta al por menor por correo o Internet" },
    { codigo: "47990", nombre: "Otros tipos de venta al por menor no realizada, en almacenes, puestos de venta o mercado" },
    { codigo: "49110", nombre: "Transporte interurbano de pasajeros por ferrocarril" },
    { codigo: "49120", nombre: "Transporte de carga por ferrocarril" },
    { codigo: "49211", nombre: "Transporte de pasajeros urbanos e interurbano mediante buses" },
    { codigo: "49212", nombre: "Transporte de pasajeros interdepartamental mediante microbuses" },
    { codigo: "49213", nombre: "Transporte de pasajeros urbanos e interurbano mediante microbuses" },
    { codigo: "49214", nombre: "Transporte de pasajeros interdepartamental mediante buses" },
    { codigo: "49221", nombre: "Transporte internacional de pasajeros" },
    { codigo: "49222", nombre: "Transporte de pasajeros mediante taxis y autos con chofer" },
    { codigo: "49223", nombre: "Transporte escolar" },
    { codigo: "49225", nombre: "Transporte de pasajeros para excursiones" },
    { codigo: "49226", nombre: "Servicios de transporte de personal" },
    { codigo: "49229", nombre: "Transporte de pasajeros por vía terrestre ncp" },
    { codigo: "49231", nombre: "Transporte de carga urbano" },
    { codigo: "49232", nombre: "Transporte nacional de carga" },
    { codigo: "49233", nombre: "Transporte de carga internacional" },
    { codigo: "49234", nombre: "Servicios de mudanza" },
    { codigo: "49235", nombre: "Alquiler de vehículos de carga con conductor" },
    { codigo: "49300", nombre: "Transporte por oleoducto o gasoducto" },
    { codigo: "50110", nombre: "Transporte de pasajeros marítimo y de cabotaje" },
    { codigo: "50120", nombre: "Transporte de carga marítimo y de cabotaje" },
    { codigo: "50211", nombre: "Transporte de pasajeros por vías de navegación interiores" },
    { codigo: "50212", nombre: "Alquiler de equipo de transporte de pasajeros por vías de navegación interior con conductor" },
    { codigo: "50220", nombre: "Transporte de carga por vías de navegación interiores" },
    { codigo: "51100", nombre: "Transporte aéreo de pasajeros" },
    { codigo: "51201", nombre: "Transporte de carga por vía aérea" },
    { codigo: "51202", nombre: "Alquiler de equipo de aerotransporte con operadores para el propósito de transportar carga" },
    { codigo: "52101", nombre: "Alquiler de instalaciones de almacenamiento en zonas francas" },
    { codigo: "52102", nombre: "Alquiler de silos para conservación y almacenamiento de granos" },
    { codigo: "52103", nombre: "Alquiler de instalaciones con refrigeración para almacenamiento y conservación de alimentos y otros productos" },
    { codigo: "52109", nombre: "Alquiler de bodegas para almacenamiento y depósito n.c.p." },
    { codigo: "52211", nombre: "Servicio de garaje y estacionamiento" },
    { codigo: "52212", nombre: "Servicios de terminales para el transporte por vía terrestre" },
    { codigo: "52219", nombre: "Servicios para el transporte por vía terrestre n.c.p." },
    { codigo: "52220", nombre: "Servicios para el transporte acuático" },
    { codigo: "52230", nombre: "Servicios para el transporte aéreo" },
    { codigo: "52240", nombre: "Manipulación de carga" },
    { codigo: "52290", nombre: "Servicios para el transporte ncp" },
    { codigo: "52291", nombre: "Agencias de tramitaciones aduanales" },
    { codigo: "53100", nombre: "Servicios de correo nacional" },
    { codigo: "53200", nombre: "Actividades de correo distintas a las actividades postales nacionales" },
    { codigo: "53201", nombre: "Agencia privada de correo y encomiendas" },
    { codigo: "55101", nombre: "Actividades de alojamiento para estancias cortas" },
    { codigo: "55102", nombre: "Hoteles" },
    { codigo: "55200", nombre: "Actividades de campamentos, parques de vehículos de recreo y parques de caravanas" },
    { codigo: "55900", nombre: "Alojamiento n.c.p." },
    { codigo: "56101", nombre: "Restaurantes" },
    { codigo: "56106", nombre: "Pupusería" },
    { codigo: "56107", nombre: "Actividades varias de restaurantes" },
    { codigo: "56108", nombre: "Comedores" },
    { codigo: "56109", nombre: "Merenderos ambulantes" },
    { codigo: "56210", nombre: "Preparación de comida para eventos especiales" },
    { codigo: "56291", nombre: "Servicios de provisión de comidas por contrato" },
    { codigo: "56292", nombre: "Servicios de concesión de cafetines y chalet en empresas e" },
    { codigo: "56299", nombre: "Servicios de preparación de comidas ncp" },
    { codigo: "56301", nombre: "Servicio de expendio de bebidas en salones y bares" },
    { codigo: "56302", nombre: "Servicio de expendio de bebidas en puestos callejeros, mercados y ferias" },
    { codigo: "58110", nombre: "Edición de libros, folletos, partituras y otras ediciones distintas a estas" },
    { codigo: "58120", nombre: "Edición de directorios y listas de correos" },
    { codigo: "58130", nombre: "Edición de periódicos, revistas y otras publicaciones periódicas" },
    { codigo: "58190", nombre: "Otras actividades de edición" },
    { codigo: "58200", nombre: "Edición de programas informáticos (software)" },
    { codigo: "59110", nombre: "Actividades de producción cinematográfica" },
    { codigo: "59120", nombre: "Actividades de post producción de películas, videos y programas de televisión" },
    { codigo: "59130", nombre: "Actividades de distribución de películas cinematográficas, videos y programas de televisión" },
    { codigo: "59140", nombre: "Actividades de exhibición de películas cinematográficas y cintas de vídeo" },
    { codigo: "59200", nombre: "Actividades de edición y grabación de música" },
    { codigo: "60100", nombre: "Servicios de difusiones de radio" },
    { codigo: "60201", nombre: "Actividades de programación y difusión de televisión abierta" },
    { codigo: "60202", nombre: "Actividades de suscripción y difusión de televisión por cable y/o suscripción" },
    { codigo: "60299", nombre: "Servicios de televisión, incluye televisión por cable" },
    { codigo: "60900", nombre: "Programación y transmisión de radio y televisión" },
    { codigo: "61101", nombre: "Servicio de telefonía" },
    { codigo: "61102", nombre: "Servicio de Internet" },
    { codigo: "61103", nombre: "Servicio de telefonía fija" },
    { codigo: "61109", nombre: "Servicio de Internet n.c.p." },
    { codigo: "61201", nombre: "Servicios de telefonía celular" },
    { codigo: "61202", nombre: "Servicios de Internet inalámbrico" },
    { codigo: "61209", nombre: "Servicios de telecomunicaciones inalámbrico n.c.p." },
    { codigo: "61301", nombre: "Telecomunicaciones satelitales" },
    { codigo: "61309", nombre: "Comunicación vía satélite n.c.p." },
    { codigo: "61900", nombre: "Actividades de telecomunicación n.c.p." },
    { codigo: "62010", nombre: "Programación Informática" },
    { codigo: "62020", nombre: "Consultorías y gestión de servicios informáticos" },
    { codigo: "62090", nombre: "Otras actividades de tecnología de información y servicios de computadora" },
    { codigo: "63110", nombre: "Procesamiento de datos y actividades relacionadas" },
    { codigo: "63120", nombre: "Portales WEB" },
    { codigo: "63910", nombre: "Servicios de Agencias de Noticias" },
    { codigo: "63990", nombre: "Otros servicios de información n.c.p." },
    { codigo: "64110", nombre: "Servicios provistos por el Banco Central de El salvador" },
    { codigo: "64190", nombre: "Bancos" },
    { codigo: "64192", nombre: "Entidades dedicadas al envío de remesas" },
    { codigo: "64199", nombre: "Otras entidades financieras" },
    { codigo: "64200", nombre: "Actividades de sociedades de cartera" },
    { codigo: "64300", nombre: "Fideicomisos, fondos y otras fuentes de financiamiento" },
    { codigo: "64910", nombre: "Arrendamientos financieros" },
    { codigo: "64920", nombre: "Asociaciones cooperativas de ahorro y crédito dedicadas a la intermediación financiera" },
    { codigo: "64921", nombre: "Instituciones emisoras de tarjetas de crédito y otros" },
    { codigo: "64922", nombre: "Tipos de crédito ncp" },
    { codigo: "64928", nombre: "Prestamistas y casas de empeño" },
    { codigo: "64990", nombre: "Actividades de servicios financieros, excepto la financiación de planes de seguros y de pensiones n.c.p." },
    { codigo: "65110", nombre: "Planes de seguros de vida" },
    { codigo: "65120", nombre: "Planes de seguro excepto de vida" },
    { codigo: "65199", nombre: "Seguros generales de todo tipo" },
    { codigo: "65200", nombre: "Planes se seguro" },
    { codigo: "65300", nombre: "Planes de pensiones" },
    { codigo: "66110", nombre: "Administración de mercados financieros (Bolsa de Valores)" },
    { codigo: "66120", nombre: "Actividades bursátiles (Corredores de Bolsa)" },
    { codigo: "66190", nombre: "Actividades auxiliares de la intermediación financiera ncp" },
    { codigo: "66210", nombre: "Evaluación de riesgos y daños" },
    { codigo: "66220", nombre: "Actividades de agentes y corredores de seguros" },
    { codigo: "66290", nombre: "Otras actividades auxiliares de seguros y fondos de pensiones" },
    { codigo: "66300", nombre: "Actividades de administración de fondos" },
    { codigo: "68101", nombre: "Servicio de alquiler y venta de lotes en cementerios" },
    { codigo: "68109", nombre: "Actividades inmobiliarias realizadas con bienes propios o arrendados n.c.p." },
    { codigo: "68200", nombre: "Actividades Inmobiliarias Realizadas a Cambio de una Retribución o por Contrata" },
    { codigo: "69100", nombre: "Actividades jurídicas" },
    { codigo: "69200", nombre: "Actividades de contabilidad, teneduría de libros y auditoría; asesoramiento en materia de impuestos" },
    { codigo: "70100", nombre: "Actividades de oficinas centrales de sociedades de cartera" },
    { codigo: "70200", nombre: "Actividades de consultoría en gestión empresarial" },
    { codigo: "71101", nombre: "Servicios de arquitectura y planificación urbana y servicios conexos" },
    { codigo: "71102", nombre: "Servicios de ingeniería" },
    { codigo: "71103", nombre: "Servicios de agrimensura, topografía, cartografía, prospección y geofísica y servicios conexos" },
    { codigo: "71200", nombre: "Ensayos y análisis técnicos" },
    { codigo: "72100", nombre: "Investigaciones y desarrollo experimental en el campo de las ciencias naturales y la ingeniería" },
    { codigo: "72199", nombre: "Investigaciones científicas" },
    { codigo: "72200", nombre: "Investigaciones y desarrollo experimental en el campo de las ciencias sociales y las humanidades científica y desarrollo" },
    { codigo: "73100", nombre: "Publicidad" },
    { codigo: "73200", nombre: "Investigación de mercados y realización de encuestas de opinión pública" },
    { codigo: "74100", nombre: "Actividades de diseño especializado" },
    { codigo: "74200", nombre: "Actividades de fotografía" },
    { codigo: "74900", nombre: "Servicios profesionales y científicos ncp" },
    { codigo: "75000", nombre: "Actividades veterinarias" },
    { codigo: "77101", nombre: "Alquiler de equipo de transporte terrestre" },
    { codigo: "77102", nombre: "Alquiler de equipo de transporte acuático" },
    { codigo: "77103", nombre: "Alquiler de equipo de transporte por vía aérea" },
    { codigo: "77210", nombre: "Alquiler y arrendamiento de equipo de recreo y deportivo" },
    { codigo: "77220", nombre: "Alquiler de cintas de video y discos" },
    { codigo: "77290", nombre: "Alquiler de otros efectos personales y enseres domésticos" },
    { codigo: "77300", nombre: "Alquiler de maquinaria y equipo" },
    { codigo: "77400", nombre: "Arrendamiento de productos de propiedad intelectual" },
    { codigo: "78100", nombre: "Obtención y dotación de personal" },
    { codigo: "78200", nombre: "Actividades de las agencias de trabajo temporal" },
    { codigo: "78300", nombre: "Dotación de recursos humanos y gestión; gestión de las funciones de recursos humanos" },
    { codigo: "79110", nombre: "Actividades de agencias de viajes y organizadores de viajes; actividades de asistencia a turistas" },
    { codigo: "79120", nombre: "Actividades de los operadores turísticos" },
    { codigo: "79900", nombre: "Otros servicios de reservas y actividades relacionadas" },
    { codigo: "80100", nombre: "Servicios de seguridad privados" },
    { codigo: "80201", nombre: "Actividades de servicios de sistemas de seguridad" },
    { codigo: "80202", nombre: "Actividades para la prestación de sistemas de seguridad" },
    { codigo: "80300", nombre: "Actividades de investigación" },
    { codigo: "81100", nombre: "Actividades combinadas de mantenimiento de edificios e instalaciones" },
    { codigo: "81210", nombre: "Limpieza general de edificios" },
    { codigo: "81290", nombre: "Otras actividades combinadas de mantenimiento de edificios e instalaciones ncp" },
    { codigo: "81300", nombre: "Servicio de jardinería" },
    { codigo: "82110", nombre: "Servicios administrativos de oficinas" },
    { codigo: "82190", nombre: "Servicio de fotocopiado y similares, excepto en imprentas" },
    { codigo: "82200", nombre: "Actividades de las centrales de llamadas (call center)" },
    { codigo: "82300", nombre: "Organización de convenciones y ferias de negocios" },
    { codigo: "82910", nombre: "Actividades de agencias de cobro y oficinas de crédito" },
    { codigo: "82921", nombre: "Servicios de envase y empaque de productos alimenticios" },
    { codigo: "82922", nombre: "Servicios de envase y empaque de productos medicinales" },
    { codigo: "82929", nombre: "Servicio de envase y empaque ncp" },
    { codigo: "82990", nombre: "Actividades de apoyo empresariales ncp" },
    { codigo: "84110", nombre: "Actividades de la Administración Pública en general" },
    { codigo: "84111", nombre: "Alcaldías Municipales" },
    { codigo: "84120", nombre: "Regulación de las actividades de prestación de servicios sanitarios, educativos, culturales y otros servicios sociales, excepto seguridad social" },
    { codigo: "84130", nombre: "Regulación y facilitación de la actividad económica" },
    { codigo: "84210", nombre: "Actividades de administración y funcionamiento del Ministerio de Relaciones Exteriores" },
    { codigo: "84220", nombre: "Actividades de defensa" },
    { codigo: "84230", nombre: "Actividades de mantenimiento del orden público y de seguridad" },
    { codigo: "84300", nombre: "Actividades de planes de seguridad social de afiliación obligatoria" },
    { codigo: "85101", nombre: "Guardería educativa" },
    { codigo: "85102", nombre: "Enseñanza preescolar o parvularia" },
    { codigo: "85103", nombre: "Enseñanza primaria" },
    { codigo: "85104", nombre: "Servicio de educación preescolar y primaria integrada" },
    { codigo: "85211", nombre: "Enseñanza secundaria tercer ciclo (7°, 8° y 9°)" },
    { codigo: "85212", nombre: "Enseñanza secundaria de formación general bachillerato" },
    { codigo: "85221", nombre: "Enseñanza secundaria de formación técnica y profesional" },
    { codigo: "85222", nombre: "Enseñanza secundaria de formación técnica y profesional integrada con enseñanza primaria" },
    { codigo: "85301", nombre: "Enseñanza superior universitaria" },
    { codigo: "85302", nombre: "Enseñanza superior no universitaria" },
    { codigo: "85303", nombre: "Enseñanza superior integrada a educación secundaria y/o primaria" },
    { codigo: "85410", nombre: "Educación deportiva y recreativa" },
    { codigo: "85420", nombre: "Educación cultural" },
    { codigo: "85490", nombre: "Otros tipos de enseñanza n.c.p." },
    { codigo: "85499", nombre: "Enseñanza formal" },
    { codigo: "85500", nombre: "Servicios de apoyo a la enseñanza" },
    { codigo: "86100", nombre: "Actividades de hospitales" },
    { codigo: "86201", nombre: "Clínicas médicas" },
    { codigo: "86202", nombre: "Servicios de Odontología" },
    { codigo: "86203", nombre: "Servicios médicos" },
    { codigo: "86901", nombre: "Servicios de análisis y estudios de diagnóstico" },
    { codigo: "86902", nombre: "Actividades de atención de la salud humana" },
    { codigo: "86909", nombre: "Otros Servicio relacionados con la salud ncp" },
    { codigo: "87100", nombre: "Residencias de ancianos con atención de enfermería" },
    { codigo: "87200", nombre: "Instituciones dedicadas al tratamiento del retraso mental, problemas de salud mental y el uso indebido de sustancias nocivas" },
    { codigo: "87300", nombre: "Instituciones dedicadas al cuidado de ancianos y discapacitados" },
    { codigo: "87900", nombre: "Actividades de asistencia a niños y jóvenes" },
    { codigo: "87901", nombre: "Otras actividades de atención en instituciones" },
    { codigo: "88100", nombre: "Actividades de asistencia sociales sin alojamiento para ancianos y discapacitados" },
    { codigo: "88900", nombre: "servicios sociales sin alojamiento ncp" },
    { codigo: "90000", nombre: "Actividades creativas artísticas y de esparcimiento" },
    { codigo: "91010", nombre: "Actividades de bibliotecas y archivos" },
    { codigo: "91020", nombre: "Actividades de museos y preservación de lugares y edificios históricos" },
    { codigo: "91030", nombre: "Actividades de jardines botánicos, zoológicos y de reservas naturales" },
    { codigo: "92000", nombre: "Actividades de juegos y apuestas" },
    { codigo: "93110", nombre: "Gestión de instalaciones deportivas" },
    { codigo: "93120", nombre: "Actividades de clubes deportivos" },
    { codigo: "93190", nombre: "Otras actividades deportivas" },
    { codigo: "93210", nombre: "Actividades de parques de atracciones y parques temáticos" },
    { codigo: "93291", nombre: "Discotecas y salas de baile" },
    { codigo: "93298", nombre: "Centros vacacionales" },
    { codigo: "93299", nombre: "Actividades de esparcimiento ncp" },
    { codigo: "94110", nombre: "Actividades de organizaciones empresariales y de empleadores" },
    { codigo: "94120", nombre: "Actividades de organizaciones profesionales" },
    { codigo: "94200", nombre: "Actividades de sindicatos" },
    { codigo: "94910", nombre: "Actividades de organizaciones religiosas" },
    { codigo: "94920", nombre: "Actividades de organizaciones políticas" },
    { codigo: "94990", nombre: "Actividades de asociaciones n.c.p." },
    { codigo: "95110", nombre: "Reparación de computadoras y equipo periférico" },
    { codigo: "95120", nombre: "Reparación de equipo de comunicación" },
    { codigo: "95210", nombre: "Reparación de aparatos electrónicos de consumo" },
    { codigo: "95220", nombre: "Reparación de aparatos doméstico y equipo de hogar y jardín" },
    { codigo: "95230", nombre: "Reparación de calzado y artículos de cuero" },
    { codigo: "95240", nombre: "Reparación de muebles y accesorios para el hogar" },
    { codigo: "95291", nombre: "Reparación de Instrumentos musicales" },
    { codigo: "95292", nombre: "Servicios de cerrajería y copiado de llaves" },
    { codigo: "95293", nombre: "Reparación de joyas y relojes" },
    { codigo: "95294", nombre: "Reparación de bicicletas, sillas de ruedas y rodados n.c.p." },
    { codigo: "95299", nombre: "Reparaciones de enseres personales n.c.p." },
    { codigo: "96010", nombre: "Lavado y limpieza de prendas de tela y de piel, incluso la limpieza en seco" },
    { codigo: "96020", nombre: "Peluquería y otros tratamientos de belleza" },
    { codigo: "96030", nombre: "Pompas fúnebres y actividades conexas" },
    { codigo: "96091", nombre: "Servicios de sauna y otros servicios para la estética corporal n.c.p." },
    { codigo: "96092", nombre: "Servicios n.c.p." },
    { codigo: "97000", nombre: "Actividad de los hogares en calidad de empleadores de personal doméstico" },
    { codigo: "98100", nombre: "Actividades indiferenciadas de producción de bienes de los hogares privados para uso propio" },
    { codigo: "98200", nombre: "Actividades indiferenciadas de producción de servicios de los hogares privados para uso propio" },
    { codigo: "99000", nombre: "Actividades de organizaciones y órganos extraterritoriales" },
    { codigo: "10001", nombre: "Empleados" },
    { codigo: "10002", nombre: "Pensionado" },
    { codigo: "10003", nombre: "Estudiante" },
    { codigo: "10004", nombre: "Desempleado" },
    { codigo: "10005", nombre: "Otros" },
    { codigo: "10006", nombre: "Comerciante" },
];
    
    // Convertir la lista de códigos de actividad al formato que react-select necesita
    const optionsCodActividad = codactividad.map(act => ({
        value: act.codigo,
        label: `${act.codigo} - ${act.nombre}`,
    }));

    // Función para manejar el cambio en el código de actividad
    const handleCodActividadChange = (selectedOption) => {
        if (selectedOption) {
            const actividadSeleccionada = codactividad.find(act => act.codigo === selectedOption.value);
            setFormData({
                ...formData,
                codactividad: selectedOption.value,
                giro: actividadSeleccionada ? actividadSeleccionada.nombre : "",
            });
        } else {
            setFormData({
                ...formData,
                codactividad: "",
                giro: "",
            });
        }
    };

    const departamentos = [
        { codigo: "00", nombre: "Otro (Para extranjeros)" },
        { codigo: "01", nombre: "Ahuachapán" },
        { codigo: "02", nombre: "Santa Ana" },
        { codigo: "03", nombre: "Sonsonate" },
        { codigo: "04", nombre: "Chalatenango" },
        { codigo: "05", nombre: "La Libertad" },
        { codigo: "06", nombre: "San Salvador" },
        { codigo: "07", nombre: "Cuscatlán" },
        { codigo: "08", nombre: "La Paz" },
        { codigo: "09", nombre: "Cabañas" },
        { codigo: "10", nombre: "San Vicente" },
        { codigo: "11", nombre: "Usulután" },
        { codigo: "12", nombre: "San Miguel" },
        { codigo: "13", nombre: "Morazán" },
        { codigo: "14", nombre: "La Unión" }
    ];

    const municipios = [
        { codigo: "00", nombre: "Otro (Para extranjeros)", departamento: "00" },
        { codigo: "13", nombre: "AHUACHAPAN NORTE", departamento: "01" },
        { codigo: "14", nombre: "AHUACHAPAN CENTRO", departamento: "01" },
        { codigo: "15", nombre: "AHUACHAPAN SUR", departamento: "01" },
        { codigo: "14", nombre: "SANTA ANA NORTE", departamento: "02" },
        { codigo: "15", nombre: "SANTA ANA CENTRO", departamento: "02" },
        { codigo: "16", nombre: "SANTA ANA ESTE", departamento: "02" },
        { codigo: "17", nombre: "SANTA ANA OESTE", departamento: "02" },
        { codigo: "17", nombre: "SONSONATE NORTE", departamento: "03" },
        { codigo: "18", nombre: "SONSONATE CENTRO", departamento: "03" },
        { codigo: "19", nombre: "SONSONATE ESTE", departamento: "03" },
        { codigo: "20", nombre: "SONSONATE OESTE", departamento: "03" },
        { codigo: "34", nombre: "CHALATENANGO NORTE", departamento: "04" },
        { codigo: "35", nombre: "CHALATENANGO CENTRO", departamento: "04" },
        { codigo: "36", nombre: "CHALATENANGO SUR", departamento: "04" },
        { codigo: "23", nombre: "LA LIBERTAD NORTE", departamento: "05" },
        { codigo: "24", nombre: "LA LIBERTAD CENTRO", departamento: "05" },
        { codigo: "25", nombre: "LA LIBERTAD OESTE", departamento: "05" },
        { codigo: "26", nombre: "LA LIBERTAD ESTE", departamento: "05" },
        { codigo: "27", nombre: "LA LIBERTAD COSTA", departamento: "05" },
        { codigo: "28", nombre: "LA LIBERTAD SUR", departamento: "05" },
        { codigo: "20", nombre: "SAN SALVADOR NORTE", departamento: "06" },
        { codigo: "21", nombre: "SAN SALVADOR OESTE", departamento: "06" },
        { codigo: "22", nombre: "SAN SALVADOR ESTE", departamento: "06" },
        { codigo: "23", nombre: "SAN SALVADOR CENTRO", departamento: "06" },
        { codigo: "24", nombre: "SAN SALVADOR SUR", departamento: "06" },
        { codigo: "17", nombre: "CUSCATLAN NORTE", departamento: "07" },
        { codigo: "18", nombre: "CUSCATLAN SUR", departamento: "07" },
        { codigo: "23", nombre: "LA PAZ OESTE", departamento: "08" },
        { codigo: "24", nombre: "LA PAZ CENTRO", departamento: "08" },
        { codigo: "25", nombre: "LA PAZ ESTE", departamento: "08" },
        { codigo: "10", nombre: "CABAÑAS OESTE", departamento: "09" },
        { codigo: "11", nombre: "CABAÑAS ESTE", departamento: "09" },
        { codigo: "14", nombre: "SAN VICENTE NORTE", departamento: "10" },
        { codigo: "15", nombre: "SAN VICENTE SUR", departamento: "10" },
        { codigo: "24", nombre: "USULUTAN NORTE", departamento: "11" },
        { codigo: "25", nombre: "USULUTAN ESTE", departamento: "11" },
        { codigo: "26", nombre: "USULUTAN OESTE", departamento: "11" },
        { codigo: "21", nombre: "SAN MIGUEL NORTE", departamento: "12" },
        { codigo: "22", nombre: "SAN MIGUEL CENTRO", departamento: "12" },
        { codigo: "23", nombre: "SAN MIGUEL OESTE", departamento: "12" },
        { codigo: "27", nombre: "MORAZAN NORTE", departamento: "13" },
        { codigo: "28", nombre: "MORAZAN SUR", departamento: "13" },
        { codigo: "19", nombre: "LA UNION NORTE", departamento: "14" },
        { codigo: "20", nombre: "LA UNION SUR", departamento: "14" }
    ];

    useEffect(() => {
        if (selectedDepartamento) {
            const filtrados = municipios.filter(m => m.departamento === selectedDepartamento);
            setMunicipiosFiltrados(filtrados);
        } else {
            setMunicipiosFiltrados([]);
        }
    }, [selectedDepartamento]);

    const getNombreDepartamento = (codigo) => {
        const departamento = departamentos.find(depto => depto.codigo === codigo);
        return departamento ? departamento.nombre : "Desconocido";
    };

    const getNombreMunicipio = (codigoMunicipio, codigoDepartamento) => {
        const municipio = municipios.find(
            muni => muni.codigo === codigoMunicipio && muni.departamento === codigoDepartamento
        );
        return municipio ? municipio.nombre : "Desconocido";
    };

    useEffect(() => {
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

    useEffect(() => {
        setEmpresas(initialEmpresas || []);
        setFilteredEmpresas(initialEmpresas || []);
    }, [initialEmpresas]);

    useEffect(() => {
        const results = empresas && Array.isArray(empresas) ? empresas.filter(empresa =>
            empresa.id.toString().includes(searchTerm) ||
            empresa.nit.includes(searchTerm) ||
            empresa.nrc.includes(searchTerm)
        ) : [];
        setFilteredEmpresas(results);
    }, [searchTerm, empresas]);

    const handleSearch = () => {
        if (searchTerm.trim() !== "") {
            setShowSearchResultsModal(true);
        }
    };

    const fetchEmpresas = async () => {
        try {
            const response = await fetch("http://localhost:3000/personasJuridicas/getAll", {
                method: "GET",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Error al obtener las empresas");
            }

            const data = await response.json();
            setEmpresas(data);
            setFilteredEmpresas(data);
        } catch (error) {
            console.error("Error al obtener las empresas:", error);
        }
    };

    const handleSaveNewClient = async (e) => {
        e.preventDefault();

        // Validaciones con límites definidos
        if (formData.nombre.length > LIMITES.NOMBRE) {
            setErrorMessage(`El nombre no puede exceder ${LIMITES.NOMBRE} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (!validateNIT(formData.nit)) {
            setErrorMessage(`Formato de NIT inválido. Debe tener exactamente ${LIMITES.NIT} dígitos.`);
            setShowErrorModal(true);
            return;
        }
        
        if (!validateNRC(formData.nrc)) {
            setErrorMessage(`Formato de NRC inválido. Debe tener exactamente ${LIMITES.NRC} dígitos.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.giro.length > LIMITES.GIRO) {
            setErrorMessage(`El giro no puede exceder ${LIMITES.GIRO} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.correo.length > LIMITES.CORREO) {
            setErrorMessage(`El correo no puede exceder ${LIMITES.CORREO} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (!validateTelefono(formData.telefono)) {
            setErrorMessage(`Formato de teléfono inválido. Debe tener exactamente ${LIMITES.TELEFONO} dígitos.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.complemento.length > LIMITES.COMPLEMENTO) {
            setErrorMessage(`El complemento no puede exceder ${LIMITES.COMPLEMENTO} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.nombrecomercial.length > LIMITES.NOMBRE_COMERCIAL) {
            setErrorMessage(`El nombre comercial no puede exceder ${LIMITES.NOMBRE_COMERCIAL} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        // Preparar los datos para enviar al endpoint
        const dataToSend = {
            ...formData,
            departamento: selectedDepartamento,
            municipio: selectedMunicipio,
        };

        try {
            const response = await fetch("http://localhost:3000/personasJuridicas/addPerJu", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes("NIT o NRC ya están registrados")) {
                    setErrorMessage("El NIT o NRC ya están registrados. Verifique los datos.");
                    setShowErrorModal(true);
                } else {
                    throw new Error("Error al agregar la empresa");
                }
            } else {
                // Cerrar el modal y resetear el formulario
                setShowAddModal(false);
                setFormData({
                    nombre: "",
                    nit: "",
                    nrc: "",
                    giro: "",
                    correo: "",
                    telefono: "",
                    complemento: "",
                    codactividad: "",
                    nombrecomercial: "",
                    departamento: "",
                    municipio: ""
                });
                setSelectedDepartamento("");
                setSelectedMunicipio("");
                fetchEmpresas();
            }
        } catch (error) {
            console.error("Error al agregar la empresa:", error);
            setErrorMessage("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();

        // Validaciones con límites definidos
        if (formData.nombre.length > LIMITES.NOMBRE) {
            setErrorMessage(`El nombre no puede exceder ${LIMITES.NOMBRE} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (!validateNIT(formData.nit)) {
            setErrorMessage(`Formato de NIT inválido. Debe tener exactamente ${LIMITES.NIT} dígitos.`);
            setShowErrorModal(true);
            return;
        }
        
        if (!validateNRC(formData.nrc)) {
            setErrorMessage(`Formato de NRC inválido. Debe tener exactamente ${LIMITES.NRC} dígitos.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.giro.length > LIMITES.GIRO) {
            setErrorMessage(`El giro no puede exceder ${LIMITES.GIRO} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.correo.length > LIMITES.CORREO) {
            setErrorMessage(`El correo no puede exceder ${LIMITES.CORREO} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (!validateTelefono(formData.telefono)) {
            setErrorMessage(`Formato de teléfono inválido. Debe tener exactamente ${LIMITES.TELEFONO} dígitos.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.complemento.length > LIMITES.COMPLEMENTO) {
            setErrorMessage(`El complemento no puede exceder ${LIMITES.COMPLEMENTO} caracteres.`);
            setShowErrorModal(true);
            return;
        }
        
        if (formData.nombrecomercial.length > LIMITES.NOMBRE_COMERCIAL) {
            setErrorMessage(`El nombre comercial no puede exceder ${LIMITES.NOMBRE_COMERCIAL} caracteres.`);
            setShowErrorModal(true);
            return;
        }

        // Preparar los datos para enviar al endpoint
        const dataToSend = {
            ...formData,
            departamento: selectedDepartamento,
            municipio: selectedMunicipio,
        };

        try {
            const response = await fetch(`http://localhost:3000/personasJuridicas/updatePerJu/${formData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: document.cookie,
                },
                credentials: "include",
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes("NIT o NRC ya pertenecen a otra empresa")) {
                    setErrorMessage("El NIT o NRC ya pertenecen a otra empresa. Verifique los datos.");
                    setShowErrorModal(true);
                } else {
                    throw new Error("Error al actualizar la empresa");
                }
            } else {
                // Cerrar el modal y resetear el formulario
                setShowEditModal(false);
                setFormData({
                    nombre: "",
                    nit: "",
                    nrc: "",
                    giro: "",
                    correo: "",
                    telefono: "",
                    complemento: "",
                    codactividad: "",
                    nombrecomercial: "",
                    departamento: "",
                    municipio: ""
                });
                setSelectedDepartamento("");
                setSelectedMunicipio("");
                fetchEmpresas();
            }
        } catch (error) {
            console.error("Error al actualizar la empresa:", error);
            setErrorMessage("Ocurrió un error inesperado. Por favor, inténtelo de nuevo.");
            setShowErrorModal(true);
        }
    };

    const handleDeleteClient = async (empresaId) => {
        try {
            const response = await fetch(`http://localhost:3000/personasJuridicas/deletePerJu/${empresaId}`, {
                method: "DELETE",
                headers: {
                    Cookie: document.cookie,
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Error al eliminar la empresa");
            }

            fetchEmpresas();
        } catch (error) {
            console.error("Error al eliminar la empresa:", error);
        }
    };

    const validateNIT = (nit) => {
        const nitRegex = new RegExp(`^\\d{${LIMITES.NIT}}$`);
        return nitRegex.test(nit);
    };

    const validateNRC = (nrc) => {
        const nrcRegex = new RegExp(`^\\d{${LIMITES.NRC}}$`);
        return nrcRegex.test(nrc);
    };

    const validateTelefono = (telefono) => {
        const telefonoRegex = new RegExp(`^\\d{${LIMITES.TELEFONO}}$`);
        return telefonoRegex.test(telefono);
    };

    const validateComplemento = (complemento) => {
        return complemento.length <= LIMITES.COMPLEMENTO;
    };

    const handleNITChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del NIT según el límite definido
        const nitValue = value.slice(0, LIMITES.NIT);
        setFormData({ ...formData, nit: nitValue });

        if (!validateNIT(nitValue)) {
            setNitError(`El NIT debe tener exactamente ${LIMITES.NIT} dígitos.`);
        } else {
            setNitError("");
        }
    };

    const handleNRCChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del NRC según el límite definido
        const nrcValue = value.slice(0, LIMITES.NRC);
        setFormData({ ...formData, nrc: nrcValue });

        if (!validateNRC(nrcValue)) {
            setNrcError(`El NRC debe tener exactamente ${LIMITES.NRC} dígitos.`);
        } else {
            setNrcError("");
        }
    };

    const handleTelefonoChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del teléfono según el límite definido
        const telefonoValue = value.slice(0, LIMITES.TELEFONO);
        setFormData({ ...formData, telefono: telefonoValue });

        if (!validateTelefono(telefonoValue)) {
            setTelefonoError(`El teléfono debe tener exactamente ${LIMITES.TELEFONO} dígitos.`);
        } else {
            setTelefonoError("");
        }
    };

    const handleComplementoChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del complemento según el límite definido
        const complementoValue = value.slice(0, LIMITES.COMPLEMENTO);
        setFormData({ ...formData, complemento: complementoValue });

        if (!validateComplemento(complementoValue)) {
            setComplementoError(`El complemento no puede exceder ${LIMITES.COMPLEMENTO} caracteres.`);
        } else {
            setComplementoError("");
        }
    };

    const handleNombreChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del nombre según el límite definido
        const nombreValue = value.slice(0, LIMITES.NOMBRE);
        setFormData({ ...formData, nombre: nombreValue });
    };

    const handleGiroChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del giro según el límite definido
        const giroValue = value.slice(0, LIMITES.GIRO);
        setFormData({ ...formData, giro: giroValue });
    };

    const handleCorreoChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del correo según el límite definido
        const correoValue = value.slice(0, LIMITES.CORREO);
        setFormData({ ...formData, correo: correoValue });
    };

    const handleNombreComercialChange = (e) => {
        const { value } = e.target;
        // Limitar la longitud del nombre comercial según el límite definido
        const nombreComercialValue = value.slice(0, LIMITES.NOMBRE_COMERCIAL);
        setFormData({ ...formData, nombrecomercial: nombreComercialValue });
    };

    const handleEditClick = (empresa) => {
        setFormData(empresa);
        setSelectedDepartamento(empresa.departamento);
        setSelectedMunicipio(empresa.municipio);
        setShowEditModal(true);
    };

    const handleDeleteClick = (empresaId) => {
        setClientToDelete(empresaId);
        setShowDeleteConfirmModal(true);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <div className="flex flex-1 h-full overflow-hidden">
                <div
                    className={`md:static fixed z-40 h-full transition-all duration-300 ${sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                        } ${!isMobile ? 'md:translate-x-0 md:w-64' : ''
                        }`}
                >
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
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
                            </div>

                            <div className="flex items-center">
                                {user?.name && (
                                    <span className="mr-2 text-xs md:text-sm text-black font-medium truncate max-w-24 md:max-w-none">
                                        {user.name}
                                    </span>
                                )}
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white font-medium">
                                    {user?.name ? user.name.charAt(0) : "U"}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center">
                                <FaBuilding className="text-blue-600 mr-3 text-xl" />
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Personas Jurídicas</h2>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center w-full sm:w-auto justify-center"
                            >
                                <FaPlus className="mr-2" /> Agregar
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, NIT o NRC"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="text-gray-900 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    <FaSearch />
                                </button>
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <div className="overflow-x-auto rounded-lg shadow bg-white">
                                <div className="min-w-[1000px]">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIT</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NRC</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giro</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complemento</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código de Actividad</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Comercial</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipio</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredEmpresas && Array.isArray(filteredEmpresas) && filteredEmpresas.slice(0, 10).map((empresa) => (
                                                <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.nombre}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.nit}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.nrc}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.giro}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.correo}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.telefono}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.complemento}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.codactividad}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.nombrecomercial}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getNombreDepartamento(empresa.departamento)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {getNombreMunicipio(empresa.municipio, empresa.departamento)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEditClick(empresa)}
                                                            className="text-blue-600 hover:text-blue-800 mr-2"
                                                            aria-label="Editar"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(empresa.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                            aria-label="Eliminar"
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

                        <div className="md:hidden">
                            <div className="space-y-4">
                                {filteredEmpresas && Array.isArray(filteredEmpresas) && filteredEmpresas.slice(0, 10).map((empresa) => (
                                    <div key={empresa.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-medium text-gray-900">{empresa.nombre}</h3>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(empresa)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(empresa.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    aria-label="Eliminar"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">NIT:</span>
                                                <span className="text-sm text-gray-900">{empresa.nit}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">NRC:</span>
                                                <span className="text-sm text-gray-900">{empresa.nrc}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Giro:</span>
                                                <span className="text-sm text-gray-900">{empresa.giro}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Correo:</span>
                                                <span className="text-sm text-gray-900">{empresa.correo}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                                                <span className="text-sm text-gray-900">{empresa.telefono}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Complemento:</span>
                                                <span className="text-sm text-gray-900">{empresa.complemento}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Código de Actividad:</span>
                                                <span className="text-sm text-gray-900">{empresa.codactividad}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Nombre Comercial:</span>
                                                <span className="text-sm text-gray-900">{empresa.nombrecomercial}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Departamento:</span>
                                                <span className="text-sm text-gray-900">
                                                    {getNombreDepartamento(empresa.departamento)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Municipio:</span>
                                                <span className="text-sm text-gray-900">
                                                    {getNombreMunicipio(empresa.municipio, empresa.departamento)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
            </div>

            {showSearchResultsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Resultados de la Búsqueda</h3>
                            <button
                                onClick={() => setShowSearchResultsModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            {filteredEmpresas && Array.isArray(filteredEmpresas) && filteredEmpresas.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredEmpresas.map((empresa) => (
                                        <div key={empresa.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-medium text-gray-900">{empresa.nombre}</h3>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">NIT:</span>
                                                    <span className="text-sm text-gray-900">{empresa.nit}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">NRC:</span>
                                                    <span className="text-sm text-gray-900">{empresa.nrc}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Giro:</span>
                                                    <span className="text-sm text-gray-900">{empresa.giro}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Correo:</span>
                                                    <span className="text-sm text-gray-900">{empresa.correo}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                                                    <span className="text-sm text-gray-900">{empresa.telefono}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Complemento:</span>
                                                    <span className="text-sm text-gray-900">{empresa.complemento}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Código de Actividad:</span>
                                                    <span className="text-sm text-gray-900">{empresa.codactividad}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Nombre Comercial:</span>
                                                    <span className="text-sm text-gray-900">{empresa.nombrecomercial}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Departamento:</span>
                                                    <span className="text-sm text-gray-900">
                                                        {getNombreDepartamento(empresa.departamento)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-500">Municipio:</span>
                                                    <span className="text-sm text-gray-900">
                                                        {getNombreMunicipio(empresa.municipio, empresa.departamento)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-700">No se encontraron resultados.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Agregar Persona Jurídica</h3>
                            <button
                                onClick={() => {
                                    if (Object.values(formData).some(val => val.trim() !== '')) {
                                        setShowCancelConfirmModal(true);
                                    } else {
                                        setShowAddModal(false);
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <form onSubmit={handleSaveNewClient}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre de la Persona Jurídica
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleNombreChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NOMBRE}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.nombre.length}/{LIMITES.NOMBRE} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nit">
                                        NIT (14 dígitos)
                                    </label>
                                    <input
                                        type="text"
                                        id="nit"
                                        name="nit"
                                        value={formData.nit}
                                        onChange={handleNITChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NIT}
                                    />
                                    {nitError && <p className="text-red-500 text-sm mt-1">{nitError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.nit.length}/{LIMITES.NIT} dígitos</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nrc">
                                        NRC (8 dígitos)
                                    </label>
                                    <input
                                        type="text"
                                        id="nrc"
                                        name="nrc"
                                        value={formData.nrc}
                                        onChange={handleNRCChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NRC}
                                    />
                                    {nrcError && <p className="text-red-500 text-sm mt-1">{nrcError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.nrc.length}/{LIMITES.NRC} dígitos</p>
                                </div>

                                {/* Dropdown de Código de Actividad con react-select */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codactividad">
                                        Código de Actividad
                                    </label>
                                    <Select
                                        id="codactividad"
                                        name="codactividad"
                                        options={optionsCodActividad}
                                        value={optionsCodActividad.find(opt => opt.value === formData.codactividad)}
                                        onChange={handleCodActividadChange}
                                        placeholder="Seleccione un código de actividad"
                                        isSearchable
                                        noOptionsMessage={() => "No se encontraron resultados"}
                                        className="text-black"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="giro">
                                        Giro
                                    </label>
                                    <input
                                        type="text"
                                        id="giro"
                                        name="giro"
                                        value={formData.giro}
                                        onChange={handleGiroChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.GIRO}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.giro.length}/{LIMITES.GIRO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="correo"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleCorreoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.CORREO}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.correo.length}/{LIMITES.CORREO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">
                                        Teléfono (8 dígitos)
                                    </label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleTelefonoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.TELEFONO}
                                    />
                                    {telefonoError && <p className="text-red-500 text-sm mt-1">{telefonoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.telefono.length}/{LIMITES.TELEFONO} dígitos</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombrecomercial">
                                        Nombre Comercial
                                    </label>
                                    <input
                                        type="text"
                                        id="nombrecomercial"
                                        name="nombrecomercial"
                                        value={formData.nombrecomercial}
                                        onChange={handleNombreComercialChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NOMBRE_COMERCIAL}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.nombrecomercial.length}/{LIMITES.NOMBRE_COMERCIAL} caracteres</p>
                                </div>

                                {/* Dropdown de Departamentos */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="departamento">
                                        Departamento
                                    </label>
                                    <select
                                        id="departamento"
                                        name="departamento"
                                        value={selectedDepartamento}
                                        onChange={(e) => setSelectedDepartamento(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un departamento</option>
                                        {departamentos.map(depto => (
                                            <option key={depto.codigo} value={depto.codigo}>
                                                {depto.codigo} - {depto.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dropdown de Municipios */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="municipio">
                                        Municipio
                                    </label>
                                    <select
                                        id="municipio"
                                        name="municipio"
                                        value={selectedMunicipio}
                                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un municipio</option>
                                        {municipiosFiltrados.map(muni => (
                                            <option key={muni.codigo} value={muni.codigo}>
                                                {muni.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="complemento">
                                        Complemento
                                    </label>
                                    <input
                                        type="text"
                                        id="complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleComplementoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        maxLength={LIMITES.COMPLEMENTO}
                                    />
                                    {complementoError && <p className="text-red-500 text-sm mt-1">{complementoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.complemento.length}/{LIMITES.COMPLEMENTO} caracteres</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (Object.values(formData).some(val => val.trim() !== '')) {
                                                setShowCancelConfirmModal(true);
                                            } else {
                                                setShowAddModal(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Editar Persona Jurídica</h3>
                            <button
                                onClick={() => {
                                    if (Object.values(formData).some(val => val.trim() !== '')) {
                                        setShowCancelConfirmModal(true);
                                    } else {
                                        setShowEditModal(false);
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <form onSubmit={handleUpdateClient}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                                        Nombre de la Persona Jurídica
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleNombreChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NOMBRE}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.nombre.length}/{LIMITES.NOMBRE} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nit">
                                        NIT (14 dígitos)
                                    </label>
                                    <input
                                        type="text"
                                        id="nit"
                                        name="nit"
                                        value={formData.nit}
                                        onChange={handleNITChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NIT}
                                    />
                                    {nitError && <p className="text-red-500 text-sm mt-1">{nitError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.nit.length}/{LIMITES.NIT} dígitos</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nrc">
                                        NRC (8 dígitos)
                                    </label>
                                    <input
                                        type="text"
                                        id="nrc"
                                        name="nrc"
                                        value={formData.nrc}
                                        onChange={handleNRCChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NRC}
                                    />
                                    {nrcError && <p className="text-red-500 text-sm mt-1">{nrcError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.nrc.length}/{LIMITES.NRC} dígitos</p>
                                </div>

                                {/* Dropdown de Código de Actividad con react-select */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codactividad">
                                        Código de Actividad
                                    </label>
                                    <Select
                                        id="codactividad"
                                        name="codactividad"
                                        options={optionsCodActividad}
                                        value={optionsCodActividad.find(opt => opt.value === formData.codactividad)}
                                        onChange={handleCodActividadChange}
                                        placeholder="Seleccione un código de actividad"
                                        isSearchable
                                        noOptionsMessage={() => "No se encontraron resultados"}
                                        className="text-black"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="giro">
                                        Giro
                                    </label>
                                    <input
                                        type="text"
                                        id="giro"
                                        name="giro"
                                        value={formData.giro}
                                        onChange={handleGiroChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.GIRO}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.giro.length}/{LIMITES.GIRO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="correo">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="correo"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleCorreoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.CORREO}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.correo.length}/{LIMITES.CORREO} caracteres</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefono">
                                        Teléfono (8 dígitos)
                                    </label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleTelefonoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.TELEFONO}
                                    />
                                    {telefonoError && <p className="text-red-500 text-sm mt-1">{telefonoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.telefono.length}/{LIMITES.TELEFONO} dígitos</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombrecomercial">
                                        Nombre Comercial
                                    </label>
                                    <input
                                        type="text"
                                        id="nombrecomercial"
                                        name="nombrecomercial"
                                        value={formData.nombrecomercial}
                                        onChange={handleNombreComercialChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                        maxLength={LIMITES.NOMBRE_COMERCIAL}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.nombrecomercial.length}/{LIMITES.NOMBRE_COMERCIAL} caracteres</p>
                                </div>

                                {/* Dropdown de Departamentos */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="departamento">
                                        Departamento
                                    </label>
                                    <select
                                        id="departamento"
                                        name="departamento"
                                        value={selectedDepartamento}
                                        onChange={(e) => setSelectedDepartamento(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un departamento</option>
                                        {departamentos.map(depto => (
                                            <option key={depto.codigo} value={depto.codigo}>
                                                {depto.codigo} - {depto.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dropdown de Municipios */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="municipio">
                                        Municipio
                                    </label>
                                    <select
                                        id="municipio"
                                        name="municipio"
                                        value={selectedMunicipio}
                                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccione un municipio</option>
                                        {municipiosFiltrados.map(muni => (
                                            <option key={muni.codigo} value={muni.codigo}>
                                                {muni.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="complemento">
                                        Complemento
                                    </label>
                                    <input
                                        type="text"
                                        id="complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleComplementoChange}
                                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        maxLength={LIMITES.COMPLEMENTO}
                                    />
                                    {complementoError && <p className="text-red-500 text-sm mt-1">{complementoError}</p>}
                                    <p className="text-xs text-gray-500 mt-1">{formData.complemento.length}/{LIMITES.COMPLEMENTO} caracteres</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (Object.values(formData).some(val => val.trim() !== '')) {
                                                setShowCancelConfirmModal(true);
                                            } else {
                                                setShowEditModal(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Confirmar Eliminación</h3>
                            <button
                                onClick={() => setShowDeleteConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                ¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteClient(clientToDelete);
                                        setShowDeleteConfirmModal(false);
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCancelConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Confirmar Cancelación</h3>
                            <button
                                onClick={() => setShowCancelConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Tienes cambios sin guardar. ¿Estás seguro de que deseas cancelar?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCancelConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                >
                                    Continuar Editando
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCancelConfirmModal(false);
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                        setFormData({
                                            nombre: "",
                                            nit: "",
                                            nrc: "",
                                            giro: "",
                                            correo: "",
                                            telefono: "",
                                            complemento: "",
                                            codactividad: "",
                                            nombrecomercial: "",
                                            departamento: "",
                                            municipio: ""
                                        });
                                        setSelectedDepartamento("");
                                        setSelectedMunicipio("");
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                >
                                    Confirmar Cancelación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Error</h3>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                                aria-label="Cerrar"
                            >
                                <FaClose className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">{errorMessage}</p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}