async function testNoco() {
  const url = process.env.NOCODB_MPESA_TABLE_URL;
  const data = {
      GuestName: 'Test Guest',
      PhoneNumber: '254708374149',
      Amount: 1,
      MerchantRequestID: 'cd61-44eb-8b18-2b1f9ae15b4162090',
      CheckoutRequestID: 'ws_CO_11062026151452353708374149',
      ResultCode: null,
      ResultDesc: null,
      MpesaReceiptNumber: null,
      TransactionDate: null,
      Status: 'PENDING',
      Purpose: 'Wedding Gift',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xc-token': process.env.NOCODB_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  });

  const text = await response.text();
  console.log("NocoDB POST response:", response.status, text);
}

testNoco();
