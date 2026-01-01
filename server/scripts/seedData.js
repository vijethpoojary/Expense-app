require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Investment = require('../models/Investment');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Expense.deleteMany({});
    await Salary.deleteMany({});
    await Investment.deleteMany({});

    console.log('Cleared existing data...');

    // Create salary
    const salary = await Salary.create({
      monthlySalary: 50000,
      effectiveFrom: new Date()
    });
    console.log('Created salary:', salary.monthlySalary);

    // Create sample expenses
    const expenses = [
      {
        itemName: 'Grocery Shopping',
        amount: 2500,
        category: 'Food',
        sourceType: 'salary',
        date: new Date()
      },
      {
        itemName: 'Restaurant Dinner',
        amount: 1200,
        category: 'Food',
        sourceType: 'salary',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
      },
      {
        itemName: 'Uber Ride',
        amount: 300,
        category: 'Transport',
        sourceType: 'salary',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        itemName: 'Freelance Payment',
        amount: 5000,
        category: 'Income',
        sourceType: 'other',
        date: new Date()
      },
      {
        itemName: 'Movie Tickets',
        amount: 800,
        category: 'Entertainment',
        sourceType: 'salary',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        itemName: 'Gift from Friend',
        amount: 2000,
        category: 'Gift',
        sourceType: 'other',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ];

    await Expense.insertMany(expenses);
    console.log(`Created ${expenses.length} expenses`);

    // Create sample investments
    const investments = [
      {
        investmentName: 'Stock Purchase - AAPL',
        amount: 10000,
        investmentType: 'Stocks',
        date: new Date()
      },
      {
        investmentName: 'Mutual Fund - Growth',
        amount: 15000,
        investmentType: 'Mutual Funds',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        investmentName: 'Fixed Deposit',
        amount: 50000,
        investmentType: 'Fixed Deposit',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      }
    ];

    await Investment.insertMany(investments);
    console.log(`Created ${investments.length} investments`);

    console.log('\n✅ Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
});

