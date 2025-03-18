import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from "react-router-dom";

import "./styles/global.scss";
import LoginPage from "./routes/LoginPage/LoginPage";
import RegisterPage from "./routes/RegisterPage/RegisterPage";
import HomePage from "./routes/HomePage/HomePage";
import EmailVerificationPage from "./routes/EmailVerificationPage/EmailVerificationPage";
// import EventDetailPage from "./routes/EventDetailPage/EventDetailPage"; // Uncomment if needed

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const animation = navigationType === "PUSH" ? "slide-left" : "slide-right";

  return (
    <div className={`animated-route ${animation}`}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} /> 
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
