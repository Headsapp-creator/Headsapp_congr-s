/* eslint-disable no-unused-vars */
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./RegisterPage.scss";
import img from "../../assets/hd.png";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter/PasswordStrengthMeter";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState(""); // State for password
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required("required"),
      email: Yup.string().email("Invalid email address").required("required"),
      password: Yup.string()
        .min(8)
        .matches(/[A-Z]/)
        .matches(/[a-z]/)
        .matches(/\d/)
        .matches(/[^A-Za-z0-9]/)
        .required("required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("required"),
      terms: Yup.boolean().oneOf([true], "You must accept the terms and conditions").required(),
    }),

    onSubmit: async (values) => {
      console.log(values); 
      try {
        const response = await fetch("http://localhost:5000/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(values),
        });

        const data = await response.json();
        if (response.ok) {
          navigate("/");
        } else {
          alert(data.message || "Registration failed");
          console.error(data); 
        }
      } catch (error) {
        console.error("Registration failed:", error);
      }
    },
  });

  return (
    <motion.div
      className="register-container"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.div
        className="register-right"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <img src={img} alt="Register" />
      </motion.div>
      <div className="register-left">
        <h2>Create Account</h2>
        <form onSubmit={formik.handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Your Full Name"
            />
            {formik.touched.fullName && formik.errors.fullName ? (
              <span className="error">{formik.errors.fullName}</span>
            ) : null}
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Example.email@gmail.com"
            />
            {formik.touched.email && formik.errors.email ? (
              <span className="error">{formik.errors.email}</span>
            ) : null}
          </div>

          <div className="input-group password-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formik.values.password}
              onChange={(e) => {
                setPassword(e.target.value);
                formik.handleChange(e);
              }}
              onBlur={formik.handleBlur}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              className="show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {/* Show error message only if the password has been touched and is invalid */}
            {formik.touched.password && formik.errors.password && !formik.values.password && (
              <span className="error">required</span>
            )}
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Confirm your password"
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <span className="error">{formik.errors.confirmPassword}</span>
            ) : null}

          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formik.values.terms}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <label htmlFor="terms">
              I agree to the <span>Terms & Conditions</span>
            </label>
          </div>

          <div className="checkbox-group1">
            {formik.touched.terms && formik.errors.terms ? (
              <div className="error">{formik.errors.terms}</div>
            ) : null}
          </div>

          <div className="password-strength-container">
            {/* Password Strength Meter */}
            <PasswordStrengthMeter password={password} />
          </div>

          <button type="submit" className="sign-up-btn">Sign Up</button>

          <p className="switch-page">
            Already have an account?
            <span onClick={() => navigate("/login")}> Sign in</span>
          </p>
        </form>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
