/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react"; 
import { useNavigate } from "react-router-dom";  
import Navbar from "../../components/navbar/Navbar.jsx";
import EventList from "../../components/EventList/EventList.jsx";
import "./HomePage.scss";
import { AuthContext } from "../../context/AuthContext.jsx";
const HomePage = () => {
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    fetch('http://localhost:5000/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false); 
      })
      .catch((err) => console.error(err));
  }, []);
  const handleVerifyEmailClick = () => {
    navigate("/verify-email");  // Redirect to the verify-email page
  };
  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="home-page">
      <Navbar />
      {currentUser && !currentUser.isVerified && (
        <div className="verification-message">
          <p>Please verify your email to register for events.</p>
          <button onClick={handleVerifyEmailClick} className="verify-email-button">
            Verify Email
          </button>
        </div>
      )}
      <EventList /> 
    </div>
  );
};

export default HomePage;
