import Sucursal from "./sucursal";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function SucursalPage() {
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const authStatus = await checkAuthStatus(cookie);
    
    console.log("Usuario completo desde checkAuthStatus:", authStatus.user);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    if (authStatus.user.rol !== "admin" && authStatus.user.rol !== "manager") {
        console.log("Redirigiendo - Usuario no tiene permisos. Rol:", authStatus.user.rol);
        redirect("/dashboard/unauthorized");
    }

    let sucursalData = null;
    try {
        const response = await fetch(`http://localhost:3000/sucursal/${authStatus.user.idsucursal}`, {
            method: "GET",
            headers: {
                Cookie: cookie,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include",
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener la sucursal`);
        }

        const data = await response.json();
        
        sucursalData = data.data || null;
        console.log("Sucursal obtenida:", sucursalData);
    } catch (error) {
        console.error("Error al obtener la sucursal:", error);
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <Sucursal 
                sucursal={sucursalData} 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}