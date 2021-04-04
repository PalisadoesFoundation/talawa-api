const stripe = require('stripe')('PUT YOUR SECURITY KEY HERE');
const express = require("express");
const router = express.Router();
router.post("/payment", async (req, res) => {
	let {amount, id} = req.body //here amount is the amount for donation, and id is the way the user is going to pay like card UPI and other methods
	try {
		const payment = await stripe.paymentIntents.create({
			amount,
			currency: "USD",//Put your currency here,
			description: "description",//put your description here,
			payment_method: id,
			confirm: true
		});
		console.log("Payment", payment)
		res.json({
			message: "Payment successful",
			success: true
		})
	} catch (error) {
		console.log("Error", error)
		res.json({
			message: "Payment failed",
			success: false
		})
	}
})
module.exports = router;