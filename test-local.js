async function testLocalPush() {
  const payload = {
      phoneNumber: '254708374149',
      amount: 1,
      guestName: 'Test',
      message: 'Test'
  };

  const response = await fetch('http://localhost:3001/api/payments/stk-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log("Local API response:", response.status, text);
}

testLocalPush();
