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

    const upiParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    const upiLink = `upi://pay?${upiParams}`;
    const intentLink = `intent://pay?${upiParams}#Intent;scheme=upi;end`;

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
      border-radius: 16px;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.1s;
      -webkit-tap-highlight-color: transparent;
    }
    .pay-btn:active { transform: scale(0.97); }
    .pay-btn svg {
      width: 22px;
      height: 22px;
      fill: white;
    }
    .apps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .app-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 4px;
      border-radius: 14px;
      border: 1.5px solid #f0f0f0;
      background: #fafafa;
      text-decoration: none;
      color: #333;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .app-btn:active { background: #f0f0f0; border-color: #ddd; }
    .app-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: white;
    }
    .app-icon.phonepe { background: #5F259F; }
    .app-icon.gpay { background: #4285F4; }
    .app-icon.paytm { background: #00BAF2; }
    .app-icon.whatsapp { background: #25D366; }
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

    <div class="status" id="statusBadge">Opening your UPI app...</div>

    <a href="${upiLink}" class="pay-btn" id="payBtn">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
      Pay ₹${amount}
    </a>

    <div class="apps-grid">
      <a href="phonepe://pay?${upiParams}" class="app-btn">
        <div class="app-icon phonepe">P</div>
        PhonePe
      </a>
      <a href="gpay://upi/pay?${upiParams}" class="app-btn">
        <div class="app-icon gpay">G</div>
        GPay
      </a>
      <a href="paytmmp://pay?${upiParams}" class="app-btn">
        <div class="app-icon paytm">P</div>
        Paytm
      </a>
      <a href="whatsapp://pay?${upiParams}" class="app-btn">
        <div class="app-icon whatsapp">W</div>
        WA Pay
      </a>
    </div>

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
    var upiLink = "${upiLink}";
    var intentLink = "${intentLink}";
    var badge = document.getElementById('statusBadge');

    function tryOpen(url) {
      var w = window.open(url, '_self');
      if (!w) window.location.href = url;
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

    var isAndroid = /android/i.test(navigator.userAgent);
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isAndroid || isIOS) {
      badge.className = 'status redirecting';
      badge.textContent = 'Opening your UPI app...';
      setTimeout(function() {
        tryOpen("phonepe://pay?${upiParams}");
      }, 300);
      setTimeout(function() {
        tryOpen("gpay://upi/pay?${upiParams}");
      }, 1200);
      setTimeout(function() {
        tryOpen(upiLink);
      }, 2100);
      if (isAndroid) {
        setTimeout(function() {
          tryOpen(intentLink);
        }, 3000);
      }
      setTimeout(function() {
        badge.className = 'status';
        badge.textContent = 'Tap a button below to pay';
      }, 4000);
    } else {
      badge.className = 'status';
      badge.textContent = 'Choose a payment app below';
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });

  const httpServer = createServer(app);

  return httpServer;
}
