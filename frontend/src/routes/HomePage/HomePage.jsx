import React, { useState, useEffect } from "react"; // Import useState and useEffect
import Navbar from "../../components/navbar/Navbar.jsx";
import EventList from "../../components/EventList/EventList.jsx";
import "./HomePage.scss"; // Optional for page-specific styles

const HomePage = () => {
  const [events, setEvents] = useState([]); // Initialize with an empty array
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    fetch('http://localhost:5000/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false); // Stop loading after fetching data
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or any custom loading indicator
  }

  return (
    <div className="home-page">
      <Navbar />
      <EventList /> 
    </div>
  );
};

export default HomePage;
