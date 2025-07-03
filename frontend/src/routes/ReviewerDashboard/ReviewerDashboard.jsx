/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";
import "./ReviewerDashboard.scss";
import { MdDescription, MdStar, MdRemoveRedEye } from "react-icons/md";

const ReviewerDashboard = () => {
    const [assigned, setAssigned] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [selectedAbstract, setSelectedAbstract] = useState(null);
    const [scoreInput, setScoreInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAssigned();
    }, []);

    const fetchAssigned = async () => {
        try {
            const res = await fetch("http://localhost:5000/communications/assigned-to-me", {
                credentials: "include"
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setAssigned(data);
                setError(null);
            } else {
                setAssigned([]);
                setError(data?.error || "Failed to fetch assignments.");
            }
        } catch (err) {
            setAssigned([]);
            setError("Failed to fetch assignments.");
        }
    };

    const handleSetScore = async () => {
        if (scoreInput === "" || isNaN(scoreInput) || scoreInput < 0 || scoreInput > 10) {
            alert("Please enter a valid score between 0 and 10");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetch(`http://localhost:5000/communications/${selectedAbstract.assignmentId}/set-score`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ score: Number(scoreInput) }),
            });

            // Update local state
            setAssigned(prev => prev.map(item =>
                item.assignmentId === selectedAbstract.assignmentId
                    ? { ...item, score: Number(scoreInput) }
                    : item
            ));

            // Close modal and reset
            setSelectedAbstract(null);
            setScoreInput("");
        } catch (err) {
            console.error("Error setting score:", err);
            alert("Failed to submit score");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAbstracts = assigned.filter(item => {
        if (activeTab === "all") return true;
        if (activeTab === "rated") return item.score != null;
        return true;
    });

    const isScored = selectedAbstract && selectedAbstract.score != null;

    return (
        <div className="reviewer-dashboard">


            <div className="dashboard-container">
                <nav className="dashboard-nav">
                    <ul className="nav-list">
                        <li
                            className={`nav-item ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            <span className="nav-icon">
                                <MdDescription size={20} color={activeTab === "all" ? "#2b6cb0" : "#718096"} />
                            </span>
                            All Abstracts
                        </li>
                        <li
                            className={`nav-item ${activeTab === "rated" ? "active" : ""}`}
                            onClick={() => setActiveTab("rated")}
                        >
                            <span className="nav-icon">
                                <MdStar size={20} color={activeTab === "rated" ? "#2b6cb0" : "#718096"} />
                            </span>
                            Rated Abstracts
                        </li>
                    </ul>
                </nav>

                <div className="dashboard-content">
                    {error && <div className="error-message">{error}</div>}

                    <div className="abstracts-list">
                        {filteredAbstracts.length > 0 ? (
                            filteredAbstracts.map(item => (
                                <div
                                    key={item.assignmentId}
                                    className={`abstract-card ${item.score != null ? "rated" : "pending"}`}
                                    onClick={() => {
                                        setSelectedAbstract(item);
                                        setScoreInput(item.score != null ? item.score.toString() : "");
                                    }}
                                >
                                    <div className="abstract-card-content">
                                        <h3 className="abstract-card-title">
                                            {item.title}
                                            {item.score != null ? (
                                                <span className="rated-badge">Rated</span>
                                            ) : (
                                                <span className="pending-badge">Pending Review</span>
                                            )}
                                        </h3>
                                        <div className="abstract-card-authors">
                                            {item.mainAuthor || item.author}
                                        </div>
                                        <div className={`abstract-card-score-row`}>
                                            <div className={`abstract-card-score ${item.score == null ? "pending-score" : ""}`}>
                                                {item.score != null ? (
                                                    <>
                                                        Score:
                                                        <span className="score-stars">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <span key={i} className={`star ${i < Math.floor(item.score / 2) ? 'filled' : ''}`}>
                                                                    ▲
                                                                </span>
                                                            ))}
                                                        </span>
                                                        {item.score}/10
                                                    </>
                                                ) : (
                                                    "Available for Review"
                                                )}
                                            </div>
                                            <button
                                                className="read-more-button"
                                                onClick={() => {
                                                    setSelectedAbstract(item);
                                                    setScoreInput(item.score != null ? item.score.toString() : "");
                                                }}
                                            >
                                                <MdRemoveRedEye className="eye-icon" />
                                                Read More
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))

                        ) : (
                            <div className="no-abstracts">
                                No {activeTab === "rated" ? "rated" : "available"} abstracts found.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Abstract Detail Modal */}
            {selectedAbstract && (
                <div className="modal-overlay">
                    <div className="abstract-modal">
                        <div className="modal-header">
                            <h2>{selectedAbstract.title}</h2>
                            <button
                                className="close-button"
                                onClick={() => setSelectedAbstract(null)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="abstract-authors">
                                Authors: {selectedAbstract.mainAuthor || selectedAbstract.author}
                            </div>

                            <div className="abstract-actions">
                                <a
                                    href={selectedAbstract.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-abstract-button"
                                >
                                    View Abstract Document
                                </a>
                            </div>

                            <div className="score-section">
                                <label htmlFor="score-input">Score (0-10):</label>
                                <div className="score-stars-preview">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`star ${i < Math.floor(scoreInput / 2) ? 'filled' : ''}`}
                                            onClick={() => setScoreInput(String((i + 1) * 2))}
                                        >
                                            ▲
                                        </span>
                                    ))}
                                </div>
                                <input
                                    id="score-input"
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={scoreInput}
                                    onChange={(e) => setScoreInput(e.target.value)}
                                    disabled={isScored}
                                />

                                {!isScored && (
                                    <button
                                        className="submit-score-button"
                                        onClick={handleSetScore}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Score"}
                                    </button>
                                )}

                                {isScored && (
                                    <div className="score-notice">
                                        Score already submitted
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewerDashboard;