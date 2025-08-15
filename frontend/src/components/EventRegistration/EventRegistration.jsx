
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EventRegistration.scss";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useContext } from "react";

const ATTRIBUTE_ORDER = [
  "name",
  "email",
  "phone",
  "address",
  "country",
  "activity",
  "specialty",
  "price"
];

const VALID_INPUT_TYPES = [
  "text", "email", "number", "checkbox", "radio", "date", "tel"
];

function formatDeadline(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentPriceStep(pricingSteps, specialty) {
  if (!pricingSteps || !specialty || !pricingSteps[specialty]) return null;
  const now = new Date();
  const steps = pricingSteps[specialty]
    .map(step => ({
      ...step,
      deadline: new Date(step.deadline)
    }))
    .sort((a, b) => a.deadline - b.deadline);

  for (let i = 0; i < steps.length; i++) {
    if (now <= steps[i].deadline) {
      return steps[i];
    }
  }
  return steps[steps.length - 1];
}

function shouldShow(attr, formData) {
  if (!attr.condition) return true;
  if (Array.isArray(attr.condition.value)) {
    return attr.condition.value.includes(formData[attr.condition.attribute]);
  }
  return formData[attr.condition.attribute] === attr.condition.value;
}

const EventRegistration = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    newsletter: false,
    comment: "",
    workshops: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [takeoverFile, setTakeoverFile] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext) || {};

  useEffect(() => {
    fetch(`http://localhost:5000/events/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data);
        const initial = {
          newsletter: false,
          comment: "",
          workshops: [],
        };
        const attrs = (data.selectedAttributes || []);
        attrs
          .sort((a, b) => {
            const idxA = ATTRIBUTE_ORDER.indexOf(a.name);
            const idxB = ATTRIBUTE_ORDER.indexOf(b.name);
            if (a.name === "price") return 1;
            if (b.name === "price") return -1;
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          })
          .forEach(attr => {
            if (attr.type === "checkbox-specialty") {
              initial["specialty"] = "";
            } else {
              initial[attr.name] = "";
            }
          });
        if (currentUser) {
          initial.first_name = currentUser.prenom || "";
          initial.last_name = currentUser.nom || "";
          initial.email = currentUser.email || "";
          initial.phone = currentUser.phone || "";
          initial.country = currentUser.country || "";
          initial.address = currentUser.address || "";
        }
        setFormData(initial);
        setLoading(false);
      });
  }, [id, currentUser]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSpecialtyChange = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specialty: spec
    }));
  };

  const handleWorkshopToggle = (workshopId) => {
    setFormData((prev) => {
      const selected = prev.workshops || [];
      if (selected.includes(workshopId)) {
        return { ...prev, workshops: selected.filter(id => id !== workshopId) };
      } else {
        return { ...prev, workshops: [...selected, workshopId] };
      }
    });
  };

  const handleFileChange = (e) => {
    setTakeoverFile(e.target.files[0]);
  };

  const validate = () => {
    const newErrors = {};
    (event.selectedAttributes || []).forEach(attr => {
      if (!shouldShow(attr, formData)) return;
      // If it's a specialty radio group, require only if shown
      if (attr.type === "checkbox-specialty") {
        if (formData.activity !== "sponsor" && !formData.specialty) {
          newErrors.specialty = "Please select a specialty.";
        }
      }
      // Special case for "name" attribute: require first_name and last_name
      else if (attr.name === "name") {
        if (!formData.first_name) {
          newErrors.first_name = "Please enter your first name.";
        }
        if (!formData.last_name) {
          newErrors.last_name = "Please enter your last name.";
        }
      }
      // All other fields
      else if (!formData[attr.name]) {
        newErrors[attr.name] = `Please enter your ${attr.label ? attr.label.toLowerCase() : attr.name}.`;
      }
    });
    // Takeover document validation
    if (formData.takeover === "yes" && !takeoverFile) {
      newErrors.takeoverFile = "Please upload your takeover document.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked", formData);
    if (!validate()) {
      alert("Please fill all required fields.");
      return;
    }
    // Prepare programmeIds from selected workshops
    const programmeIds = (event.programmes || [])
      .filter(w =>
        formData.workshops && formData.workshops.includes(w.id || w.nom)
      )
      .map(w => w.id || w.nom);

    try {
      let response, data;
      if (formData.takeover === "yes" && takeoverFile) {
        // Use FormData for file upload
        const fd = new FormData();
        fd.append("programmeIds", JSON.stringify(programmeIds));
        fd.append("formData", JSON.stringify(formData));
        fd.append("takeoverDocument", takeoverFile);

        response = await fetch(`http://localhost:5000/events/${event.id}/subscribe`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
      } else {
        response = await fetch(`http://localhost:5000/events/${event.id}/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            programmeIds,
            formData,
          }),
          credentials: "include",
        });
      }

      data = await response.json();
      if (response.ok) {
        if (!isSponsor) {
          const first_name = formData.first_name || formData.name || "";
          const last_name = formData.last_name || "";
          const email = formData.email || "";
          const phone = formData.phone || "";

          // Check required fields
          if (!first_name || !email || !phone) {
            alert("Please fill in your name, email, and phone.");
            return;
          } navigate("/payment", {
            state: {
              amount: totalPrice,
              note: `Registration for event ${event.nom}`,
              first_name,
              last_name,
              email,
              phone,
              return_url: "http://localhost:3000/payment-success",
              cancel_url: "http://localhost:3000/payment-cancel",
              webhook_url: "http://localhost:5000/payments/webhook",
            },
          });
        } else {
          alert("Subscription successful!");
        }
      } else {
        alert("Registration failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="centered">
        <div className="spinner"></div>
      </div>
    );
  if (!event)
    return (
      <div className="centered">
        <div className="error-text">Event not found</div>
      </div>
    );

  const sortedAttributes = (event.selectedAttributes || []).slice().sort((a, b) => {
    const idxA = ATTRIBUTE_ORDER.indexOf(a.name);
    const idxB = ATTRIBUTE_ORDER.indexOf(b.name);
    if (a.name === "price") return 1;
    if (b.name === "price") return -1;
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // Calculate total price (event + selected workshops)
  let eventPrice = 0;
  if (formData.specialty && event.pricingSteps && event.pricingSteps[formData.specialty]) {
    const step = getCurrentPriceStep(event.pricingSteps, formData.specialty);
    eventPrice = Number(step?.price || 0);
  }
  const workshopsPrice = (event.programmes || []).reduce(
    (sum, w) =>
      formData.workshops && formData.workshops.includes(w.id || w.nom)
        ? sum + Number(w.price || 0)
        : sum,
    0
  );
  const totalPrice = eventPrice + workshopsPrice;
  const isSponsor = formData.activity === "sponsor";
  return (
    <div className="event-registration-bg">
      <div className="event-registration-card">
        {event.image && (
          <div className="event-image-banner">
            <img src={event.image} alt={event.nom} />
          </div>
        )}
        <div className="event-registration-title">
          <span className="register-for-label">Register for</span>
          <span className="event-name-label">{event.nom}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="event-registration-stack">
            {/* Dynamic event attributes */}
            {sortedAttributes.map((attr, idx) => {
              if (attr.name === "takeover" || attr.name === "laboratoryName") return null;
              if (!shouldShow(attr, formData)) return null;
              if (attr.name === "price" && isSponsor) return null;

              // Show first_name and last_name if "name" attribute is present
              if (attr.name === "name") {
                return (
                  <React.Fragment key={idx}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        className="form-input"
                        type="text"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleChange}
                        autoComplete="given-name"
                        required={shouldShow(attr, formData)}
                      />
                      {errors.first_name && (
                        <div className="error-text">{errors.first_name}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        className="form-input"
                        type="text"
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleChange}
                        autoComplete="family-name"
                        required={shouldShow(attr, formData)}
                      />
                      {errors.last_name && (
                        <div className="error-text">{errors.last_name}</div>
                      )}
                    </div>
                  </React.Fragment>
                );
              }
              // Checkbox specialty (radio buttons for specialties)
              if (attr.type === "checkbox-specialty" && !isSponsor) {
                const specialties = Object.keys(event.pricingSteps || {});
                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{attr.label}</label>
                    <div className="radio-group">
                      {specialties.map((spec, i) => (
                        <label key={i} className="radio-label" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <input
                            type="radio"
                            name="specialty"
                            value={spec}
                            checked={formData.specialty === spec}
                            onChange={() => handleSpecialtyChange(spec)}
                            required={shouldShow(attr, formData) && i === 0}
                          />
                          <span style={{ fontWeight: 600 }}>{spec}</span>
                          <div className="steps-list">
                            {(event.pricingSteps[spec] || []).map((step, sidx) => {
                              const now = new Date();
                              const deadline = new Date(step.deadline);
                              const prevDeadline = sidx === 0 ? null : new Date(event.pricingSteps[spec][sidx - 1].deadline);
                              const isCurrent =
                                (now <= deadline) &&
                                (sidx === 0 || now > prevDeadline);
                              return (
                                <div
                                  key={sidx}
                                  className={`price-step${isCurrent ? " current-step" : ""}`}
                                >
                                  <span>
                                    {step.price} DT
                                    <span className="step-deadline">
                                      {" "} Until {formatDeadline(step.deadline)}
                                    </span>
                                    {isCurrent && (
                                      <span className="current-step-badge">Actual</span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.specialty && (
                      <div className="error-text">{errors.specialty}</div>
                    )}
                  </div>
                );
              }
              // Activity dropdown
              if (attr.name === "activity") {
                const options = event.activityOptions && event.activityOptions.length > 0
                  ? event.activityOptions
                  : ["public", "private", "sponsor"];
                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{attr.label}</label>
                    <select
                      className="form-input"
                      name="activity"
                      value={formData.activity || ""}
                      onChange={handleChange}
                      required={shouldShow(attr, formData)}
                    >
                      <option value="" disabled>Choose...</option>
                      {options.map(opt => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.activity && (
                      <div className="error-text">{errors.activity}</div>
                    )}
                  </div>
                );
              }
              // Profession type (doctor/paramedical)
              if (attr.name === "professionType") {
                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{attr.label}</label>
                    <select
                      className="form-input"
                      name="professionType"
                      value={formData.professionType || ""}
                      onChange={handleChange}
                      required={shouldShow(attr, formData)}
                    >
                      <option value="" disabled>Choose...</option>
                      <option value="doctor">Doctor</option>
                      <option value="paramedical">Paramedical</option>
                    </select>
                  </div>
                );
              }
              // Etablissement
              if (attr.name === "etablissement") {
                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{attr.label}</label>
                    <input
                      className="form-input"
                      type="text"
                      name="etablissement"
                      value={formData.etablissement || ""}
                      onChange={handleChange}
                      required={shouldShow(attr, formData)}
                    />
                  </div>
                );
              }
              // City
              if (attr.name === "city") {
                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{attr.label}</label>
                    <input
                      className="form-input"
                      type="text"
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                      required={shouldShow(attr, formData)}
                    />
                  </div>
                );
              }
              // Society Name
              if (attr.name === "societyName") {
                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{attr.label}</label>
                    <input
                      className="form-input"
                      type="text"
                      name="societyName"
                      value={formData.societyName || ""}
                      onChange={handleChange}
                      required={shouldShow(attr, formData)}
                    />
                  </div>
                );
              }
              // Default: text/email/etc.
              return (
                <div key={idx} className="form-group">
                  <label className="form-label">{attr.label}</label>
                  <input
                    className="form-input"
                    type={VALID_INPUT_TYPES.includes(attr.type) ? attr.type : "text"}
                    name={attr.name}
                    value={formData[attr.name] || ""}
                    onChange={handleChange}
                    autoComplete="off"
                    required={shouldShow(attr, formData)}
                  />
                  {errors[attr.name] && (
                    <div className="error-text">{errors[attr.name]}</div>
                  )}
                </div>
              );
            })}

            {/* Workshops selection (AFTER attributes) */}
            {event.programmes && event.programmes.length > 0 && !isSponsor && (
              <div className="form-group">
                <label className="form-label">Choose Workshops :</label>
                <div className="workshops-list">
                  {event.programmes.map((workshop) => (
                    <label key={workshop.id || workshop.nom} className="workshop-checkbox-label">
                      <input
                        type="checkbox"
                        name="workshops"
                        value={workshop.id || workshop.nom}
                        checked={formData.workshops && formData.workshops.includes(workshop.id || workshop.nom)}
                        onChange={() => handleWorkshopToggle(workshop.id || workshop.nom)}
                      />
                      <span className="workshop-title">{workshop.nom}</span>
                      <span className="workshop-price">
                        {workshop.price != null ? `(${workshop.price} DT)` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Takeover radio group */}
            {sortedAttributes.find(attr => attr.name === "takeover") && shouldShow(sortedAttributes.find(attr => attr.name === "takeover"), formData) && (
              <div className="form-group">
                <label className="form-label">
                  {sortedAttributes.find(attr => attr.name === "takeover").label || "Takeover"}
                </label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="takeover"
                      value="yes"
                      checked={formData.takeover === "yes"}
                      onChange={handleChange}
                      required={shouldShow(sortedAttributes.find(attr => attr.name === "takeover"), formData)}
                    />
                    Yes
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="takeover"
                      value="no"
                      checked={formData.takeover === "no"}
                      onChange={handleChange}
                    />
                    No
                  </label>
                </div>
                {errors.takeover && (
                  <div className="error-text">{errors.takeover}</div>
                )}
              </div>
            )}

            {/* Laboratory Name (if condition is met) */}
            {sortedAttributes.find(attr => attr.name === "laboratoryName") && shouldShow(sortedAttributes.find(attr => attr.name === "laboratoryName"), formData) && (
              <div className="form-group">
                <label className="form-label">
                  {sortedAttributes.find(attr => attr.name === "laboratoryName").label || "Laboratory Name"}
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="laboratoryName"
                  value={formData.laboratoryName || ""}
                  onChange={handleChange}
                  required={shouldShow(sortedAttributes.find(attr => attr.name === "laboratoryName"), formData)}
                />
                {errors.laboratoryName && (
                  <div className="error-text">{errors.laboratoryName}</div>
                )}
              </div>
            )}

            {/* Takeover document upload (if takeover is yes) */}
            {formData.takeover === "yes" && (
              <div className="form-group">
                <label className="form-label">Upload Takeover Document</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  required
                />
                {errors.takeoverFile && (
                  <div className="error-text">{errors.takeoverFile}</div>
                )}
              </div>
            )}

            {/* Total Price */}
            {!isSponsor && (
              <div className="form-group">
                <div className="form-label" style={{ fontWeight: 700, color: "#2563eb" }}>
                  Total Price: {totalPrice} DT
                </div>
              </div>
            )}

            {/* Standard attributes always shown LAST */}
            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-textarea"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Write your comment here..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
                Subscribe to our newsletter
              </label>
            </div>
            <button
              type="submit"
              className="form-submit-btn"
            >
              {isSponsor ? "Subscribe" : "Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistration;