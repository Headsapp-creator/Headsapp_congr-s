// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    amount,
    note,
    first_name,
    last_name,
    email,
    phone,
    return_url,
    cancel_url,
    webhook_url,
    order_id,
  } = location.state || {};

  useEffect(() => {
    // Check required fields
    if (
      !amount ||
      !note ||
      !first_name ||
      !last_name ||
      !email ||
      !phone ||
      !return_url ||
      !cancel_url ||
      !webhook_url
    ) {
      alert("Missing required payment information.");
      navigate(-1);
      return;
    }

    fetch("http://localhost:5000/payments/paymee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        note,
        first_name,
        last_name,
        email,
        phone,
        return_url,
        cancel_url,
        webhook_url,
        order_id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.url) {
          window.location.href = data.data.url; 
        } else {
          alert("Payment creation failed.");
        }
      });
  }, [
    amount,
    note,
    first_name,
    last_name,
    email,
    phone,
    return_url,
    cancel_url,
    webhook_url,
    order_id,
    navigate,
  ]);

  return <div>Redirecting to payment...</div>;
};

export default PaymentPage;