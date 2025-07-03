import axios from "axios";

export const createPaymeePayment = async (req, res) => {
  try {
    const response = await axios.post(
      "https://app.paymee.tn/api/v2/payments/create",
      {
        vendor: 28088,
        amount:req.body.amount,
        note: req.body.note,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        phone: req.body.phone,
        return_url: req.body.return_url,
        cancel_url: req.body.cancel_url,
        webhook_url: req.body.webhook_url,
        order_id: req.body.order_id, 
      },
      {
        headers: {
          Authorization: "Token 0446f089cf2dce819f413d801a8e05a4572d15b0",
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
  console.error(error); // Add this line
  res.status(500).json({ error: "Failed to create payment" });
}
};