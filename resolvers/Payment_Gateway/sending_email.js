//here we are sending invoices for the recurring payments
const stripe = require('stripe')('Your Security key here');

stripe.invoiceItems.create({
  price: 'price_CBb6IXqvTLXp3f',
  customer: 'cus_4fdAW5ftNQow1a',
});
