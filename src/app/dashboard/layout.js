// src/app/dashboard/layout.js
//layout para model de perfil

export default function DashboardLayout({ children, modal }) {
  return (
    <div className="relative min-h-screen">
      {children}
      {/* Cualquier ruta que vaya al slot @modal se inyecta aquí como overlay */}
      {modal ?? null}
    </div>
  );
}
