// src/app/services/auth.js

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";


export const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ correo: email, contrasena: password }),
  });

  if (!response.ok) {
    throw new Error('Credenciales inválidas');
  }

  const data = await response.json();
  
  // Verificar token de Hacienda después del login exitoso
  const haciendaCheck = await fetch('http://localhost:3000/hacienda/token-check', {
    method: 'GET',
    credentials: 'include',
  });

  if (!haciendaCheck.ok) {
    throw new Error('Error al conectar con Hacienda');
  }

  return data; // Ahora incluye la información del empleado
};

export const logout = async () => {
  const response = await fetch('http://localhost:3000/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Error al cerrar sesión');
  }

  return response.json();
};

// src/services/auth.js
export const checkAuthStatus = async (cookie = '') => {
  try {
    // Verificar autenticación en nuestro sistema
    const authResponse = await fetch('http://localhost:3000/checkAuth', {
      method: 'GET',
      headers: {
        Cookie: cookie,
      },
      credentials: 'include',
    });

    if (!authResponse.ok) {
      return { isAuthenticated: false, hasHaciendaToken: false };
    }

    const userData = await authResponse.json();
    
    // Obtener todos los empleados y buscar por email
    let userWithCompleteInfo = userData.user;
    
    if (userData.user && userData.user.emailemp) {
      try {
        const empleadosResponse = await fetch('http://localhost:3000/empleados/getAll', {
          method: 'GET',
          headers: {
            Cookie: cookie,
          },
          credentials: 'include',
        });
        
        if (empleadosResponse.ok) {
          const empleadosData = await empleadosResponse.json();
          const empleadoEncontrado = empleadosData.empleados?.find(
            emp => emp.correo === userData.user.emailemp
          );
          
          if (empleadoEncontrado) {
            userWithCompleteInfo = {
              ...userData.user,
              rol: empleadoEncontrado.rol,
              nombre: empleadoEncontrado.nombre,
              idempleado: empleadoEncontrado.idempleado,
              estado: empleadoEncontrado.estado
            };
          }
        }
      } catch (error) {
        console.error("Error al obtener empleados:", error);
      }
    }

    // Verificar estado del token de Hacienda
    const haciendaStatus = await fetch('http://localhost:3000/statusTokenhacienda', {
      method: 'GET',
      headers: {
        Cookie: cookie,
      },
      credentials: 'include',
    });

    const haciendaData = haciendaStatus.ok ? await haciendaStatus.json() : { valid: false };
    
    return {
      isAuthenticated: true,
      hasHaciendaToken: haciendaStatus.ok && haciendaData.valid,
      haciendaStatus: haciendaData,
      user: userWithCompleteInfo  // ← Usuario con información completa
    };
  } catch (error) {
    console.error("Error al verificar autenticación:", error);
    return { isAuthenticated: false, hasHaciendaToken: false };
  }
};
// Función para verificar si el empleado tiene un rol específico
export const hasRole = (empleado, requiredRole) => {
  return empleado && empleado.rol === requiredRole;
};

// Función para verificar si el empleado es admin
export const isAdmin = (empleado) => {
  return hasRole(empleado, 'admin');
};