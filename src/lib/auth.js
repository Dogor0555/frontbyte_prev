// src/lib/auth.js
// src/lib/auth.js
import { API_BASE_URL } from "@/lib/api";

export async function checkAuth(cookie = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/checkAuth`, {
            method: 'GET',
            headers: {
                Cookie: cookie,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        // Si el endpoint no devuelve la información completa del empleado,
        // necesitamos hacer una consulta adicional
        if (data.user && data.user.emailemp) {
            // Consultar información completa del empleado
            const empleadoResponse = await fetch(`${API_BASE_URL}/empleados/by-email/${data.user.emailemp}`, {
                method: 'GET',
                headers: {
                    Cookie: cookie,
                },
                credentials: 'include',
            });
            
            if (empleadoResponse.ok) {
                const empleadoData = await empleadoResponse.json();
                return {
                    ...data.user,
                    ...empleadoData.empleado // Incluir toda la info del empleado
                };
            }
        }
        
        return data.user || null;
    } catch (error) {
        console.error("Error en checkAuth:", error);
        return null;
    }
}