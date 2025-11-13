import ConfigurarTickets from "./configurar-tickets";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function ConfigurarTicketsPage() {
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

    // Verificar permisos - solo admin y manager pueden configurar tickets
    if (authStatus.user.rol !== "admin" && authStatus.user.rol !== "manager") {
        console.log("Redirigiendo - Usuario no tiene permisos para configurar tickets. Rol:", authStatus.user.rol);
        redirect("/dashboard/unauthorized");
    }

    let configuracionTicketsData = null;
    try {
        // Intentar obtener la configuración existente para esta sucursal
        const response = await fetch(`http://localhost:3000/configuracion-tickets/sucursal/${authStatus.user.idsucursal}`, {
            method: "GET",
            headers: {
                Cookie: cookie,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include",
        });
        
        if (response.ok) {
            const data = await response.json();
            configuracionTicketsData = data.data || null;
            console.log("Configuración de tickets obtenida:", configuracionTicketsData);
        } else if (response.status === 404) {
            // No existe configuración para esta sucursal, se creará una nueva
            console.log("No existe configuración de tickets para esta sucursal, se creará una nueva");
            configuracionTicketsData = null;
        } else {
            throw new Error(`Error ${response.status} al obtener la configuración de tickets`);
        }
    } catch (error) {
        console.error("Error al obtener la configuración de tickets:", error);
    }

    // Obtener información de la sucursal para mostrar en el formulario
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
        
        if (response.ok) {
            const data = await response.json();
            sucursalData = data.data || null;
        }
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
            <ConfigurarTickets 
                configuracionTickets={configuracionTicketsData}
                sucursal={sucursalData}
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}