// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SubmitCommunicationForm.scss";
import { FiPlus } from "react-icons/fi";
import api from "../../lib/api";

const specialities = [
    "General Surgery",
    "Cancer surgery",
    "Cardiovascular surgery",
    "Orthopedic surgery",
    "Thoracic surgery",
    "Urological surgery",
    "Gastroenterology",
    "Family medicine",
    "Medical oncology",
    "Medical imaging",
    "Radiotherapy",
    "Anatomopathology",
    "Other"
];

const SubmitCommunicationForm = () => {
    const location = useLocation();
    const { eventId, eventName } = location.state || {};

    // Word limits for each section (total 500 words)
    const WORD_LIMITS = {
        introduction: 125,
        methods: 125,
        casePresentation: 125,
        results: 125,
        conclusion: 125
    };

    // Helper function to count words
    const countWords = (text) => {
        return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    };

    const [formData, setFormData] = useState({
        speciality: "",
        typeOfAbstract: "",
        communicationType: "methods", // "methods" or "case-presentation"
        title: "",
        mainAuthor: "",
        coAuthors: [""], // Start with one co-author input
        email: "",
        phone: "",
        service: "",
        institution: "",
        pays: "",
        ville: "",
        introduction: "",
        methods: "",
        casePresentation: "",
        results: "",
        conclusion: "",
        // file: null
    });

    // Refs for auto-focus
    const methodsRef = useRef(null);
    const casePresentationRef = useRef(null);

    // Auto-focus the textarea when communicationType changes
    useEffect(() => {
        if (formData.communicationType === "methods" && methodsRef.current) {
            methodsRef.current.focus();
        } else if (formData.communicationType === "case-presentation" && casePresentationRef.current) {
            casePresentationRef.current.focus();
        }
    }, [formData.communicationType]);

    // State to track word counts for each section
    const [wordCounts, setWordCounts] = useState({
        introduction: 0,
        methods: 0,
        casePresentation: 0,
        results: 0,
        conclusion: 0
    });

    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value } = e.target;

        // Check if this is one of the communication content fields
        if (['introduction', 'methods', 'casePresentation', 'results', 'conclusion'].includes(name)) {
            // Check if we're at the word limit
            const wordCount = countWords(value);
            // For results field, make it optional when communicationType is "case-presentation"
            if (name === 'results' && formData.communicationType === "case-presentation") {
                setFormData(prev => ({ ...prev, [name]: value }));
                setWordCounts(prev => ({ ...prev, [name]: wordCount }));
            } else if (wordCount <= WORD_LIMITS[name]) {
                setFormData(prev => ({ ...prev, [name]: value }));
                setWordCounts(prev => ({ ...prev, [name]: wordCount }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCoAuthorChange = (index, value) => {
        setFormData(prev => {
            const newCoAuthors = [...prev.coAuthors];
            newCoAuthors[index] = value;
            return { ...prev, coAuthors: newCoAuthors };
        });
    };

    const addCoAuthor = () => {
        if (formData.coAuthors.length < 6) {
            setFormData(prev => ({
                ...prev,
                coAuthors: [...prev.coAuthors, ""]
            }));
        }
    };

    // const handleFileChange = e => {
    //     setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    // };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();

            // Append all form fields except the one that's not selected
            Object.entries(formData).forEach(([key, value]) => {
                // Skip the field that's not selected for submission
                if (key === 'methods' && formData.communicationType === 'case-presentation') {
                    // Don't send methods when case-presentation is selected
                    return;
                }
                if (key === 'casePresentation' && formData.communicationType === 'methods') {
                    // Don't send casePresentation when methods is selected
                    return;
                }
                if (key === 'coAuthors') {
                    // Filter out empty co-authors and join with commas
                    const filteredCoAuthors = value.filter(author => author.trim() !== '');
                    formDataToSend.append(key, filteredCoAuthors.join(','));
                } else {
                    formDataToSend.append(key, value);
                }
            });

            // Generate Word file from communication content
            // This will be handled in the backend

            // Add eventId if submitting for a specific event
            if (eventId) {
                formDataToSend.append("eventId", eventId);
            }

            const response = await fetch(api.communications.submit(), {
                method: "POST",
                credentials: "include",
                body: formDataToSend,
            });

            if (response.ok) {
                alert("Communication submitted successfully!");
                navigate("/");
            } else {
                throw new Error("Submission failed");
            }
        } catch (error) {
            console.error("Error submitting communication:", error);
            alert("Error submitting communication. Please try again.");
        }
    };

    return (
        <div className="communication-form-container">
            <form onSubmit={handleSubmit} className="chakra-form">
                <div className="form-section">
                    <h2>{eventName ? `Submit Abstract for ${eventName}` : "Basic Information"}</h2>
                    <div className="form-grid">
                        <div className="form-group form-group-full">
                            <label htmlFor="speciality">Speciality <span className="required">*</span></label>
                            <select
                                type="text"
                                id="speciality"
                                name="speciality"
                                value={formData.speciality}
                                onChange={handleChange}
                                required
                                className="chakra-select"
                            >
                                <option value="">Select a speciality</option>
                                {specialities.map(speciality => (
                                    <option key={speciality} value={speciality}>{speciality}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="typeOfAbstract">Type of Abstract <span className="required">*</span></label>
                            <select
                                id="typeOfAbstract"
                                name="typeOfAbstract"
                                value={formData.typeOfAbstract}
                                onChange={handleChange}
                                required
                                className="chakra-select"
                            >
                                <option value="">Select type of abstract</option>
                                <option value="poster">Poster</option>
                                <option value="communication orale">Oral Communication</option>
                                <option value="video film">Video film</option>
                            </select>
                        </div>


                        <div className="form-group">
                            <label htmlFor="title">Title <span className="required">*</span></label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="chakra-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mainAuthor">Main Author (Full Name) <span className="required">*</span></label>
                            <input
                                type="text"
                                id="mainAuthor"
                                name="mainAuthor"
                                value={formData.mainAuthor}
                                onChange={handleChange}
                                required
                                className="chakra-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="coAuthors">Co-authors (max 6)
                                <button type="button" className="add-coauthor-icon" onClick={addCoAuthor} title="Add co-author">
                                    <FiPlus size={16} />
                                </button>
                            </label>
                            {formData.coAuthors.map((author, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    id={`coAuthor${index}`}
                                    name={`coAuthor${index}`}
                                    value={author}
                                    onChange={(e) => handleCoAuthorChange(index, e.target.value)}
                                    className="chakra-input"
                                    placeholder={`Co-author ${index + 1}`}
                                />
                            ))}
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email <span className="required">*</span></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="chakra-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="chakra-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="service">Department/Service <span className="required">*</span></label>
                            <input
                                type="text"
                                id="service"
                                name="service"
                                value={formData.service}
                                onChange={handleChange}
                                required
                                className="chakra-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="institution">Institution/University</label>
                            <input
                                type="text"
                                id="institution"
                                name="institution"
                                value={formData.institution}
                                onChange={handleChange}
                                className="chakra-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pays">Pays</label>
                            <input
                                type="text"
                                id="pays"
                                name="pays"
                                value={formData.pays}
                                onChange={handleChange}
                                className="chakra-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ville">Ville</label>
                            <input
                                type="text"
                                id="ville"
                                name="ville"
                                value={formData.ville}
                                onChange={handleChange}
                                className="chakra-input"
                            />
                        </div>
                    </div>
                </div>
                <div className="form-section">
                    <h2>Communication Content</h2>
                    <div className="form-group">
                        <label htmlFor="introduction">Introduction <span className="required">*</span></label>
                        <div className="textarea-container">
                            <textarea
                                id="introduction"
                                name="introduction"
                                value={formData.introduction}
                                onChange={handleChange}
                                required
                                className="chakra-textarea"
                                rows={3}
                            />
                            <div className="char-count">
                                {wordCounts.introduction}/{WORD_LIMITS.introduction}
                            </div>
                        </div>
                    </div>

                    {/* Communication Type Selection */}
                    <div className="communication-type-selection">
                        <div className="input-container">
                            <div className={`input-wrapper ${formData.communicationType === "methods" ? "selected" : ""}`}>
                                <div className="radio-label-container">
                                    <input
                                        type="radio"
                                        id="methods-radio"
                                        name="communicationType"
                                        value="methods"
                                        checked={formData.communicationType === "methods"}
                                        onChange={handleChange}
                                        className="radio-input"
                                    />
                                    <label htmlFor="methods-radio" className="radio-label">Methods</label>
                                </div>
                                <div className="textarea-container">
                                    <textarea
                                        id="methods"
                                        name="methods"
                                        value={formData.methods}
                                        onChange={handleChange}
                                        required={formData.communicationType === "methods"}
                                        className="chakra-textarea"
                                        placeholder="Enter methods details..."
                                        rows={formData.communicationType === "methods" ? 8 : 4}
                                        ref={methodsRef}
                                    />
                                    <div className="char-count">
                                        {wordCounts.methods}/{WORD_LIMITS.methods}
                                    </div>
                                </div>
                            </div>

                            <div className={`input-wrapper ${formData.communicationType === "case-presentation" ? "selected" : ""}`}>
                                <div className="radio-label-container">
                                    <input
                                        type="radio"
                                        id="case-presentation-radio"
                                        name="communicationType"
                                        value="case-presentation"
                                        checked={formData.communicationType === "case-presentation"}
                                        onChange={handleChange}
                                        className="radio-input"
                                    />
                                    <label htmlFor="case-presentation-radio" className="radio-label">Case Presentation</label>
                                </div>
                                <div className="textarea-container">
                                    <textarea
                                        id="casePresentation"
                                        name="casePresentation"
                                        value={formData.casePresentation}
                                        onChange={handleChange}
                                        required={formData.communicationType === "case-presentation"}
                                        className="chakra-textarea"
                                        placeholder="Enter case presentation details..."
                                        rows={formData.communicationType === "case-presentation" ? 8 : 4}
                                        ref={casePresentationRef}
                                    />
                                    <div className="char-count">
                                        {wordCounts.casePresentation}/{WORD_LIMITS.casePresentation}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Input - Always visible but optional for Case Presentation */}
                    <div className="form-group">
                        <label htmlFor="results">Results {formData.communicationType === "case-presentation" ? "" : <span className="required">*</span>}</label>
                        <div className="textarea-container">
                            <textarea
                                id="results"
                                name="results"
                                value={formData.results}
                                onChange={handleChange}
                                required={formData.communicationType !== "case-presentation"}
                                className="chakra-textarea"
                                rows={3}
                            />
                            <div className="char-count">
                                {wordCounts.results}/{WORD_LIMITS.results}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="conclusion">Conclusion<span className="required">*</span></label>
                        <div className="textarea-container">
                            <textarea
                                id="conclusion"
                                name="conclusion"
                                value={formData.conclusion}
                                onChange={handleChange}
                                required
                                className="chakra-textarea"
                                rows={3}
                            />
                            <div className="char-count">
                                {wordCounts.conclusion}/{WORD_LIMITS.conclusion}
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className="form-section">
                    <h2>Upload Document</h2>
                    <div className="form-group">
                        <label htmlFor="file" className="chakra-upload-label">
                            <div className="chakra-upload-dropzone">
                                <span className="chakra-upload-icon">
                                    <MdUpload size={64} color="#4f8cff" />
                                </span>
                                <div className="chakra-upload-text">
                                    <span className="chakra-upload-title">Upload Files</span>
                                    <span className="chakra-upload-hint">All file types are accepted</span>
                                    <span className="chakra-upload-filename">
                                        {formData.file ? formData.file.name : "Click or drag file to upload"}
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    id="file"
                                    name="file"
                                    onChange={handleFileChange}
                                    className="chakra-upload-input"
                                    accept="*"
                                    required
                                />
                            </div>
                        </label>
                    </div>
                </div> */}
                <div className="form-footer">

                    <button type="submit" className="submit-button">
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmitCommunicationForm;