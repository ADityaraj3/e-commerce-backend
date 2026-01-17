# E-Commerce Backend API Documentation

## Overview
This is a NestJS-based e-commerce backend with PostgreSQL database using Prisma ORM. The API runs on `http://localhost:8989/api` and includes Swagger documentation at `/api`.

## Tech Stack
- **Framework**: NestJS 11.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer + Cloudinary integration
- **API Documentation**: Swagger/OpenAPI

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "error": "",
  "data": {}, 
  "message": ""
}
```

---

## 🔐 Authentication

### User Authentication
Base Route: `/api/user-auth`

#### 1. Login/Signup with OTP
```http
POST /user-auth/login-signup-otp
Content-Type: application/json

{
  "email": "user@example.com", // optional
  "phone": "+1234567890",      // optional
  "otp_type": "EMAIL_LOGIN" | "EMAIL_SIGNUP" | "MOBILE_LOGIN" | "MOBILE_SIGNUP"
}
```

#### 2. Verify OTP
```http
POST /user-auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "otp_type": "EMAIL_LOGIN"
}
```
**Response:**
```json
{
  "access_token": "jwt_token",
  "customer": {
    "customer_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }
}
```

#### 3. Google Authentication
```http
POST /user-auth/google-auth
Content-Type: application/json

{
  "token": "google_oauth_token"
}
```

### Admin Authentication
Base Route: `/api/admin-auth`
(Protected with `AdminAuthGuard`)

---

## 📦 Products

### Public Product APIs
Base Route: `/api/products`

#### 1. Get All Products
```http
GET /products?category_id={uuid}&is_new_arrival=true&limit=20&offset=0
```
**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "price": 99.99,
      "discountedPrice": 79.99,
      "discount": 20,
      "stockQuantity": 100,
      "isNewArrival": true,
      "isRefundable": true,
      "category": {
        "category_id": "uuid",
        "category_name": "Electronics"
      },
      "images": ["url1", "url2"],
      "variants": [...],
      "reviews": [...],
      "rating": 4.5,
      "reviewCount": 120
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

#### 2. Get Product by ID
```http
GET /products/{product_id}
```

#### 3. Get Product by Slug
```http
GET /products/slug/{slug}
```

#### 4. Get Products by Category
```http
GET /products/category/{category_id}?limit=20&offset=0
```

#### 5. Get Featured Products
```http
GET /products/featured/list?limit=10
```

### Admin Product APIs
Base Route: `/api/admin-product` (Protected)

#### 1. Add Product
```http
POST /admin-product
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_id": "uuid",
  "product_name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "discount": 10,
  "discounted_price": 89.99,
  "stock_quantity": 50,
  "is_new_arrival": true,
  "is_product_refundable": true,
  "auto_generate": true,
  "attributes": [
    {
      "attribute_id": "uuid",
      "values": ["Small", "Medium", "Large"]
    }
  ],
  "product_variants": [
    {
      "sku": "SKU-001",
      "price": 99.99,
      "discount": 10,
      "discounted_price": 89.99,
      "description": "Variant description",
      "stock_quantity": 20,
      "attributes": [
        {
          "attribute_id": "uuid",
          "attribute_value": "Red"
        }
      ],
      "media_id": "uuid"
    }
  ]
}
```

---

## 🗂️ Categories

### Public Category APIs
Base Route: `/api/category-listing`

#### 1. Get Parent Categories
```http
GET /category-listing/parents
```
**Response:**
```json
[
  {
    "category_id": "uuid",
    "category_name": "Electronics",
    "parent_id": null,
    "media_id": "uuid",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 2. Get Child Categories
```http
GET /category-listing/children/{parentId}
```

#### 3. Get Category Filters
```http
GET /category-listing/filters/{categoryId}
```
**Response:**
```json
[
  {
    "name": "Size",
    "value": ["Small", "Medium", "Large", "XL"]
  },
  {
    "name": "Color",
    "value": ["Red", "Blue", "Green"]
  }
]
```

### Admin Category APIs
Base Route: `/api/categories` (Partially Protected)

#### 1. Create Category
```http
POST /categories
Content-Type: application/json

{
  "category_name": "New Category",
  "parent_id": "uuid",
  "media_id": "uuid"
}
```

#### 2. Get All Categories
```http
GET /categories
```

#### 3. Update Category
```http
PATCH /categories/{category_id}
Content-Type: application/json

{
  "category_name": "Updated Category Name",
  "is_active": true
}
```

---

## 🎨 Media Upload

Base Route: `/api/media`

#### 1. Upload to Server
```http
POST /media/upload/media
Content-Type: multipart/form-data

files: [binary files]
```

#### 2. Upload to Cloudinary
```http
POST /media/cloudinary/upload/media
Content-Type: multipart/form-data

files: [binary files]
```

**Response:**
```json
{
  "files": [
    {
      "media_id": "uuid",
      "original_file_name": "image.jpg",
      "file_path": "https://cloudinary.com/...",
      "mimetype": "image/jpeg",
      "size": 102400
    }
  ]
}
```

---

## 🏷️ Coupons

Base Route: `/api/coupons` (Protected)

#### 1. Get All Coupons
```http
GET /coupons
Authorization: Bearer {token}
```

---

## 🔔 Alerts

Base Route: `/api/alerts` (Protected)

#### 1. Create Alert
```http
POST /alerts
Authorization: Bearer {token}
Content-Type: application/json

{
  "alert_name": "Low Stock Alert",
  "alert_description": "Product stock is below threshold"
}
```

#### 2. Get All Alerts
```http
GET /alerts
Authorization: Bearer {token}
```

#### 3. Get Alert by ID
```http
GET /alerts/{alert_id}
Authorization: Bearer {token}
```

---

## 📊 Database Schema

### Key Models

#### Customer
- customer_id (UUID, PK)
- email
- password_hash
- first_name, last_name
- phone
- is_email_verified
- is_active
- Relationships: addresses, cart_items, orders, reviews, wishlists

#### Product
- product_id (UUID, PK)
- category_id (FK)
- product_name
- price, discount, discounted_price
- stock_quantity
- is_new_arrival
- is_product_refundable
- description
- Relationships: variants, reviews, offers

#### ProductVariant
- product_variant_id (UUID, PK)
- product_id (FK)
- sku
- price, discount, discounted_price
- stock_quantity
- Relationships: variant_attributes, product_variant_media

#### Category
- category_id (UUID, PK)
- category_name
- parent_id (FK, self-referencing)
- media_id (FK)
- is_active
- Relationships: products, category_attributes

#### Order
- order_id (UUID, PK)
- customer_id (FK)
- order_number
- status (enum)
- subtotal, tax_amount, shipping_amount, discount_amount
- billing_address_id, shipping_address_id (FK)
- Relationships: order_items, payments, shipments

---

## ✅ Implemented Features

### ✓ Authentication & Authorization
- Customer authentication (OTP, Google OAuth)
- Admin authentication with JWT
- Role-based access control (RBAC)

### ✓ Product Management
- CRUD operations for products
- Product variants with attributes
- Auto-generate variants from attribute combinations
- Product images via media upload
- Stock management

### ✓ Category Management
- Hierarchical categories (parent-child)
- Category attributes for filtering
- Category-specific product filters

### ✓ Media Management
- Local file upload
- Cloudinary integration
- Support for images and PDFs

### ✓ Reviews System
- Customer reviews with ratings
- Review media (images)

### ✓ Database Features
- Multi-schema (public, system_config)
- Comprehensive enums (order_status, payment_methods, etc.)
- Soft deletes (is_deleted flags)
- Audit fields (created_by, updated_by, timestamps)

---

## ❌ Missing Features for Complete E-commerce

### 🛒 Cart Management (Database exists, no API)
**Priority: HIGH**
- Add to cart
- Update cart item quantity
- Remove from cart
- Clear cart
- Get cart items with totals

### 💳 Checkout & Orders (Database exists, no API)
**Priority: HIGH**
- Create order from cart
- Apply coupons/vouchers
- Calculate shipping
- Order status updates
- Order history

### 💰 Payment Integration (Database exists, no API)
**Priority: HIGH**
- Payment gateway integration (Stripe, Razorpay, etc.)
- Payment status tracking
- Refund processing

### 📍 Address Management (Database exists, no API)
**Priority: HIGH**
- CRUD addresses
- Set default billing/shipping addresses
- Address validation

### 📦 Shipping & Fulfillment (Partial database)
**Priority: MEDIUM**
- Shipping method selection
- Shipment tracking
- Delivery status updates

### ❤️ Wishlist (Database exists, no API)
**Priority: MEDIUM**
- Add/remove wishlist items
- Move to cart

### 🔄 Returns & Refunds (Database exists, no API)
**Priority: MEDIUM**
- Return request creation
- Return approval workflow
- Refund processing

### 🎁 Gift Vouchers (Database exists, no API)
**Priority: LOW**
- Voucher generation
- Voucher redemption
- Balance tracking

### 📊 Analytics & Reports
**Priority: LOW**
- Sales reports
- Customer analytics
- Inventory reports

### 🔍 Search & Filters
**Priority: MEDIUM**
- Full-text product search
- Advanced filtering by attributes
- Sort options

### 📧 Notifications
**Priority: MEDIUM**
- Email notifications (order confirmation, shipping, etc.)
- SMS notifications
- Push notifications

### 👤 Customer Profile
**Priority: MEDIUM**
- Profile management
- Order history
- Address book
- Wishlist view

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation
```bash
cd e-commerce-backend
npm install
```

### Environment Setup
Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
JWT_SECRET="your-secret-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Database Setup
```bash
npx prisma generate
npx prisma db push
npm run seed  # Optional: seed data
```

### Run
```bash
npm run start:dev
```

Access:
- API: http://localhost:8989/api
- Swagger Docs: http://localhost:8989/api

---

## 📝 Notes
- All protected routes require `Authorization: Bearer {token}` header
- File uploads limited to 500MB
- CORS enabled for all origins
- Response interceptor wraps all responses in standard format
