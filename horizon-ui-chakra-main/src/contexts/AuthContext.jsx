/* eslint-disable react/prop-types */
import { createContext, useEffect, useState, useCallback, memo } from "react";

const AuthContext = createContext();

const AuthContextProviderComponent = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:5000/auth/user", {
                method: "GET",
                credentials: "include",
            });

            if (response.status === 401) {
                setCurrentUser(null);
                return;
            }

            if (!response.ok) {
                setCurrentUser(null);
                return;
            }

            const data = await response.json();
            setCurrentUser(data.user || null);
        } catch (error) {
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = (userData) => {
        setCurrentUser(userData);
    };

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <AuthContext.Provider value={{ currentUser, updateUser, fetchUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

const AuthContextProvider = memo(AuthContextProviderComponent);

export { AuthContext, AuthContextProvider };
