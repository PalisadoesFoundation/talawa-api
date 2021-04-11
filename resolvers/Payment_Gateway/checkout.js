const stripe = require('stripe')('PUT YOUR SECURITY KEY HERE');
const express = require("express");
const router = express.Router();
const { resolve } = require('path');
router.post("/payment", 
	[
		check('amount','amount is not in the body').not().isEmpty(),
		check('id','The method of payment is not present').not().isEmpty()
	],
	async (req, res) => {
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
	// Copy the .env.example in the root into a .env file in this folder
	require('dotenv').config({ path: './.env' });
	
	// Ensure environment variables are set.
	checkEnv();
	
	const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
	
	app.use(express.static(process.env.STATIC_DIR));
	app.use(
	  express.json({
		// We need the raw body to verify webhook signatures.
		// Let's compute it only when hitting the Stripe webhook endpoint.
		verify: function (req, res, buf) {
		  if (req.originalUrl.startsWith('/webhook')) {
			req.rawBody = buf.toString();
		  }
		},
	  })
	);
	
	app.get('/', (req, res) => {
	  const path = resolve(process.env.STATIC_DIR + '/index.html');
	  res.sendFile(path);
	});
	
	app.get('/config', async (req, res) => {
	  const price = await stripe.prices.retrieve(process.env.PRICE);
	
	  res.send({
		publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
		unitAmount: price.unit_amount,
		currency: price.currency,
	  });
	});
	
	// Fetch the Checkout Session to display the JSON result on the success page
	app.get('/checkout-session', async (req, res) => {
	  const { sessionId } = req.query;
	  const session = await stripe.checkout.sessions.retrieve(sessionId);
	  res.send(session);
	});
	
	app.post('/create-checkout-session', async (req, res) => {
	  const domainURL = process.env.DOMAIN;
	
	  const { quantity, locale } = req.body;
	
	  // The list of supported payment method types. We fetch this from the
	  // environment variables in this sample. In practice, users often hard code a
	  // list of strings for the payment method types they plan to support.
	  const pmTypes = (process.env.PAYMENT_METHOD_TYPES || 'card').split(',').map((m) => m.trim());
	
	  // Create new Checkout Session for the order
	  // Other optional params include:
	  // [billing_address_collection] - to display billing address details on the page
	  // [customer] - if you have an existing Stripe Customer ID
	  // [customer_email] - lets you prefill the email input in the Checkout page
	  // For full details see https://stripe.com/docs/api/checkout/sessions/create
	  const session = await stripe.checkout.sessions.create({
		payment_method_types: pmTypes,
		mode: 'payment',
		locale: locale,
		line_items: [
		  {
			price: process.env.PRICE,
			quantity: quantity
		  },
		],
		// ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
		success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${domainURL}/canceled.html`,
	  });
	
	  res.send({
		sessionId: session.id,
	  });
	});
	
	// Webhook handler for asynchronous events.
	app.post('/webhook', async (req, res) => {
	  let data;
	  let eventType;
	  // Check if webhook signing is configured.
	  if (process.env.STRIPE_WEBHOOK_SECRET) {
		// Retrieve the event by verifying the signature using the raw body and secret.
		let event;
		let signature = req.headers['stripe-signature'];
	
		try {
		  event = stripe.webhooks.constructEvent(
			req.rawBody,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET
		  );
		} catch (err) {
		  console.log(`⚠️  Webhook signature verification failed.`);
		  return res.sendStatus(400);
		}
		// Extract the object from the event.
		data = event.data;
		eventType = event.type;
	  } else {
		// Webhook signing is recommended, but if the secret is not configured in `config.js`,
		// retrieve the event data directly from the request body.
		data = req.body.data;
		eventType = req.body.type;
	  }
	
	  if (eventType === 'checkout.session.completed') {
		console.log(`🔔  Payment received!`);
	  }
	
	  res.sendStatus(200);
	});
module.exports = router;