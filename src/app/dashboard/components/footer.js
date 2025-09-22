// src/app/dashboard/components/footer.js
export default function Footer() {
    return (
        <footer className="bg-gradient-to-r from-blue-50 to-indigo-50/80 backdrop-blur-sm border-t border-blue-200/50">
            <div className="p-4 text-center">
                <div className="text-sm text-gray-600 font-medium">
                    Sistema de Facturación Electrónica de <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">Byte Fusion Soluciones</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Versión 1.0 · © 2025 · Todos los derechos reservados
                </div>
            </div>
        </footer>
    );
}