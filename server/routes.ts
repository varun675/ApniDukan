import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/pay", (req: Request, res: Response) => {
    const { pa, pn, am } = req.query;

    if (!pa || !am) {
      res.status(400).send("Invalid payment link");
      return;
    }

    const upiId = String(pa);
    const name = pn ? String(pn) : "Shop";
    const amount = String(am);
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pay ${name} - Rs ${amount}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #FF8F00 0%, #FF6F00 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .amount {
      font-size: 36px;
      font-weight: 800;
      color: #FF8F00;
      margin: 16px 0;
    }
    .to-text {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    .upi-id {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 24px;
    }
    .pay-btn {
      display: block;
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #5C2D91 0%, #7B1FA2 100%);
      color: white;
      font-size: 18px;
      font-weight: 700;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      margin-bottom: 12px;
    }
    .pay-btn:active { transform: scale(0.98); }
    .apps {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 20px;
    }
    .app-btn {
      flex: 1;
      padding: 12px 8px;
      border-radius: 12px;
      border: 2px solid #eee;
      background: #fafafa;
      text-decoration: none;
      color: #333;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
    }
    .app-btn:active { background: #f0f0f0; }
    .hint {
      margin-top: 20px;
      font-size: 12px;
      color: #999;
      line-height: 1.5;
    }
    .manual {
      margin-top: 20px;
      padding: 16px;
      background: #f8f8f8;
      border-radius: 12px;
    }
    .manual-title {
      font-size: 13px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }
    .manual-id {
      font-size: 15px;
      font-weight: 700;
      color: #333;
      user-select: all;
      -webkit-user-select: all;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">\uD83D\uDCB3</div>
    <div class="title">Payment Request</div>
    <div class="to-text">Pay to</div>
    <div class="upi-id">${name}</div>
    <div class="amount">\u20B9${amount}</div>

    <a href="${upiLink}" class="pay-btn" id="payBtn">Open UPI App & Pay</a>

    <div class="apps">
      <a href="gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR" class="app-btn">Google Pay</a>
      <a href="phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR" class="app-btn">PhonePe</a>
      <a href="paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR" class="app-btn">Paytm</a>
    </div>

    <div class="manual">
      <div class="manual-title">Or pay manually using UPI ID:</div>
      <div class="manual-id">${upiId}</div>
    </div>

    <div class="hint">Tap the button above to open your UPI payment app. If it doesn't open automatically, use the UPI ID to pay manually.</div>
  </div>

  <script>
    setTimeout(function() {
      window.location.href = "${upiLink}";
    }, 500);
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });

  const httpServer = createServer(app);

  return httpServer;
}
