/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./EventList.scss";
import { AuthContext } from "../../context/AuthContext";

const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const { currentUser } = useContext(AuthContext);

  // Helper function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  // Helper function to determine event status
  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const currentDate = new Date();
    return eventDate > currentDate ? "Upcoming" : "Completed";
  };

  // Fetch events data from the API
  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }, []);

  // Handle event registration
  const handleRegister = (eventId) => {
    if (!currentUser) {
      alert("You need to login first!");
      navigate("/login");
    } else if (!currentUser.isVerified) {
      alert("Please verify your email before registering for events.");
      navigate("/verify-email");
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  return (
    <div className="event-list">
      <h2>Event Overview</h2>
      <div className="events-container">
        {events.map((event) => {
          const eventStatus = getEventStatus(event.dateDebut);

          return (
            <div key={event.id} className="event-card">
              <div className="event-img-container">
                <img src={event.image} alt={event.nom} className="event-img" />
              </div>
              <h3>{event.nom}</h3>
              <p>{event.description}</p>
              <span className="event-date">
                Date: {formatDate(event.dateDebut)}
              </span>
              <span className={`event-status ${eventStatus.toLowerCase()}`}>
                {eventStatus}
              </span>
              <button
                onClick={() => handleRegister(event.id)}
                disabled={eventStatus === "Completed"}
              >
                {eventStatus === "Completed" ? "Event Completed" : "Register Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;
