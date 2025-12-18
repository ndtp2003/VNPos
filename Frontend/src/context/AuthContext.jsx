import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    useEffect(() => {
        const checkAuth = () => {
            const storedToken = localStorage.getItem('token');
            const storedUserInfo = localStorage.getItem('userInfo');
            
            if(storedToken){
                try {
                    const decoded = jwtDecode(storedToken);
                    // Check if token is expired
                    if(decoded.exp * 1000 < Date.now()){
                        logout();
                        setIsLoading(false);
                    } else {
                        setToken(storedToken);
                        setIsAuthenticated(true);
                        
                        // Restore user info from localStorage if available
                        if(storedUserInfo) {
                            try {
                                const userInfo = JSON.parse(storedUserInfo);
                                setUser(userInfo);
                            } catch (e) {
                                // Fallback to token if localStorage parse fails
                                if(decoded.name || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/name']) {
                                    setUser({
                                        fullName: decoded.name || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'],
                                        role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                                    });
                                }
                            }
                        } else {
                            // Fallback to token if no localStorage
                            if(decoded.name || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/name']) {
                                setUser({
                                    fullName: decoded.name || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'],
                                    role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                                });
                            }
                        }
                        setIsLoading(false);
                    }
                } catch (error) {
                    logout();
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        
        checkAuth();
    }, [logout]);

    const login = (newToken, userInfo) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        setToken(newToken);
        setUser(userInfo);
        setIsAuthenticated(true);
    };
    
    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

