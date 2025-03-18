import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import "./Navbar.scss";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const userData = JSON.parse(atob(token.split(".")[1]));
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src="logo.png" alt="App Logo" className="logo" />
        </Link>
        <span className="app-name">HeadsAppEvent</span>
      </div>

      <div className="nav-right">
        {!user ? (
          <div className="login-register-buttons">
                        <Link to="/login" className="nav-button">events</Link>
                        <Link to="/login" className="nav-button">sponsors</Link>
                        <Link to="/login" className="nav-button">partenaires</Link>

            <Link to="/login" className="nav-button">Login</Link>
            <Link to="/register" className="nav-button">Register</Link>
          </div>
        ) : (
          <div className="profile-section">
            <span>my events </span>
            <span> // notif icon </span>
            
            {/* Search and Logout Section */}
            <div className="search-logout-wrapper">
              {/* Logout Button */}
              <button className="logout-button" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Logout</span>
              </button>

              {/* Search Icon */}
              <FaSearch className="search-icon" />
            </div>

            {/* Profile Photo with Menu */}
            <div className="profile-photo-wrapper">
              <img
                src={user.photo || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=200"}
                alt="Profile"
                className="profile-pic"
                onClick={() => setMenuOpen(!menuOpen)}
              />
              {menuOpen && (
                <div className="dropdown-menu">
                  <Link to="/profile">Profile</Link>
                  <Link to="/badges">Badges</Link>
                  <Link to="/attestations">Attestations</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
