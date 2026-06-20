const fetch = require('node-fetch');

async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'punter2@marketplace.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
    
    if (!loginData.accessToken) return;

    // 2. Fetch predictions
    const predRes = await fetch('http://localhost:5000/api/predictions');
    const predData = await predRes.json();
    console.log('Predictions:', predData);
    
    if (!predData.predictions || predData.predictions.length === 0) return;
    
    const pred = predData.predictions[0];
    
    // 3. Checkout
    const checkoutRes = await fetch('http://localhost:5000/api/purchases/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.accessToken}`
      },
      body: JSON.stringify({ predictionId: pred.id, paymentMethod: 'YAPE' })
    });
    const checkoutData = await checkoutRes.json();
    console.log('Checkout status:', checkoutRes.status);
    console.log('Checkout Data:', checkoutData);
  } catch (err) {
    console.error(err);
  }
}

test();
