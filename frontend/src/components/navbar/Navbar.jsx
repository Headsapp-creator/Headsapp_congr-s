/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaSignOutAlt } from "react-icons/fa";
import "./Navbar.scss";
import img from "../../assets/icons/noavatar.jpg"
import { AuthContext } from "../../context/AuthContext";
const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser, fetchUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const hideSubmitBtn = location.pathname === "/soumission";

  const pathnames = location.pathname.split("/").filter(x => x);
  const breadcrumbMap = {
    "": "Home",
    "login": "Login",
    "register": "Register",
    "verify-email": "Email Verification",
    "events": "Events",
    "payment": "Payment",
    "soumission": "Oral Communication Submission",
    "profile": "Profile",
    "badges": "Badges",
    "attestations": "Certificates"
  };
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/">
            <img src="logo.png" alt="App Logo" className="logo" />
          </Link>
          <div className="navbar-breadcrumb">
            <span className="breadcrumb-link">
              <Link to="/">Home</Link>
            </span>
            {pathnames.map((value, idx) => {
              const to = `/${pathnames.slice(0, idx + 1).join("/")}`;
              return (
                <span key={to} className="breadcrumb-link">
                  {" / "}
                  {idx === pathnames.length - 1 ? (
                    <span className="breadcrumb-current">{breadcrumbMap[value] || value}</span>
                  ) : (
                    <Link to={to}>{breadcrumbMap[value] || value}</Link>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <div className="navbar-links">
          {/* Hide Submit Abstract button on /soumission */}
          {!hideSubmitBtn && (
            <Link to="/soumission" className="soumission-btn">
              Submit Abstract
            </Link>
          )}
          {!currentUser ? (
            <div className="login-register-buttons">
              <Link to="/login" className="nav-button">Login</Link>
              <Link to="/register" className="nav-button">Register</Link>
            </div>
          ) : (
            <div className="profile-section">
              <div className="search-logout-wrapper">
                {/*<button className="logout-button" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button> */}
                {/* Search Bar */}
                <form className="search-bar-form" onSubmit={e => e.preventDefault()}>
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder="Search..."
                  />
                  <button type="submit" className="search-bar-btn">
                    <FaSearch />
                  </button>
                </form>
              </div>
              <div className="profile-photo-wrapper" ref={dropdownRef}>
                <img
                  src={currentUser.photo || img}
                  alt="Profile"
                  className="profile-pic"
                  onClick={() => setMenuOpen(!menuOpen)}
                />
                {menuOpen && (
                  <div className={`dropdown-menu-chakra${menuOpen ? " open" : ""}`}>
                    <div className="dropdown-header">
                      <span role="img" aria-label="wave">👋</span> Hey, {currentUser?.nom || "User"}
                    </div>
                    <div className="dropdown-links">
                      <Link to="/profile" className="dropdown-link">Profile Settings</Link>
                      <Link to="/badges" className="dropdown-link">Badges</Link>
                      <Link to="/attestations" className="dropdown-link">Certificates</Link>
                      <button className="dropdown-link logout-link" onClick={handleLogout}>Log out</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
