// src/app/dashboard/persona_juridica/page.js
import Productos from "./productos";
import { API_BASE_URL } from "@/lib/api";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function Produc() {
    // Obtener cookies en el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación y obtener información completa
    const authStatus = await checkAuthStatus(cookie);
    
    console.log("Usuario completo desde checkAuthStatus:", authStatus.user);
    console.log("AuthStatus completo:", authStatus);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    // Verificar si el usuario es administrador
    if (authStatus.user.rol !== "admin") {
        console.log("Redirigiendo - Usuario no es admin. Rol:", authStatus.user.rol);
        redirect("/dashboard/unauthorized");
    }

    // Obtener las empresas del usuario
    let productos = [];
    try {
        const response = await fetch(`${API_BASE_URL}/productos/getAll`, {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Error al obtener los productos");
        }
        
        productos = await response.json();
    } catch (error) {
        console.error("Error al obtener los productos:", error);
    }

    // Pasar los productos y el usuario como props al Client Component
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <Productos 
                initialProductos={productos}
                user={authStatus.user} // ← CORREGIDO: usar authStatus.user en lugar de user
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}