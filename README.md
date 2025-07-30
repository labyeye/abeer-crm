# PhotoERP - Photography Business Management System

A comprehensive ERP solution for photography businesses with multi-level access control, automated workflows, and smart communication.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend root with:
   ```env
   NODE_ENV=development
   PORT=3500
   MONGO_URI=mongodb://localhost:27017/abeer-crm
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Create demo users:**
   ```bash
   npm run create-users
   ```

6. **Create demo companies (optional):**
   ```bash
   npm run create-companies
   ```

7. **Create demo inventory (optional):**
   ```bash
   npm run create-inventory
   ```

8. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm install axios
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

## 👥 User Management

The system supports multiple user roles with different access levels:

- **Chairman** - Full system access
- **Admin** - Company-level management
- **Manager** - Branch-level management  
- **Staff** - Basic operational access
- **Client** - Limited access to own data

Users can be created through the registration API or using the demo user script for testing.

## 🏗️ System Architecture

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Vite** - Build tool

## 📁 Project Structure

```
abeer-crm/
├── backend/
│   ├── config/          # Configuration files
│   ├── controller/      # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   └── utils/           # Helper utilities
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── contexts/    # React contexts
    │   ├── pages/       # Page components
    │   └── services/    # API services
    └── public/          # Static assets
```

## 🔐 Authentication

The system uses JWT tokens for authentication. Tokens are automatically:
- Stored in localStorage after login
- Added to API requests via interceptors
- Cleared on logout or 401 errors

## 🎨 Features

- **Multi-level Access Control** - Role-based permissions
- **Dashboard Analytics** - Performance metrics and charts
- **Client Management** - Customer database and interactions
- **Booking System** - Appointment scheduling
- **Inventory Management** - Equipment and supplies tracking with real-time updates
- **Company Management** - Multi-company support with role-based access
- **Financial Management** - Revenue and expense tracking
- **Staff Management** - Employee records and attendance
- **Reports & Analytics** - Business insights and reporting

## 🛠️ Development

### Adding New Features
1. Create backend routes and controllers
2. Add frontend components and pages
3. Update API services
4. Test with different user roles

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

**Company Management (Chairman/Admin only):**
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get single company
- `POST /api/companies` - Create company (Chairman only)
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company (Chairman only)
- `GET /api/companies/stats` - Get company statistics

**Inventory Management (Chairman/Admin/Manager):**
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get single inventory item
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item (Chairman/Admin only)
- `PATCH /api/inventory/:id/quantity` - Update quantity
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/search` - Search inventory

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request # abeer-crm
