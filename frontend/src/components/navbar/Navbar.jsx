/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { MdNotificationsNone } from "react-icons/md";
import { FiUser, FiAward, FiFileText, FiLogOut } from "react-icons/fi";
import "./Navbar.scss";
import img from "../../assets/icons/noavatar.jpg";
import { AuthContext } from "../../context/AuthContext";
import { io } from "socket.io-client";
import PropTypes from 'prop-types';

const Navbar = ({ showMyComms, setShowMyComms }) => {
  const navigate = useNavigate();
  const { currentUser, updateUser, fetchUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userNotifications, setUserNotifications] = useState([]);
  const [userNotifOpen, setUserNotifOpen] = useState(false);
  const [userUnreadCount, setUserUnreadCount] = useState(0);

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
    "attestations": "Certificates",
    "reviewer-dashboard": "Reviewer Dashboard"
  };
  
  // Special breadcrumb paths that don't follow the standard pattern
  const specialBreadcrumbs = {
    "/reviewer-dashboard": ["Home", "Reviewer Dashboard"],
    "/soumission": ["Home", "Oral Communication Submission"],
    "/profile": ["Home", "Profile"],
    "/badges": ["Home", "Badges"],
    "/attestations": ["Home", "Certificates"]
  };

  const socketRef = useRef(null);

  useEffect(() => {
    console.log("Navbar mounted");
    fetchUser();
    return () => {
      console.log("Navbar unmounted");
    };
  }, [fetchUser]);

  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications();

    if (socketRef.current) {
      console.log("Disconnecting previous socket");
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;
    console.log("Socket connected:", socket.id);

    if (currentUser?.id) {
      socket.emit("joinReviewerRoom", currentUser.id);
      socket.emit("joinUserRoom", currentUser.id);
      console.log("Emitted joinReviewerRoom and joinUserRoom for", currentUser.id);
    }

    socket.on("user-notification", notif => {
      setUserNotifications(prev => [notif, ...prev]);
      setUserUnreadCount(prev => prev + 1);
      console.log("Received user-notification", notif);
    });
    
    socket.on("reviewer-notification", notif => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      console.log("Received reviewer-notification", notif);
    });

    return () => {
      console.log("Disconnecting socket on cleanup");
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (!event.target.closest('.notification-container')) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications when user opens the notification dropdown
  useEffect(() => {
    if (userNotifOpen && currentUser) {
      fetchNotifications();
    }
  }, [userNotifOpen, currentUser]);

  const fetchNotifications = async () => {
    try {
      // Fetch reviewer notifications
      const reviewerRes = await fetch("http://localhost:5000/communications/reviewer/notifications", {
        credentials: "include"
      });
      const reviewerData = await reviewerRes.json();
      setNotifications(reviewerData);
      setUnreadCount(reviewerData.filter(n => !n.isRead).length);
      
      // Fetch user notifications
      const userRes = await fetch("http://localhost:5000/communications/user/notifications", {
        credentials: "include"
      });
      const userData = await userRes.json();
      setUserNotifications(userData);
      setUserUnreadCount(userData.filter(n => !n.isRead).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      setUserNotifications([]);
      setUserUnreadCount(0);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      await fetch(`http://localhost:5000/communications/reviewer/notifications/${notif.id}/read`, {
        method: "POST",
        credentials: "include"
      });
      setNotifications(prev =>
        prev.map(x => x.id === notif.id ? { ...x, isRead: true } : x)
      );
      setUnreadCount(prev => prev - 1);
    }

    if (location.pathname !== "/reviewer-dashboard") {
      navigate("/reviewer-dashboard");
    }

    setNotifOpen(false);
  };

  const allNotifications = [
    ...userNotifications.map(n => ({ ...n, type: "user" })),
    ...notifications.map(n => ({ ...n, type: "reviewer" }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalUnread =
    allNotifications.filter(n => n.isRead === false || n.isRead === undefined).length;

  const handleUnifiedNotifClick = async (notif) => {
    if (notif.type === "reviewer" && !notif.isRead) {
      await fetch(`http://localhost:5000/communications/reviewer/notifications/${notif.id}/read`, {
        method: "POST",
        credentials: "include"
      });
      setNotifications(prev =>
        prev.map(x => x.id === notif.id ? { ...x, isRead: true } : x)
      );
    }
    if (notif.type === "user" && !notif.isRead) {
      await fetch(`http://localhost:5000/communications/user/notifications/${notif.id}/read`, {
        method: "POST",
        credentials: "include"
      });
      setUserNotifications(prev =>
        prev.map(x => x.id === notif.id ? { ...x, isRead: true } : x)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark reviewer notifications as read
      await fetch("http://localhost:5000/communications/reviewer/notifications/mark-all-read", {
        method: "POST",
        credentials: "include"
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      // Mark user notifications as read
      await fetch("http://localhost:5000/communications/user/notifications/mark-all-read", {
        method: "POST",
        credentials: "include"
      });
      setUserNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUserUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

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
            {specialBreadcrumbs[location.pathname] ? (
              specialBreadcrumbs[location.pathname].map((crumb, index, array) => (
                <span key={index} className="breadcrumb-link">
                  {index > 0 && " / "}
                  {index === array.length - 1 ? (
                    <span className="breadcrumb-current">{crumb}</span>
                  ) : (
                    <Link to={index === 0 ? "/" : location.pathname}>{crumb}</Link>
                  )}
                </span>
              ))
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="navbar-links">
          <div className="navbar-actions-group">
            {currentUser && (
              <button
                className="navbar-action-btn"
                onClick={() => setShowMyComms(true)}
              >
                My Abstracts
              </button>
            )}
          </div>

          {!currentUser ? (
            <div className="login-register-buttons">
              <Link to="/login" className="navbar-action-btn">Login</Link>
              <Link to="/register" className="navbar-action-btn primary">Register</Link>
            </div>
          ) : (
            <div className="profile-section">
              <div className="search-logout-wrapper">
                <form className="search-bar-form" onSubmit={e => e.preventDefault()}>
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder="Search..."
                  />
                  <button type="submit" className="search-bar-btn">
                    <FaSearch size={14} />
                  </button>
                </form>

                <div className="notification-container">
                  <button
                    className="notification-bell"
                    onClick={() => setUserNotifOpen(!userNotifOpen)}
                  >
                    <MdNotificationsNone size={20} />
                    {totalUnread > 0 && (
                      <span className="notification-badge">
                        {totalUnread > 9 ? "9+" : totalUnread}
                      </span>
                    )}
                  </button>
                  {userNotifOpen && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        Notifications
                        {totalUnread > 0 && (
                          <button
                            className="mark-all-read"
                            onClick={handleMarkAllAsRead}
                          >
                            Mark all
                          </button>
                        )}
                      </div>
                      {allNotifications.length === 0 ? (
                        <div className="notification-empty">No notifications</div>
                      ) : (
                        allNotifications.map((n, idx) => (
                          <div
                            key={n.id || idx}
                            className={`notification-item ${!n.isRead ? "unread" : ""}`}
                            onClick={() => handleUnifiedNotifClick(n)}
                          >
                            {n.message}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
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
                      <Link to="/profile" className="dropdown-link">
                        <FiUser size={16} /> Profile Settings
                      </Link>
                      <Link to="/badges" className="dropdown-link">
                        <FiAward size={16} /> Badges
                      </Link>
                      <Link to="/attestations" className="dropdown-link">
                        <FiFileText size={16} /> Certificates
                      </Link>
                      <button className="dropdown-link logout-link" onClick={handleLogout}>
                        <FiLogOut size={16} /> Log out
                      </button>
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

Navbar.propTypes = {
  showMyComms: PropTypes.bool.isRequired,
  setShowMyComms: PropTypes.func.isRequired
};

export default Navbar;