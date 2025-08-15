/* eslint-disable react/prop-types */
import { createContext, useEffect, useState, useCallback, memo } from "react";
import api from "../lib/api";

const AuthContext = createContext();

const AuthContextProviderComponent = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(api.auth.user(), {
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
      if (error.message !== "Failed to fetch user data" && error.message !== "Failed to fetch") {
        console.error("Error fetching user:", error.message);
      }
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
