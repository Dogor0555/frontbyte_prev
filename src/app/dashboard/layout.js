// src/app/dashboard/layout.js
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import FloatingChat from "./components/FloatingChat";
import ToastContainer from "./components/Toast";
import { initSidebarState, onSidebarChange } from "./components/sidebarState";

export default function DashboardLayout({ children, modal }) {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarCollapsed(initSidebarState());
    const unsub = onSidebarChange((val) => setSidebarCollapsed(val));
    return unsub;
  }, []);

  useEffect(() => {
    const empleado = localStorage.getItem("empleado");
    if (empleado) {
      setUser(JSON.parse(empleado));
    }
  }, []);

  const showChat = !pathname?.includes("/soporte");

  return (
    <div className={`relative min-h-screen transition-all duration-300 md:pl-64 ${sidebarCollapsed ? 'md:!pl-16' : ''}`}>
      {children}
      {modal ?? null}
      {showChat && user && <FloatingChat user={user} />}
      <ToastContainer />
    </div>
  );
}
