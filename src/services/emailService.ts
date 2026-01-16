import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport'; 
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 1. Extend the standard type to allow 'family'
interface ExtendedOptions extends SMTPTransport.Options {
  family?: number;
}

// Determine if we should use SSL based on port 465
const isSecure = process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true';

// 2. Use the extended interface here
const transportOptions: ExtendedOptions = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4, // <--- No longer causes an error
  logger: true,
  debug: true
};

const transporter = nodemailer.createTransport(transportOptions);

const loadTemplate = (templateName: string, replacements: Record<string, string>) => {
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateName);
    
    try {
        let html = fs.readFileSync(templatePath, 'utf8');
        for (const key in replacements) {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
        }
        return html;
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        return ""; 
    }
};

export const sendOtpEmail = async (to: string, otp: string) => {
  console.log(`>>> Sending OTP to ${to} via ${process.env.SMTP_HOST}...`);
  
  const htmlContent = loadTemplate('otp.html', { otp });
  
  const mailOptions = {
    from: `"Quick Medics" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Security Code',
    html: htmlContent || `<p>Your OTP Code is: <strong>${otp}</strong></p>`,
  };

  try { 
      const info = await transporter.sendMail(mailOptions); 
      console.log(">>> Email sent successfully! Message ID:", info.messageId);
      return true; 
  } catch (e) { 
      console.error(">>> EMAIL SENDING FAILED:", e);
      return false; 
  }
};

export const sendOrderConfirmationEmail = async (to: string, orderDetails: any) => {
  const { customerName, orderId, totalAmount, items, address } = orderDetails;

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td>${item.productName}</td>
      <td>x${item.qty || item.quantity}</td>
      <td style="text-align:right">₦${Number(item.price).toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = loadTemplate('receipt.html', {
    customerName,
    orderId: orderId.toString(),
    totalAmount: Number(totalAmount).toLocaleString(),
    address,
    itemsHtml 
  });

  const mailOptions = {
    from: `"Quick Medics" <${process.env.SMTP_USER}>`,
    to,
    subject: `Receipt for Order #${orderId}`,
    html: htmlContent,
  };

  try { 
      await transporter.sendMail(mailOptions);
      console.log(`>>> Receipt sent to ${to}`);
  } catch (e) { 
      console.error("Receipt Email Failed:", e); 
  }
};
