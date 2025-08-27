// src/app/dashboard/empleados/page.js
import Empleados from "./empleados";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuthStatus } from "../../services/auth";

export default async function EmpleadosPage() {
    // Obtener cookies en el servidor
    const cookieStore = await cookies();
    const cookie = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    // Verificar autenticación y obtener información completa
    const authResult = await checkAuthStatus(cookie);
    
    console.log("Usuario completo desde checkAuthStatus:", authResult.user); // DEBUG
    
    if (!authResult.isAuthenticated || !authResult.user) {
        redirect("/auth/login");
    }

    // Verificar si el usuario es administrador
    if (authResult.user.rol !== "admin") {
        console.log("Redirigiendo - Usuario no es admin. Rol:", authResult.user.rol);
        redirect("/dashboard/unauthorized");
    }

    // Obtener empleados desde la API
    let empleados = [];
    try {
        const response = await fetch("http://localhost:3000/empleados/getAll", {
            method: "GET",
            headers: {
                Cookie: cookie,
            },
            credentials: "include",
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener los empleados`);
        }

        const data = await response.json();
        empleados = data.empleados || [];
        console.log("Empleados obtenidos:", empleados.length); // DEBUG
    } catch (error) {
        console.error("Error al obtener los empleados:", error);
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
            <Empleados initialEmpleados={empleados} user={authResult.user} />
        </Suspense>
    );
}