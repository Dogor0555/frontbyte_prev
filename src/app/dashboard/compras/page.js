// src/app/dashboard/compras/page.js
import Compras from "./compras";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";
import { checkPermissionAndRedirect } from "../components/authorization.js";
import { API_BASE_URL } from "@/lib/api";

export default async function PageCompras() {
    // Verificación de permisos
    await checkPermissionAndRedirect("Compras");

    // Obtener cookies desde el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación
    const authStatus = await checkAuthStatus(cookie);

    if (!authStatus.isAuthenticated || !authStatus.user) {
        redirect("/auth/login");
    }

    // Obtener compras y proveedores
    let compras = [];
    let proveedores = [];
    
    try {
        // Obtener compras
        const comprasResponse = await fetch(`${API_BASE_URL}/compras/getAll`, {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
            cache: "no-store",
        });

        if (comprasResponse.ok) {
            compras = await comprasResponse.json();
        }

        // Obtener proveedores
        const proveedoresResponse = await fetch(`${API_BASE_URL}/proveedores/getAll`, {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
            cache: "no-store",
        });

        if (proveedoresResponse.ok) {
            proveedores = await proveedoresResponse.json();
        }

    } catch (error) {
        console.error("Error al obtener los datos:", error);
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            }
        >
            <Compras
                initialCompras={compras}
                initialProveedores={proveedores}
                user={authStatus.user}
                hasHaciendaToken={authStatus.hasHaciendaToken}
                haciendaStatus={authStatus.haciendaStatus}
            />
        </Suspense>
    );
}