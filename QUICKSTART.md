# Quick Start Guide

Get your Expense Tracker up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

## Step 2: Set Up MongoDB

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is fine)
3. Create a database user (Database Access → Add New Database User)
4. Whitelist your IP (Network Access → Add IP Address → Add Current IP Address)
5. Get your connection string (Clusters → Connect → Connect your application)

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string_here
PORT=5000
NODE_ENV=development
```

Replace `your_mongodb_connection_string_here` with your actual MongoDB Atlas connection string.

## Step 4: Seed Database (Optional)

```bash
npm run seed
```

This creates sample data for testing.

## Step 5: Run the Application

```bash
npm run dev
```

This starts both:
- Backend server: http://localhost:5000
- Frontend app: http://localhost:3000

## Step 6: Open in Browser

Navigate to http://localhost:3000

## First Steps

1. **Set Your Salary**: Go to Dashboard → Click "Edit" on Salary card → Enter your monthly salary
2. **Add an Expense**: Go to Expenses → Click "+ Add Expense" → Fill the form
3. **Add an Investment**: Go to Investments → Click "+ Add Investment" → Fill the form
4. **View Analytics**: Check the Dashboard for real-time analytics

## Troubleshooting

**MongoDB Connection Error?**
- Check your connection string in `.env`
- Verify your IP is whitelisted in MongoDB Atlas
- Ensure your database user has read/write permissions

**Port Already in Use?**
- Change `PORT` in `.env` to a different port (e.g., 5001)
- Or kill the process using the port

**CORS Errors?**
- Make sure backend is running on port 5000
- Check that frontend proxy is set correctly in `client/package.json`

## Need Help?

Check the main [README.md](README.md) for detailed documentation.

