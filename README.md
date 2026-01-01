# Personal Expense & Investment Tracker

A production-quality MERN stack web application for tracking personal expenses and investments with comprehensive analytics and salary management.

## 🚀 Features

### Core Functionality
- **Expense Tracking**: Track daily expenses with categories and source types
- **Salary Management**: Set monthly salary and track remaining balance
- **Investment Tracking**: Record investments separately from expenses
- **Analytics Dashboard**: Real-time analytics for expenses and investments
- **Monthly Summary**: Detailed breakdown by category, source, and daily trends

### Advanced Features
- ✅ Date range filtering for expenses and investments
- ✅ Category and source type filtering
- ✅ Dark/Light mode toggle
- ✅ Responsive design (mobile-friendly)
- ✅ Real-time salary balance calculation
- ✅ MongoDB aggregation pipelines for optimized analytics
- ✅ RESTful API architecture
- ✅ Clean, modern UI with professional design

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expense
```

### 2. Install Dependencies

Install backend and frontend dependencies:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or use the convenience script:

```bash
npm run install-all
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

**Getting MongoDB Atlas Connection String:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Go to Database Access → Add New Database User
4. Go to Network Access → Add IP Address (0.0.0.0/0 for development)
5. Go to Clusters → Connect → Connect your application
6. Copy the connection string and replace `<password>` with your database password

### 4. Seed Database (Optional)

Populate the database with sample data for testing:

```bash
npm run seed
```

This will create:
- A sample salary record (₹50,000)
- 6 sample expenses
- 3 sample investments

## 🚀 Running the Application

### Development Mode

Run both backend and frontend concurrently:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## 📁 Project Structure

```
expense/
├── server/
│   ├── controllers/          # Business logic
│   │   ├── expenseController.js
│   │   ├── salaryController.js
│   │   ├── investmentController.js
│   │   └── analyticsController.js
│   ├── models/               # MongoDB schemas
│   │   ├── Expense.js
│   │   ├── Salary.js
│   │   └── Investment.js
│   ├── routes/               # API routes
│   │   ├── expenseRoutes.js
│   │   ├── salaryRoutes.js
│   │   ├── investmentRoutes.js
│   │   └── analyticsRoutes.js
│   ├── scripts/              # Utility scripts
│   │   └── seedData.js
│   └── index.js              # Express server entry point
├── client/
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── Expenses.js
│   │   │   ├── Investments.js
│   │   │   ├── MonthlySummary.js
│   │   │   └── ...
│   │   ├── services/         # API service layer
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses (with optional filters)
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/categories` - Get unique categories

### Salary
- `GET /api/salary` - Get current salary
- `GET /api/salary/stats` - Get salary statistics
- `POST /api/salary` - Update/create salary

### Investments
- `GET /api/investments` - Get all investments (with optional filters)
- `GET /api/investments/:id` - Get single investment
- `POST /api/investments` - Create investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment
- `GET /api/investments/types` - Get unique investment types

### Analytics
- `GET /api/analytics` - Get comprehensive analytics
- `GET /api/analytics/monthly` - Get monthly summary

## 📊 Data Models

### Expense
```javascript
{
  itemName: String (required),
  amount: Number (required),
  category: String (optional),
  sourceType: "salary" | "other" (default: "salary"),
  date: Date (default: current date),
  createdAt: Date,
  updatedAt: Date
}
```

### Salary
```javascript
{
  monthlySalary: Number (required),
  effectiveFrom: Date (default: current date),
  createdAt: Date,
  updatedAt: Date
}
```

### Investment
```javascript
{
  investmentName: String (required),
  amount: Number (required),
  investmentType: String (optional),
  date: Date (default: current date),
  createdAt: Date
}
```

## 🎨 Features in Detail

### Expense Tracking
- Add expenses with item name, amount, category, and source type
- Date is auto-filled to today (read-only for new expenses)
- Source type determines if expense reduces salary balance
- Filter by date range, category, or source type

### Salary Management
- Set monthly salary (editable anytime)
- Automatic calculation of:
  - Remaining salary for the month
  - Salary used today
  - Salary used this week
  - Salary used this month
- Only expenses with `sourceType: "salary"` reduce the balance

### Investment Tracking
- Track investments separately from expenses
- Investments do NOT affect salary balance
- Filter by date range and investment type
- View investment analytics

### Analytics Dashboard
- **Overall Expenses**: Total expenses (all sources) for today, week, month
- **Salary Expenses**: Expenses from salary source only
- **Other Expenses**: Expenses from other sources
- **Investments**: Total investments for today, week, month

### Monthly Summary
- Expenses grouped by category
- Expenses grouped by source type
- Investments grouped by type
- Daily breakdown of expenses and investments

## 🎯 Usage Guide

### Adding an Expense
1. Navigate to "Expenses" page
2. Click "+ Add Expense"
3. Fill in the form:
   - Item Name (required)
   - Amount (required)
   - Category (optional)
   - Source Type: Salary or Other
   - Date (auto-filled, editable for existing expenses)
4. Click "Add Expense"

### Setting Salary
1. Go to Dashboard
2. In the Salary card, click "Edit"
3. Enter monthly salary amount
4. Click "Save"

### Adding an Investment
1. Navigate to "Investments" page
2. Click "+ Add Investment"
3. Fill in:
   - Investment Name (required)
   - Amount (required)
   - Investment Type (optional)
   - Date (auto-filled)
4. Click "Add Investment"

### Filtering
- Use filters on Expenses or Investments pages
- Filter by date range, category/type, or source type
- Click "Clear All" to reset filters

### Viewing Analytics
- Dashboard shows real-time analytics
- Monthly Summary page provides detailed breakdowns
- Select different months/years in Monthly Summary

## 🛡️ Security Notes

- Never commit `.env` file to version control
- Use environment variables for sensitive data
- In production, implement authentication/authorization
- Use HTTPS for production deployments
- Validate and sanitize all user inputs (already implemented)

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables in your hosting platform
2. Ensure MongoDB Atlas allows connections from your server IP
3. Deploy the server folder

### Frontend Deployment (Vercel/Netlify)
1. Build the React app: `cd client && npm run build`
2. Deploy the `client/build` folder
3. Set `REACT_APP_API_URL` environment variable to your backend URL

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your MongoDB Atlas connection string
- Check Network Access settings in MongoDB Atlas
- Ensure database user has proper permissions

### CORS Errors
- Backend CORS is configured for `localhost:3000`
- For production, update CORS settings in `server/index.js`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using MERN Stack**

