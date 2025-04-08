/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext  } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaSignOutAlt } from "react-icons/fa";
import "./Navbar.scss";
import img from "../../assets/icons/noavatar.jpg"
import { AuthContext } from "../../context/AuthContext";
const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser , fetchUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    fetchUser(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 

  const handleLogout = async () => {
    await fetch("http://localhost:5000/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    updateUser(null);
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

        {!currentUser ? (
          <div className="login-register-buttons">
            
            {/*<Link to="/login" className="nav-button">events</Link>
            <Link to="/login" className="nav-button">sponsors</Link>
            <Link to="/login" className="nav-button">partenaires</Link>
            */}

            <Link to="/login" className="nav-button">Login</Link>
            <Link to="/register" className="nav-button">Register</Link>
          </div>
        ) : (
          <div className="profile-section">
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
                src={currentUser.photo || img}
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
