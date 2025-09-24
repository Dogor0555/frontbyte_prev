import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import PerfilEmpleado from "./perfilEmpleado";
import { checkAuthStatus } from "../../services/auth";

export default async function PerfilPage() {
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

    // Obtener perfil desde la API
    let perfil = null;
    try {
        const response = await fetch("http://localhost:3000/perfil", {
            method: "GET",
            headers: {
                Cookie: cookie,
                "Content-Type": "application/json",
            },
            cache: "no-store",
            credentials: "include",
        });

        if (response.status === 401) {
            redirect("/auth/login");
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener el perfil`);
        }

        const data = await response.json();
        perfil = data;
        console.log("Perfil obtenido:", perfil);
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
        redirect("/dashboard/error");
    }

    // Determinar permisos basado en el rol
    const canEdit = String(perfil?.rol ?? "").toLowerCase() !== "vendedor";

    // Pasar datos al Client Component
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <PerfilEmpleado 
                perfil={perfil} 
                canEdit={canEdit}
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}