async function getOAuthToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
  const url = `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  const data = await response.json();
  return data.access_token;
}

async function testPush() {
  const token = await getOAuthToken();
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const timestamp = `${y}${m}${d}${h}${min}${s}`;
  
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  
  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: 1,
    PartyA: '254708374149',
    PartyB: shortCode,
    PhoneNumber: '254708374149',
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: 'Test',
    TransactionDesc: 'Test',
  };

  const url = `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log("STK Push response:", response.status, text);
}

testPush();
