
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import "./EmailVerificationPage.scss"
import api from "../../lib/api";

const EmailVerificationPage = () => {
	const [code, setCode] = useState(["", "", "", "", "", ""]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const inputRefs = useRef([]);
	const navigate = useNavigate();

	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");

		const newCode = [...code];
		for (let i = 0; i < 6; i++) {
			newCode[i] = pastedData[i] || "";
		}

		setCode(newCode);

		// Move focus to the last filled input or the next empty one
		const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
		const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
		inputRefs.current[focusIndex]?.focus();
	};

	const handleChange = (index, value) => {
		if (!/^\d*$/.test(value)) return; // Allow only numeric input

		const newCode = [...code];
		newCode[index] = value.slice(-1); // Ensure only one digit per input

		setCode(newCode);

		// Move focus to the next input field if a digit is entered
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};



	const handleKeyDown = (index, e) => {
		if (e.key === "Backspace" && !code[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const verificationCode = parseInt(code.join(""), 10);

		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch(api.auth.verifyEmail(), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: verificationCode }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to verify email");
			}

			toast.success("Email verified successfully");
			navigate("/");
		} catch (err) {
			setError(err.message);
			toast.error(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	// Auto submit when all fields are filled
	useEffect(() => {
		if (code.every((digit) => digit !== "")) {
			handleSubmit(new Event("submit"));
		}
	}, [code]);

	return (
		<div className="email-verification-container">
			<motion.div
				initial={{ opacity: 0, y: -50 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="verification-box"
			>
				<h2 className="title">Verify Your Email</h2>
				<p className="subtitle">Enter the 6-digit code sent to your email.</p>

				<form onSubmit={handleSubmit} className="verification-form">
					<div className="input-group">
						{code.map((digit, index) => (
							<input
								key={index}
								ref={(el) => (inputRefs.current[index] = el)}
								type="text"
								maxLength="1"
								value={digit}
								onChange={(e) => handleChange(index, e.target.value)}
								onKeyDown={(e) => handleKeyDown(index, e)}
								onPaste={handlePaste}
								className="verification-input"
							/>
						))}
					</div>
					{error && <p className="error-text">{error}</p>}
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						type="submit"
						disabled={isLoading || code.some((digit) => !digit)}
						className="verify-button"
					>
						{isLoading ? "Verifying..." : "Verify Email"}
					</motion.button>
				</form>
			</motion.div>
		</div>
	);


};

export default EmailVerificationPage;
