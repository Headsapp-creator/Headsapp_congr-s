import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { useState } from "react";
import PropTypes from "prop-types";
import "./styles/global.scss";
import LoginPage from "./routes/LoginPage/LoginPage.jsx";
import RegisterPage from "./routes/RegisterPage/RegisterPage.jsx";
import HomePage from "./routes/HomePage/HomePage.jsx";
import EmailVerificationPage from "./routes/EmailVerificationPage/EmailVerificationPage.jsx";
import EventRegistration from "./components/EventRegistration/EventRegistration.jsx";
import PaymentPage from "./components/Payment/PaymentPage.jsx";
import SubmitCommunicationForm from "./routes/SubmitCommunicationForm/SubmitCommunicationForm.jsx";
import Navbar from "./components/navbar/Navbar.jsx";
import ReviewerDashboard from "./routes/ReviewerDashboard/ReviewerDashboard.jsx";
import MyCommunicationsModal from "./components/MyCommunicationsModal/MyCommunicationsModal.jsx";

const AnimatedRoutes = ({ showMyComms, setShowMyComms }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const animation = navigationType === "PUSH" ? "slide-left" : "slide-right";

  return (
    <div className={`animated-route ${animation}`}>
      <Routes location={location}>
        <Route path="/" element={<HomePage showMyComms={showMyComms} setShowMyComms={setShowMyComms} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/events/:id/register" element={<EventRegistration />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/soumission" element={<SubmitCommunicationForm />} />
        <Route path="/reviewer-dashboard" element={<ReviewerDashboard />} />
 
      </Routes>
    </div>
  );
};

AnimatedRoutes.propTypes = {
  showMyComms: PropTypes.bool.isRequired,
  setShowMyComms: PropTypes.func.isRequired
};

const App = () => {
  const [showMyComms, setShowMyComms] = useState(false);

  return (
    <Router>
      <Navbar showMyComms={showMyComms} setShowMyComms={setShowMyComms} />
      <MyCommunicationsModal
        open={showMyComms}
        onClose={() => setShowMyComms(false)}
      />
      <AnimatedRoutes showMyComms={showMyComms} setShowMyComms={setShowMyComms} />
    </Router>
  );
};

export default App;
