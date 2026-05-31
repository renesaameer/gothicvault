import { CURRENCY_SYMBOL } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceData {
  order: any;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  logoUrl?: string;
  footerText?: string;
  signatureLabel?: string;
  termsText?: string;
}

const generateInvoiceHTML = (data: InvoiceData, format: "a4" | "receipt" = "a4"): string => {
  const { order, storeName = "Store", storeAddress = "", storePhone = "", storeEmail = "", logoUrl, footerText = "Thank you for your business!", signatureLabel = "", termsText = "" } = data;
  const items = (order.items as any[]) || [];
  const addr = order.shipping_address || {};
  const date = new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (format === "receipt") {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 280px; padding: 10px; font-size: 12px; color: #000; }
  .center { text-align: center; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; }
  .bold { font-weight: bold; }
  .mt { margin-top: 4px; }
  .mb { margin-bottom: 4px; }
</style></head><body>
  <div class="center bold" style="font-size: 14px;">${storeName}</div>
  <div class="center mt" style="font-size: 10px;">${storePhone}</div>
  <div class="line"></div>
  <div class="row"><span>Receipt #</span><span>${order.order_number}</span></div>
  <div class="row mt"><span>Date</span><span>${date}</span></div>
  <div class="line"></div>
  ${items.map((item: any) => `<div class="row"><span>${item.name} x${item.quantity || 1}</span><span>${CURRENCY_SYMBOL}${(item.price * (item.quantity || 1)).toFixed(0)}</span></div>`).join("")}
  <div class="line"></div>
  <div class="row"><span>Subtotal</span><span>${CURRENCY_SYMBOL}${Number(order.subtotal).toFixed(0)}</span></div>
  ${Number(order.discount_amount) > 0 ? `<div class="row"><span>Discount</span><span>-${CURRENCY_SYMBOL}${Number(order.discount_amount).toFixed(0)}</span></div>` : ""}
  <div class="row"><span>Shipping</span><span>${CURRENCY_SYMBOL}${Number(order.shipping_cost).toFixed(0)}</span></div>
  <div class="line"></div>
  <div class="row bold" style="font-size: 14px;"><span>Total</span><span>${CURRENCY_SYMBOL}${Number(order.total).toFixed(0)}</span></div>
  <div class="line"></div>
   <div class="center mt" style="font-size: 10px;">${footerText || "Thank you for your purchase!"}</div>
</body></html>`;
  }

  // A4 Invoice
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 24px; font-weight: 700; }
  .logo img { max-height: 50px; }
  .invoice-info { text-align: right; }
  .invoice-info h2 { font-size: 28px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
  .invoice-info p { font-size: 13px; color: #666; line-height: 1.6; }
  .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .details-col h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
  .details-col p { font-size: 13px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; padding: 10px 0; border-bottom: 2px solid #eee; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 12px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  tbody td:last-child { text-align: right; }
  .totals { width: 280px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; }
  .totals .row.grand { border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 700; }
  .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <div class="logo">${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" />` : storeName}</div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p>Invoice #: ${order.order_number}<br/>Date: ${date}</p>
    </div>
  </div>
  <div class="details">
    <div class="details-col">
      <h4>Bill To</h4>
      <p><strong>${order.customer_name}</strong><br/>
      ${order.customer_email}<br/>
      ${order.customer_phone || ""}
      ${addr.line1 ? `<br/>${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}<br/>${addr.city || ""} ${addr.state || ""} ${addr.zip || ""}<br/>${addr.country || ""}` : ""}</p>
    </div>
    <div class="details-col" style="text-align: right;">
      <h4>From</h4>
      <p><strong>${storeName}</strong>${storeAddress ? `<br/>${storeAddress}` : ""}${storePhone ? `<br/>${storePhone}` : ""}${storeEmail ? `<br/>${storeEmail}` : ""}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>
      ${items.map((item: any) => `<tr>
        <td>${item.name}</td>
        <td>${item.sku || "—"}</td>
        <td>${item.quantity || 1}</td>
        <td>${CURRENCY_SYMBOL}${Number(item.price).toFixed(0)}</td>
        <td>${CURRENCY_SYMBOL}${(item.price * (item.quantity || 1)).toFixed(0)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${CURRENCY_SYMBOL}${Number(order.subtotal).toFixed(0)}</span></div>
    ${Number(order.discount_amount) > 0 ? `<div class="row"><span>Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>-${CURRENCY_SYMBOL}${Number(order.discount_amount).toFixed(0)}</span></div>` : ""}
    <div class="row"><span>Shipping</span><span>${CURRENCY_SYMBOL}${Number(order.shipping_cost).toFixed(0)}</span></div>
    <div class="row grand"><span>Grand Total</span><span>${CURRENCY_SYMBOL}${Number(order.total).toFixed(0)}</span></div>
  </div>
  ${termsText ? `<div style="margin-top:30px;font-size:11px;color:#666;border-top:1px solid #eee;padding-top:12px;"><strong>Terms:</strong> ${termsText}</div>` : ""}
  ${signatureLabel ? `<div style="margin-top:40px;text-align:right;"><div style="border-top:1px solid #ccc;display:inline-block;padding-top:6px;min-width:200px;font-size:12px;color:#666;">${signatureLabel}</div></div>` : ""}
  <div class="footer">
    <p>${footerText}</p>
  </div>
</body></html>`;
};

export const printInvoice = async (data: InvoiceData, format: "a4" | "receipt" = "a4") => {
  // Auto-load invoice settings from DB if not provided
  if (!data.storeName && !data.storePhone) {
    try {
      const { data: settings } = await supabase.from("invoice_settings").select("*").eq("id", "default").single();
      if (settings) {
        data.storeName = settings.store_name || data.storeName;
        data.storeAddress = settings.store_address || data.storeAddress;
        data.storePhone = settings.store_phone || data.storePhone;
        data.storeEmail = settings.store_email || data.storeEmail;
        data.logoUrl = settings.logo_url || data.logoUrl;
        const s = settings as any;
        data.footerText = s.footer_text || s.footer_note || data.footerText;
        data.signatureLabel = s.signature_label || data.signatureLabel;
        data.termsText = s.terms_text || data.termsText;
      }
    } catch {}
  }
  const html = generateInvoiceHTML(data, format);
  const win = window.open("", "_blank", format === "receipt" ? "width=320,height=600" : "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 300);
};

export default generateInvoiceHTML;
