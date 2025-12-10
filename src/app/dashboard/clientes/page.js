// src/app/dashboard/clientes/page.js
import Clientes from "./clientes";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { checkPermissionAndRedirect } from "../components/authorization.js";

export default async function ClientesPage() {
    // Verificación de permisos
    await checkPermissionAndRedirect("Clientes");

    // Obtener cookies en el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación y obtener información completa
    const authStatus = await checkAuthStatus(cookie);
    
    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    // Obtener clientes desde la API
    let clientes = [];
    try {
        const response = await fetch("http://localhost:3000/clientes/getAllCli", {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener los clientes`);
        }

        const data = await response.json();
        clientes = data.data || [];
        console.log("Clientes obtenidos:", clientes.length);
    } catch (error) {
        console.error("Error al obtener los clientes:", error);
    }

    // Pasar datos al Client Component
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <Clientes 
                initialClientes={clientes} 
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}