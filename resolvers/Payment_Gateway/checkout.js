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
});

app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
	const event = request.body;
  
	// Handle the event
	switch (event.type) {
	  case 'payment_intent.succeeded':
		const paymentIntent = event.data.object;
		// Then define and call a method to handle the successful payment intent.
		// handlePaymentIntentSucceeded(paymentIntent);
		break;
	  case 'payment_method.attached':
		const paymentMethod = event.data.object;
		// Then define and call a method to handle the successful attachment of a PaymentMethod.
		// handlePaymentMethodAttached(paymentMethod);
		break;
	  // ... handle other event types
	  default:
		console.log(`Unhandled event type ${event.type}`);
	}
  
	// Return a response to acknowledge receipt of the event
	response.json({received: true});
  });
module.exports = router;