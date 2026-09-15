# QuickMedics Pharmacy API

A secure and scalable Node.js/Express backend powering the QuickMedics Pharmacy e-commerce platform. This API handles everything from product and category management to secure Paystack payments, Google OAuth authentication, and automated email notifications.

## Key Features

*   **Authentication & Authorization:** Secure JWT-based authentication featuring standard email/password login, OTP-based password resets, and Google OAuth integration[cite: 4].
*   **Order & Payment Processing:** Full checkout flow management with Paystack integration, including a secure webhook fallback to ensure orders are processed even if the client disconnects[cite: 4].
*   **Product & Catalog Management:** CRUD operations for drugs and categories, plus dynamic homepage configuration allowing admins to pin items to specific sections[cite: 4].
*   **Media Management:** Automated image compression using `sharp` before uploading to Cloudinary for optimized banner and product images[cite: 4].
*   **Automated Emailing:** Nodemailer integration utilizing custom HTML templates to send order receipts, OTP security codes, and training program applications[cite: 4].
*   **Security & Performance:** Built-in rate limiting, Helmet for HTTP header security, and CORS configuration to protect API endpoints[cite: 4].

## Tech Stack

*   **Core Framework:** Node.js, Express.js, TypeScript[cite: 4].
*   **Database & ORM:** MySQL, Drizzle ORM[cite: 4].
*   **Authentication:** JWT, bcrypt, `google-auth-library`[cite: 4].
*   **Media & Storage:** Cloudinary, `sharp`, `multer`[cite: 4].
*   **Integrations:** Paystack API, Nodemailer[cite: 4].

## Environment Variables

Create a `.env` file in the root directory and configure the following required variables[cite: 4]:

```env
# Server Configuration
PORT=5000
API_PREFIX=/api
CORS_ORIGIN=*
JWT_SECRET=your_jwt_secret

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=quickmedics_db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary (Image Hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Paystack
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# SMTP / Email Configuration
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password
SENDER_NAME="Quick Medics"
OWNER_EMAIL=admin@quickmedics.ng