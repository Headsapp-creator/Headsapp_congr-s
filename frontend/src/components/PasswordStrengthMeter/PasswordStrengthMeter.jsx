/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { Check, X } from "lucide-react";
import "./PasswordStrengthMeter.scss"; // Import the CSS file

const PasswordCriteria = ({ password }) => {
  const criteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="password-criteria">
      {criteria.map((item) => (
        <div key={item.label} className="criteria-item">
          {item.met ? <Check className="icon check" /> : <X className="icon cross" />}
          <span className={item.met ? "met" : "not-met"}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const PasswordStrengthMeter = ({ password }) => {
  const getStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/\d/)) strength++;
    if (pass.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const strength = getStrength(password);

  const getColor = () => {
    if (strength === 0) return "very-weak";
    if (strength === 1) return "weak";
    if (strength === 2) return "fair";
    if (strength === 3) return "good";
    return "strong";
  };

  const getStrengthText = () => {
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return strengthLabels[strength];
  };

  return (
    <div className="password-meter">
      <div className="strength-header">
        <span>Password Strength</span>
        <span className={`strength-text ${getColor()}`}>{getStrengthText()}</span>
      </div>

      <div className="strength-bars">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`strength-bar ${index < strength ? getColor() : "inactive"}`}
          />
        ))}
      </div>

      <PasswordCriteria password={password} />
    </div>
  );
};

export default PasswordStrengthMeter;
