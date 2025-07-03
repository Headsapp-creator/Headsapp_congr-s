import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx'; 

const ProtectedRoute = ({ children }) => {
    const { currentUser, fetchUser, loading } = useContext(AuthContext);

    useEffect(() => {
        if (!currentUser) {
            fetchUser();
        }
    }, [currentUser, fetchUser]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!currentUser || currentUser.role !== "ADMIN") {
        window.location.href = process.env.REACT_APP_LOGIN_URL; 
        return null;
    }

    return children;
};

export default ProtectedRoute;