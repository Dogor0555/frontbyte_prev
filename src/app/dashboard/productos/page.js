// src/app/dashboard/persona_juridica/page.js
import Productos from "./productos";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkAuth } from "../../../lib/auth";

export default async function Produc() {
    // Obtener las cookies del usuario (usando await)
  const cookieStore = await cookies(); // ¡Aquí está el cambio!
  const cookie = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Verificar la autenticación del lado del servidor
  const user = await checkAuth(cookie);

  // Si el usuario no está autenticado, redirigir al login
  if (!user) {
    redirect("/auth/login");
  }

    // Obtener las empresas del usuario
    let productos = []; // Inicializar como array vacío
    try {
        const response = await fetch("http://localhost:3000/productos/getAll", {
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
            <Productos initialProductos={productos} user={user} />
            </Suspense>
    );
}

