import type { Order } from '../firebase/orders';
import { ORDER_STATUS_LABEL } from '../types';
import type { OrderStatus } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function printInvoice(order: Order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const itemRows = order.items.map(it => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e8ddd0">${it.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e8ddd0;color:#7a6a5a">${it.category}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e8ddd0;text-align:center">${it.qty}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e8ddd0;text-align:right">${fmt(it.price)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e8ddd0;text-align:right;font-weight:600">${fmt(it.price * it.qty)}</td>
    </tr>
  `).join('');

  const addr = order.shippingAddress;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice – Order #${order.id.slice(0, 10).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #2c1a0e; background: #fff; padding: 48px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #2c1a0e; }
    .brand { font-size: 24px; font-weight: 700; letter-spacing: 0.05em; }
    .brand span { color: #c49a2c; font-style: italic; }
    .invoice-meta { text-align: right; font-size: 13px; color: #7a6a5a; }
    .invoice-meta strong { display: block; font-size: 20px; color: #2c1a0e; margin-bottom: 4px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #9a8a7a; margin-bottom: 8px; }
    .address { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead { background: #f5f0e8; }
    thead th { padding: 10px 8px; text-align: left; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #7a6a5a; font-weight: 600; }
    thead th:last-child, thead th:nth-child(4), thead th:nth-child(3) { text-align: right; }
    thead th:nth-child(3) { text-align: center; }
    .totals { margin-top: 20px; margin-left: auto; width: 260px; font-size: 14px; }
    .totals tr td { padding: 5px 8px; color: #7a6a5a; }
    .totals tr td:last-child { text-align: right; }
    .totals tr.grand td { font-size: 17px; font-weight: 700; color: #2c1a0e; border-top: 2px solid #2c1a0e; padding-top: 10px; }
    .status-badge { display: inline-block; background: #f5f0e8; color: #2c1a0e; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; padding: 3px 10px; border-radius: 2px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e8ddd0; font-size: 12px; color: #9a8a7a; text-align: center; line-height: 1.8; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Wooden <span>Heritage</span></div>
      <div style="font-size:12px;color:#9a8a7a;margin-top:4px">Est. 1968 · Khopda, Rajasthan</div>
    </div>
    <div class="invoice-meta">
      <strong>Tax Invoice</strong>
      Order #${order.id.slice(0, 10).toUpperCase()}<br/>
      Date: ${date}<br/>
      Status: <span class="status-badge">${ORDER_STATUS_LABEL[order.status as OrderStatus] || order.status}</span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px">
    <div class="section">
      <div class="section-title">Bill To</div>
      <div class="address">
        <strong>${addr.name}</strong><br/>
        ${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br/>
        ${addr.city}, ${addr.state} – ${addr.pincode}<br/>
        Phone: ${addr.phone}
      </div>
    </div>
    ${order.razorpay ? `
    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="address">
        <strong style="color:#4a7c59">Paid</strong><br/>
        Razorpay ID: ${order.razorpay.paymentId || '—'}<br/>
        Order ID: ${order.razorpay.orderId}
      </div>
    </div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Category</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td>${fmt(order.subtotal)}</td></tr>
    <tr><td>Shipping</td><td>${order.shipping === 0 ? 'Free' : fmt(order.shipping)}</td></tr>
    <tr><td>GST (5%)</td><td>${fmt(order.tax)}</td></tr>
    <tr class="grand"><td>Total</td><td>${fmt(order.total)}</td></tr>
  </table>

  <div class="footer">
    Thank you for choosing Krishna Craft · For queries: support@woodenheritage.in<br/>
    This is a computer-generated invoice and does not require a signature.
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
