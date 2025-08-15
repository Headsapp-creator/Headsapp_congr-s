/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./EventList.scss";
import { AuthContext } from "../../context/AuthContext";

const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const { currentUser } = useContext(AuthContext);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const currentDate = new Date();
    return eventDate > currentDate ? "upcoming" : "completed";
  };

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }, []);

  const handleRegister = (eventId) => {
    if (!currentUser) {
      alert("You need to login first!");
      navigate("/login");
    } else if (!currentUser.isVerified) {
      alert("Please verify your email before registering for events.");
      navigate("/verify-email");
    } else {
      navigate(`/events/${eventId}/register`);
    }
  };

  return (
    <div className="event-list">
      <div className="events-container">
        {events.map((event) => {
          const eventStatus = getEventStatus(event.dateDebut);

          return (
            <div key={event.id} className="event-card">
              <div className="event-img-container">
                <img 
                  src={event.image} 
                  alt={event.nom} 
                  className="event-img"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/300x200?text=Event+Image";
                  }}
                />
              </div>
              <div className="event-content">
                <h3>{event.nom}</h3>
                <p>{event.description}</p>
                <div className="event-meta">
                  <div className="event-date">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                    </svg>
                    {formatDate(event.dateDebut)}
                  </div>
                  <span className={`event-status ${eventStatus}`}>
                    {eventStatus === "upcoming" ? "Upcoming" : "Completed"}
                  </span>
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={eventStatus === "completed"}
                  >
                    {eventStatus === "completed" ? "Event Ended" : "Register Now"}
                  </button>
                  <button
                    onClick={() => navigate("/soumission", { state: { eventId: event.id, eventName: event.nom } })}
                    className="submit-abstract-btn"
                  >
                    Submit Abstract
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;