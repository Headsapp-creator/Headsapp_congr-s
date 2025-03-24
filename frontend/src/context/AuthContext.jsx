/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Function to fetch authenticated user from cookies
  const fetchUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/user", {
        method: "GET",
        credentials: "include", 
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
    }
  };

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Function to update the user manually if needed (e.g., after login/logout)
  const updateUser = (data) => {
    setCurrentUser(data);
  };

  return (
    <AuthContext.Provider value={{ currentUser, updateUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
