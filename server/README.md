# Expense Tracker - Express Backend

This is the Express.js backend server for the Personal Expense & Investment Tracker application.

## API Documentation

### Base URL
`http://localhost:5000/api`

### Endpoints

#### Expenses
- `GET /expenses` - Get all expenses
  - Query params: `startDate`, `endDate`, `category`, `sourceType`
- `GET /expenses/:id` - Get single expense
- `POST /expenses` - Create expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense
- `GET /expenses/categories` - Get unique categories

#### Salary
- `GET /salary` - Get current salary
- `GET /salary/stats` - Get salary statistics
- `POST /salary` - Update/create salary

#### Investments
- `GET /investments` - Get all investments
  - Query params: `startDate`, `endDate`, `investmentType`
- `GET /investments/:id` - Get single investment
- `POST /investments` - Create investment
- `PUT /investments/:id` - Update investment
- `DELETE /investments/:id` - Delete investment
- `GET /investments/types` - Get unique investment types

#### Analytics
- `GET /analytics` - Get comprehensive analytics
- `GET /analytics/monthly` - Get monthly summary
  - Query params: `year`, `month` (0-indexed)

## Database Models

All models use Mongoose ODM and include timestamps.

## Error Handling

All endpoints use centralized error handling middleware.

## Validation

Input validation is performed using `express-validator`.

