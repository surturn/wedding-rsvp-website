async function testOAuth() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
  console.log("Credentials:", credentials);
  const url = `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  const text = await response.text();
  console.log("OAuth response:", response.status, text);
}

async function testNocoDB() {
  const url = process.env.NOCODB_MPESA_TABLE_URL;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'xc-token': process.env.NOCODB_API_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  const text = await response.text();
  console.log("NocoDB response:", response.status, text.substring(0, 200));
}

async function run() {
  await testOAuth();
  await testNocoDB();
}

run();
