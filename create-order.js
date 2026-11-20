module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : (req.body || {});

    const amount = Number(body.amount);
    const ALLOWED_PACKS = { 10: 100, 49: 500, 99: 1250, 399: 5000 };

    if (!ALLOWED_PACKS[amount]) {
      return res.status(400).json({ error: 'Invalid coin pack amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured on Vercel' });
    }

    const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'INR',
        receipt: 'tn_' + Date.now()
      })
    });

    const data = await rzpRes.json();
    if (!rzpRes.ok) {
      return res.status(rzpRes.status).json({ error: (data.error && data.error.description) || 'Razorpay order failed' });
    }

    return res.status(200).json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      key: keyId,
      coins: ALLOWED_PACKS[amount]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
