const PACKS = { 100: 10, 500: 49, 1250: 99, 5000: 399 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const coins = Number(body.coins);
    const inr = PACKS[coins];
    if (!inr) return res.status(400).json({ error: 'Invalid coin pack' });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay keys not configured on Vercel' });

    const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: inr * 100,
        currency: 'INR',
        receipt: 'tn_' + Date.now(),
        notes: { coins: String(coins) }
      })
    });
    const order = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: order?.error?.description || 'Razorpay order failed' });

    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId, coins });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
