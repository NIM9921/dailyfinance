# Daily Finance Management Backend

A REST API built with Express.js and MongoDB for managing personal finances.

## Features

- User authentication (registration/login)
- Transaction management (income/expense tracking)
- Category management with custom colors and icons
- Transaction statistics and analytics
- MongoDB integration with Mongoose ODM
- Input validation and error handling
- CORS support for frontend integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/daily-finance
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

4. Start MongoDB service (if running locally)

5. Run the application:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/users` - Get all users (development)

### Categories
- `GET /api/categories?userId=<userId>` - Get user categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions?userId=<userId>` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/:userId` - Get transaction statistics

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  avatar: String,
  isActive: Boolean
}
```

### Category Model
```javascript
{
  name: String (required),
  type: String (income/expense),
  color: String (hex color),
  icon: String,
  description: String,
  user: ObjectId (ref: User),
  isDefault: Boolean,
  isActive: Boolean
}
```

### Transaction Model
```javascript
{
  title: String (required),
  amount: Number (required),
  type: String (income/expense),
  category: ObjectId (ref: Category),
  description: String,
  date: Date,
  user: ObjectId (ref: User),
  tags: [String],
  paymentMethod: String,
  location: String,
  isRecurring: Boolean,
  recurringType: String
}
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - Frontend URL for CORS

## Development

To add new features:

1. Create models in `/models` directory
2. Add routes in `/routes` directory
3. Update `server.js` to include new routes
4. Add validation and error handling
5. Test endpoints with Postman or similar tool

## Security Notes

**Important**: This is a basic implementation for development purposes. For production use, please implement:

- Password hashing with bcrypt
- JWT authentication middleware
- Input sanitization
- Rate limiting
- HTTPS enforcement
- Environment-specific security headers

## License

ISC
