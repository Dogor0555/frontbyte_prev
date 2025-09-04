// src/app/dashboard/sucursales/page.js
import Sucursales from "./sucursal";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus, isAdmin } from "../../services/auth";
import { checkAuthStatus } from "../../services/auth";

export default async function PageSucursales() {
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

    // Obtener las sucursales
    let initial = { ok: true, data: [], meta: { total: 0, page: 1, limit: 10, pages: 1 } };
    try {
        const resp = await fetch("http://localhost:3000/sucursal/getAll?page=1&limit=10", {
            method: "GET",
            headers: { 
                Cookie: cookie,
            },
            credentials: "include",
            cache: "no-store",
        });
        
        const json = await resp.json();
        initial = Array.isArray(json)
            ? { ok: true, data: json, meta: { total: json.length, page: 1, limit: 10, pages: 1 } }
            : json;
    } catch (error) {
        console.error("Error al obtener las sucursales:", error);
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <Sucursales 
                initialData={initial}
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}