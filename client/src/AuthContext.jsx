import { createContext, useContext, useEffect, useState } from "react";
import {api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }
        api('/auth/me')
            .then(data => setUser(data.user))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false));
    }, []);

    async function authenticate(path, body) {
        const data = await api(path, { method: 'POST', body });
        localStorage.setItem('token', data.token);
        setUser(data.user);
    }

    const login = (email, password) =>
        authenticate('/auth/login', { email, password });
    const register = (name, email, password) =>
        authenticate('/auth/register', { name, email, password });

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);