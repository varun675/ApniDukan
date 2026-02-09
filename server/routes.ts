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
    const tn = `Payment to ${name}`;

    const upiParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&tn=${encodeURIComponent(tn)}&am=${amount}&cu=INR`;
    const upiLink = `upi://pay?${upiParams}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Pay ${name} - ₹${amount}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(160deg, #FF8F00 0%, #E65100 50%, #BF360C 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 28px;
      padding: 36px 28px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.2);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #FF8F00, #4CAF50, #FF8F00);
    }
    .shop-name {
      font-size: 14px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
      margin-top: 8px;
    }
    .amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    .amount {
      font-size: 42px;
      font-weight: 800;
      color: #1a1a1a;
      margin: 8px 0 24px;
      line-height: 1;
    }
    .amount .rupee {
      font-size: 28px;
      font-weight: 600;
      vertical-align: top;
      margin-right: 2px;
    }
    .divider {
      height: 1px;
      background: #eee;
      margin: 0 -28px 24px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FFF3E0;
      color: #E65100;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .status.redirecting {
      background: #E8F5E9;
      color: #2E7D32;
    }
    .pay-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%);
      color: white;
      font-size: 18px;
      font-weight: 700;
      border: none;
      outline: none;
      border-radius: 16px;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.1s;
      -webkit-tap-highlight-color: transparent;
      -webkit-appearance: none;
    }
    .pay-btn:active { transform: scale(0.97); }
    .pay-btn svg {
      width: 22px;
      height: 22px;
      fill: white;
    }
    .pay-hint {
      font-size: 13px;
      color: #888;
      margin-top: 12px;
      line-height: 1.5;
    }
    .manual {
      margin-top: 20px;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 14px;
      border: 1px solid #f0f0f0;
    }
    .manual-label {
      font-size: 12px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .manual-id {
      font-size: 16px;
      font-weight: 700;
      color: #333;
      user-select: all;
      -webkit-user-select: all;
      word-break: break-all;
    }
    .copy-btn {
      margin-top: 8px;
      padding: 6px 14px;
      background: white;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      cursor: pointer;
    }
    .copy-btn:active { background: #f0f0f0; }
    .footer {
      margin-top: 20px;
      font-size: 11px;
      color: #bbb;
      line-height: 1.5;
    }
    .secure { color: #4CAF50; }
  </style>
</head>
<body>
  <div class="card">
    <div class="shop-name">${name}</div>
    <div class="amount-label">Amount to pay</div>
    <div class="amount"><span class="rupee">₹</span>${amount}</div>
    <div class="divider"></div>

    <div class="status" id="statusBadge">Tap the button below to pay</div>

    <button class="pay-btn" id="payBtn" onclick="openUPI()">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
      Pay &#8377;${amount}
    </button>

    <div class="pay-hint">Tap the button above to choose your UPI app<br>(PhonePe, GPay, Paytm, etc.)</div>

    <div class="manual">
      <div class="manual-label">Or pay using UPI ID</div>
      <div class="manual-id" id="upiIdText">${upiId}</div>
      <button class="copy-btn" id="copyBtn" onclick="copyUPI()">Copy UPI ID</button>
    </div>

    <div class="footer">
      <span class="secure">&#x1F512;</span> Secure UPI payment &middot; Powered by Apni Dukan
    </div>
  </div>

  <script>
    var badge = document.getElementById('statusBadge');

    function openUPI() {
      var link = "upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&tn=${encodeURIComponent(tn)}&am=${amount}&cu=INR";
      window.location.href = link;
    }

    function copyUPI() {
      var id = "${upiId}";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(id).then(function() {
          document.getElementById('copyBtn').textContent = 'Copied!';
          setTimeout(function() {
            document.getElementById('copyBtn').textContent = 'Copy UPI ID';
          }, 2000);
        });
      } else {
        var el = document.getElementById('upiIdText');
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        document.getElementById('copyBtn').textContent = 'Copied!';
      }
    }

    badge.className = 'status';
    badge.textContent = 'Tap the Pay button to proceed';
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });

  const httpServer = createServer(app);

  return httpServer;
}
