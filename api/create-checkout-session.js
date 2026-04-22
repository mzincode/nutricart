const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function getTrialEnd() {
  if (process.env.LAUNCH_DATE) {
    const ts = Math.floor(new Date(process.env.LAUNCH_DATE).getTime() / 1000);
    if (!isNaN(ts) && ts > Date.now() / 1000) return ts;
  }
  // Default: 1 year from now if no launch date set
  return Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_end: getTrialEnd(),
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      },
      payment_method_collection: 'always',
      return_url: 'https://nutricart-two.vercel.app/?subscribed=true',
    });

    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
