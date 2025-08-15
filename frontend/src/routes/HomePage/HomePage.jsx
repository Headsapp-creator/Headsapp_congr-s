/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar.jsx";
import EventList from "../../components/EventList/EventList.jsx";
import "./HomePage.scss";
import { AuthContext } from "../../context/AuthContext.jsx";
import PropTypes from "prop-types";
import MyCommunicationsModal from "../../components/MyCommunicationsModal/MyCommunicationsModal.jsx";
import api from "../../lib/api";

const HomePage = ({ showMyComms, setShowMyComms }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();
  useEffect(() => {
    fetch(api.events.list())
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
      <Navbar showMyComms={showMyComms} setShowMyComms={setShowMyComms} />
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

HomePage.propTypes = {
  showMyComms: PropTypes.bool.isRequired,
  setShowMyComms: PropTypes.func.isRequired
};

export default HomePage;
