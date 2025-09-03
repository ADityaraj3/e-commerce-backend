# E-Com

A modern e-commerce backend.

## 🚀 Setup Instructions

Follow these steps to get the project up and running:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migration

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database

```bash
npm run seed
```

## 🎯 Naming Conventions

This project follows specific naming conventions:

- **File Names**: camelCase
  - Examples: `userController.js`, `orderService.js`, `authMiddleware.js`
- **DTO Names**: kebab-case
  - Examples: `user-dto.js`, `order-request-dto.js`, `auth-response-dto.js`

## 📊 Database

This project uses Prisma as the ORM. The database schema is defined in `prisma/schema.prisma`.


## 🔧 Configuration

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="your-database-connection-string"
JWT_SECRET="your-jwt-secret"
PORT=3000
NODE_ENV=development
```

## 📝 API Documentation

API documentation will be available at `/api` when the server is running.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🛠️ Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server
- `npm run build` - Build the project
- `npm run test` - Run tests
- `npm run seed` - Seed the database with initial data
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Run database migrations

**Note**: Remember to follow the project's naming conventions - use camelCase for file names and kebab-case for DTO names.
