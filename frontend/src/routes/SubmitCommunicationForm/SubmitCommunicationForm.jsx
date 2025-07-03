// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SubmitCommunicationForm.scss";
import { MdUpload } from "react-icons/md";

const specialities = [
    "Cardiology",
    "Neurology",
    "Oncology",
    "Pediatrics",
];

const SubmitCommunicationForm = () => {
    const [formData, setFormData] = useState({
        speciality: "",
        theme: "",
        title: "",
        mainAuthor: "",
        coAuthors: "",
        email: "",
        phone: "",
        service: "",
        institution: "",
        objectives: "",
        methods: "",
        results: "",
        conclusion: "",
        file: null
    });

    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = e => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            const response = await fetch("http://localhost:5000/communications/submit", {
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
                    <h2>Basic Information</h2>
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
                            <label htmlFor="theme">Theme <span className="required">*</span></label>
                            <input
                                id="theme"
                                name="theme"
                                value={formData.theme}
                                onChange={handleChange}
                                required
                                className="chakra-input"
                            />
                                
                           
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
                            <label htmlFor="coAuthors">Co-authors <span className="required">*</span></label>
                            <input
                                type="text"
                                id="coAuthors"
                                name="coAuthors"
                                value={formData.coAuthors}
                                onChange={handleChange}
                                required
                                className="chakra-input"
                                placeholder="Separate with commas"
                            />
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
                    </div>
                </div>
                <div className="form-section">
                    <h2>Communication Content</h2>
                    <div className="form-group">
                        <label htmlFor="objectives">Objectives <span className="required">*</span></label>
                        <textarea
                            id="objectives"
                            name="objectives"
                            value={formData.objectives}
                            onChange={handleChange}
                            required
                            className="chakra-textarea"
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="methods">Methods <span className="required">*</span></label>
                        <textarea
                            id="methods"
                            name="methods"
                            value={formData.methods}
                            onChange={handleChange}
                            required
                            className="chakra-textarea"
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="results">Results <span className="required">*</span></label>
                        <textarea
                            id="results"
                            name="results"
                            value={formData.results}
                            onChange={handleChange}
                            required
                            className="chakra-textarea"
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="conclusion">Conclusion<span className="required">*</span></label>
                        <textarea
                            id="conclusion"
                            name="conclusion"
                            value={formData.conclusion}
                            onChange={handleChange}
                            required
                            className="chakra-textarea"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="form-section">
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
                </div>
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