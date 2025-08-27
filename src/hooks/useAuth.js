"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuthStatus } from '../app/services/auth';

export function useAuth(required = true) {
    const router = useRouter();
    const pathname = usePathname();
    
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        hasHaciendaToken: false,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        let isMounted = true;

        const verifyAuth = async () => {
            try {
                const authStatus = await checkAuthStatus();
                
                if (isMounted) {
                    setAuthState({
                        isAuthenticated: authStatus.isAuthenticated,
                        hasHaciendaToken: authStatus.hasHaciendaToken,
                        isLoading: false,
                        error: null
                    });

                    // Redirigir si la autenticación es requerida y no está autenticado
                    if (required && (!authStatus.isAuthenticated || !authStatus.hasHaciendaToken)) {
                        const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
                        router.push(loginUrl);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setAuthState({
                        isAuthenticated: false,
                        hasHaciendaToken: false,
                        isLoading: false,
                        error: error.message
                    });

                    if (required) {
                        const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
                        router.push(loginUrl);
                    }
                }
            }
        };

        verifyAuth();

        return () => {
            isMounted = false;
        };
    }, [router, pathname, required]);

    return authState;
}