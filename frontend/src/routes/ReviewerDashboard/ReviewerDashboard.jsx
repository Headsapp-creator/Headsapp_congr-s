import { useEffect, useState } from "react";
import "./ReviewerDashboard.scss";
import { MdDescription, MdStar, MdRemoveRedEye, MdDownload, MdEdit } from "react-icons/md";
import api from "../../lib/api";

const ReviewerDashboard = () => {
    const [assigned, setAssigned] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [selectedAbstract, setSelectedAbstract] = useState(null);
    const [editingCommunicationId, setEditingCommunicationId] = useState(null);
    const [scoreInput, setScoreInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState({
        title: "",
        introduction: "",
        methods: "",
        casePresentation: "",
        results: "",
        conclusion: ""
    });

    useEffect(() => {
        fetchAssigned();
    }, []);

    const fetchAssigned = async () => {
        try {
            const res = await fetch(api.communications.assignedToMe(), {
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
        } catch {
            setAssigned([]);
            setError("Failed to fetch assignments.");
        }
    };

    const handleEdit = async (communicationId) => {
        try {
            const res = await fetch(api.communications.content(communicationId), {
                credentials: "include"
            });
            const data = await res.json();
            
            if (res.ok) {
                setEditContent({
                    title: data.title || "",
                    introduction: data.introduction || "",
                    methods: data.methods || "",
                    casePresentation: data.casePresentation || "",
                    results: data.results || "",
                    conclusion: data.conclusion || ""
                });
                setEditingCommunicationId(communicationId);
                setIsEditing(true);
            } else {
                alert("Failed to fetch communication content");
            }
        } catch (err) {
            console.error("Error fetching communication content:", err);
            alert("Error fetching communication content");
        }
    };

    const handleSaveEdit = async () => {
        try {
            const res = await fetch(api.communications.modify(editingCommunicationId), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(editContent),
            });
            
            if (res.ok) {
                // eslint-disable-next-line no-unused-vars
                const data = await res.json();
                alert("Document modified successfully");
                setIsEditing(false);
                setEditingCommunicationId(null);
                // Refresh the assigned communications
                fetchAssigned();
            } else {
                alert("Failed to modify document");
            }
        } catch (err) {
            console.error("Error modifying document:", err);
            alert("Error modifying document");
        }
    };

    const handleSetScore = async () => {
        if (scoreInput === "" || isNaN(scoreInput) || scoreInput < 0 || scoreInput > 10) {
            alert("Please enter a valid score between 0 and 10");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetch(api.communications.setScore(selectedAbstract.assignmentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ score: Number(scoreInput) }),
            });

            setAssigned(prev => prev.map(item =>
                item.assignmentId === selectedAbstract.assignmentId
                    ? { ...item, score: Number(scoreInput) }
                    : item
            ));

            setSelectedAbstract(null);
            setScoreInput("");
        } catch (err) {
            console.error("Error setting score:", err);
            alert("Failed to submit score");
        } finally {
            setIsSubmitting(false);
        }
    };

    const trackAction = async (assignmentId, action) => {
        try {
            await fetch(api.communications.track(assignmentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action }),
            });
        } catch (err) {
            console.error("Tracking error:", err);
        }
    };

    const handleViewAbstract = async (assignmentId, filePath) => {
        await trackAction(assignmentId, "view");
        window.open(filePath, "_blank");
    };

    const handleDownload = (assignmentId, communicationId) => {
        trackAction(assignmentId, "download");
        window.open(api.communications.download(communicationId), "_blank");
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
                            <MdDescription size={20} className="nav-icon" />
                            All Abstracts
                        </li>
                        <li
                            className={`nav-item ${activeTab === "rated" ? "active" : ""}`}
                            onClick={() => setActiveTab("rated")}
                        >
                            <MdStar size={20} className="nav-icon" />
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
                                >
                                    <div
                                        className="abstract-card-click-target"
                                        onClick={() => {
                                            console.log('Card clicked - setting abstract');
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
                                        </div>
                                        <div className={`abstract-card-score ${item.score == null ? "pending-score" : ""}`}>
                                            {item.score != null ? (
                                                <>
                                                    Score:
                                                    <span className="score-stars">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <span key={i} className={`star ${i < Math.floor(item.score / 2) ? 'filled' : ''}`}>
                                                                ★
                                                            </span>
                                                        ))}
                                                    </span>
                                                    {item.score}/10
                                                </>
                                            ) : (
                                                "Available for Review"
                                            )}
                                        </div>
                                    </div>
                                    <div className="abstract-card-actions">
                                        <button
                                            className="action-btn edit-btn"
                                            title="Edit Document"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleEdit(item.communicationId || item.id);
                                            }}
                                        >
                                            <MdEdit size={18} /> Edit
                                        </button>
                                        <button
                                            className="action-btn view-btn"
                                            title="View Document"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleViewAbstract(item.assignmentId, item.filePath);
                                            }}
                                        >
                                            <MdRemoveRedEye size={18} /> View
                                        </button>
                                        <button
                                            className="action-btn download-btn"
                                            title="Download Document"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDownload(item.assignmentId, item.communicationId || item.id);
                                            }}
                                        >
                                            <MdDownload size={18} /> Download
                                        </button>
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

            {/* Modal with forced visibility */}
            {selectedAbstract && !isEditing && (
                <div className="modal-overlay" onClick={() => setSelectedAbstract(null)}>
                    <div
                        className="abstract-modal"
                        onClick={e => {
                            e.stopPropagation(); // Prevent click from bubbling to overlay
                        }}
                    >
                        <div className="modal-header">
                            <h2>{selectedAbstract.title}</h2>
                            <button
                                className="close-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAbstract(null);
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="abstract-authors">
                                Authors: {selectedAbstract.mainAuthor || selectedAbstract.author}
                            </div>

                            <div className="score-section">
                                <label htmlFor="score-input">Rate this Communication (0-10):</label>
                                <div className="score-display">
                                    Current Score: <span className="score-value">{scoreInput || 0}/10</span>
                                </div>
                                <div className="score-stars-preview">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`star ${i < (scoreInput || 0) ? 'filled' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setScoreInput(String(i + 1));
                                            }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <div className="score-range-info">
                                    Click on a star to rate: 1 star = 1 point, 10 stars = 10 points
                                </div>
                                <input
                                    id="score-input"
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={scoreInput}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setScoreInput(e.target.value);
                                    }}
                                    disabled={isScored}
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {!isScored && (
                                    <button
                                        className="submit-score-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetScore();
                                        }}
                                        disabled={isSubmitting || !scoreInput}
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Rating"}
                                    </button>
                                )}

                                {isScored && (
                                    <div className="score-notice">
                                        Rating submitted successfully!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => {
                    setIsEditing(false);
                    setEditingCommunicationId(null);
                }}>
                    <div
                        className="abstract-modal"
                        onClick={e => {
                            e.stopPropagation(); // Prevent click from bubbling to overlay
                        }}
                    >
                        <div className="modal-header">
                            <h2>Edit Communication</h2>
                            <button
                                className="close-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(false);
                                    setEditingCommunicationId(null);
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="edit-form-section">
                                <h3>Communication Details</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="edit-title">Title</label>
                                    <input
                                        id="edit-title"
                                        type="text"
                                        value={editContent.title}
                                        onChange={(e) => setEditContent({...editContent, title: e.target.value})}
                                        className="chakra-input"
                                    />
                                </div>

                                <div className="form-group" style={{ opacity: editContent.introduction ? 1 : 0.7 }}>
                                    <label htmlFor="edit-introduction">Introduction</label>
                                    <textarea
                                        id="edit-introduction"
                                        value={editContent.introduction}
                                        onChange={(e) => setEditContent({...editContent, introduction: e.target.value})}
                                        className="chakra-textarea"
                                        rows={4}
                                        disabled={!editContent.introduction}
                                    />
                                </div>

                                <div className="form-group" style={{ opacity: editContent.methods ? 1 : 0.7 }}>
                                    <label htmlFor="edit-methods">Methods</label>
                                    <textarea
                                        id="edit-methods"
                                        value={editContent.methods}
                                        onChange={(e) => setEditContent({...editContent, methods: e.target.value})}
                                        className="chakra-textarea"
                                        rows={4}
                                        disabled={!editContent.methods}
                                    />
                                </div>

                                <div className="form-group" style={{ opacity: editContent.casePresentation ? 1 : 0.7 }}>
                                    <label htmlFor="edit-casePresentation">Case Presentation</label>
                                    <textarea
                                        id="edit-casePresentation"
                                        value={editContent.casePresentation}
                                        onChange={(e) => setEditContent({...editContent, casePresentation: e.target.value})}
                                        className="chakra-textarea"
                                        rows={4}
                                        disabled={!editContent.casePresentation}
                                    />
                                </div>

                                <div className="form-group" style={{ opacity: editContent.results ? 1 : 0.7 }}>
                                    <label htmlFor="edit-results">Results</label>
                                    <textarea
                                        id="edit-results"
                                        value={editContent.results}
                                        onChange={(e) => setEditContent({...editContent, results: e.target.value})}
                                        className="chakra-textarea"
                                        rows={4}
                                        disabled={!editContent.results}
                                    />
                                </div>

                                <div className="form-group" style={{ opacity: editContent.conclusion ? 1 : 0.7 }}>
                                    <label htmlFor="edit-conclusion">Conclusion</label>
                                    <textarea
                                        id="edit-conclusion"
                                        value={editContent.conclusion}
                                        onChange={(e) => setEditContent({...editContent, conclusion: e.target.value})}
                                        className="chakra-textarea"
                                        rows={4}
                                        disabled={!editContent.conclusion}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="cancel-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(false);
                                        setEditingCommunicationId(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="submit-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveEdit();
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewerDashboard;