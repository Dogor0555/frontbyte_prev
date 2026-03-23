// src/app/dashboard/layout.js
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import FloatingChat from "./components/FloatingChat";

export default function DashboardLayout({ children, modal }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    // Obtener usuario del localStorage
    const empleado = localStorage.getItem("empleado");
    if (empleado) {
      setUser(JSON.parse(empleado));
    }
  }, []);

  // No mostrar el chat en la página de soporte para evitar duplicación
  const showChat = !pathname?.includes("/soporte");

  return (
    <div className="relative min-h-screen">
      {children}
      {/* Cualquier ruta que vaya al slot @modal se inyecta aquí como overlay */}
      {modal ?? null}
      {/* Chat flotante de soporte - aparece en todas las páginas excepto en /soporte */}
      {showChat && user && <FloatingChat user={user} />}
    </div>
  );
}