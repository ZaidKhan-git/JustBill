import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    sessionId: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedSessionId = localStorage.getItem('sessionId');
        if (storedSessionId) {
            setSessionId(storedSessionId);
            fetchUser(storedSessionId);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async (sid: string) => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'x-session-id': sid },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setSessionId(sid);
            } else {
                // Invalid session
                localStorage.removeItem('sessionId');
                setSessionId(null);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
        }

        const data = await res.json();
        setUser(data.user);
        setSessionId(data.sessionId);
        localStorage.setItem('sessionId', data.sessionId);
    };

    const register = async (email: string, password: string, name: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Registration failed');
        }

        const data = await res.json();
        setUser(data.user);
        setSessionId(data.sessionId);
        localStorage.setItem('sessionId', data.sessionId);
    };

    const logout = async () => {
        if (sessionId) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'x-session-id': sessionId },
            });
        }
        setUser(null);
        setSessionId(null);
        localStorage.removeItem('sessionId');
    };

    return (
        <AuthContext.Provider value={{ user, sessionId, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
