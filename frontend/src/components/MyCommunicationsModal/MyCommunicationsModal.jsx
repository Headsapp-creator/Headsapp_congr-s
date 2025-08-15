// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "../../context/AuthContext";
import { FiX, FiCheck, FiClock, FiAlertCircle } from "react-icons/fi";
import "./MyCommunicationsModal.scss";
import api from "../../lib/api";

const getAverageScore = (comm) => {
  if (!comm.reviewerAssignments || comm.reviewerAssignments.length === 0) return null;
  const scores = comm.reviewerAssignments
    .map(a => typeof a.score === "number" ? a.score : null)
    .filter(s => s !== null);
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return avg;
};

const getStatus = (comm) => {
  const avgScore = getAverageScore(comm);
  if (typeof avgScore === "number") {
    if (avgScore < 5) return "rejected";
    if (avgScore >= 5 && avgScore < 8) return "pending";
    if (avgScore >= 8) return "approved";
  }
  return comm.status || "pending";
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    approved: {
      icon: <FiCheck size={14} />,
      color: "#1bbf4c",
      bg: "#ebf8f0",
      border: "#b7f5c7"
    },
    pending: {
      icon: <FiClock size={14} />,
      color: "#e6a700",
      bg: "#fffbe6",
      border: "#ffe7a0"
    },
    rejected: {
      icon: <FiAlertCircle size={14} />,
      color: "#e53e3e",
      bg: "#ffeaea",
      border: "#ffc7c7"
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className="comm-status"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border
      }}
    >
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

const MyCommunicationsModal = ({ open, onClose }) => {
  // eslint-disable-next-line no-unused-vars
  const { currentUser } = useContext(AuthContext);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(api.communications.my(), {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setCommunications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className={`modal-overlay ${open ? "active" : ""}`}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className="modal-header">
          <h2>My Abstracts</h2>
          <p className="modal-subtitle">
            {communications.length} {communications.length === 1 ? "submission" : "submissions"}
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your Abstracts...</p>
          </div>
        ) : communications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiAlertCircle size={32} />
            </div>
            <p>No Abstracts found</p>
            <button className="primary-btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div className="communications-list">
            {communications.map(comm => {
              const avgScore = getAverageScore(comm);
              const status = getStatus(comm);

              return (
                <div key={comm.id} className="communication-card">
                  <div className="comm-content">
                    <h3 className="comm-title">{comm.title}</h3>
                    {comm.event && (
                      <p className="comm-event">{comm.event.nom}</p>
                    )}
                  </div>

                  <div className="comm-meta">
                    {typeof avgScore === "number" && (
                      <div className="comm-score">
                        <span>Average Score:</span>
                        <strong>{avgScore.toFixed(2)}</strong>
                      </div>
                    )}
                    <StatusBadge status={status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && communications.length > 0 && (
          <div className="modal-footer">
            <button className="primary-btn" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

MyCommunicationsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default MyCommunicationsModal;