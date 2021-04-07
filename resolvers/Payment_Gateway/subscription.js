const express = require('express');
const app = express();
const stripe = require('stripe')('YOUR_SECURITY_KEY')

app.post('/create-checkout-session', async (req, res) => {
  const { priceId } = req.body;

  // See https://stripe.com/docs/api/checkout/sessions/create
  // for additional parameters to pass.
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: 'YOUR SUCCESS URL WITH {CHECKOUT_SESSION_ID}',
      cancel_url: 'YOUR CANCLE PAGE URL',
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
});
//All of the required things will be put inside the .env file once it is made for the app integration it is just an example to show how it works
// Fetch the Checkout Session to display the JSON result on the success page
app.get("/checkout-session", async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  });
  
  app.post("/create-checkout-session", async (req, res) => {
    const domainURL = process.env.DOMAIN;
    const { priceId } = req.body;
  
    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/canceled.html`,
      });
  
      res.send({
        sessionId: session.id,
      });
    } catch (e) {
      res.status(400);
      return res.send({
        error: {
          message: e.message,
        }
      });
    }
  });
  
  app.get("/setup", (req, res) => {
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      basicPrice: process.env.BASIC_PRICE_ID,
      proPrice: process.env.PRO_PRICE_ID,
    });
  });
  
  app.post('/customer-portal', async (req, res) => {
    // For demonstration purposes, we're using the Checkout session to retrieve the customer ID. 
    // Typically this is stored alongside the authenticated user in your database.
    const { sessionId } = req.body;
    const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);
  
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = process.env.DOMAIN;
  
    const portalsession = await stripe.billingPortal.sessions.create({
      customer: checkoutsession.customer,
      return_url: returnUrl,
    });
  
    res.send({
      url: portalsession.url,
    });
  });
  
  // Webhook handler for asynchronous events.
  app.post("/webhook", async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers["stripe-signature"];
  
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
  
    if (eventType === "checkout.session.completed") {
      console.log(`🔔  Payment received!`);
    }
  
    res.sendStatus(200);
  });