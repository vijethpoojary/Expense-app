# Authentication Setup Guide

This document provides instructions for setting up authentication in the Expense Tracker application.

## Environment Variables

Add the following environment variables to your `.env` file in the `server` directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
JWT_EXPIRES_IN=7d

# MongoDB (already exists)
MONGODB_URI=your_mongodb_connection_string

# Node Environment
NODE_ENV=development

# Port
PORT=5000
```

### Generating JWT_SECRET

For production, generate a strong random secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

**Important**: Never commit the `.env` file to version control. It's already in `.gitignore`.

## Database Changes

### Migration Notes

After adding authentication, existing data in your database will not be associated with any user. You have two options:

1. **Start Fresh (Recommended for Development)**
   - Clear all existing data from Expense, Investment, and Salary collections
   - Create a new user account and start fresh

2. **Migrate Existing Data (Production)**
   - Manually update existing documents to include a `userId` field
   - Create a user account first to get a userId
   - Update all documents: `db.expenses.updateMany({}, { $set: { userId: ObjectId("your-user-id") } })`

## Features Implemented

### Backend Security

✅ **User Model**
- Email (unique, indexed, lowercase)
- Password (hashed with bcrypt, salt rounds: 12)
- Passwords never stored in plain text
- Password excluded from queries by default

✅ **JWT Authentication**
- Tokens stored in HTTP-only cookies (XSS protection)
- Secure cookies in production (HTTPS only)
- SameSite protection (CSRF protection)
- 7-day token expiry

✅ **User Data Isolation**
- All models include `userId` field
- All queries filtered by `req.user.id` (from verified JWT)
- Never trust userId from frontend
- Each user can only access their own data

✅ **Rate Limiting**
- Auth routes limited to 5 requests per 15 minutes
- Prevents brute force attacks

✅ **Security Middleware**
- Authentication middleware verifies JWT on every protected route
- Returns 401 for unauthorized requests
- Validates user exists before allowing access

### Frontend Security

✅ **Protected Routes**
- All expense/investment pages require authentication
- Unauthenticated users redirected to login
- Login page shown first on app load

✅ **Auth Context**
- Centralized authentication state
- Automatic auth check on app load
- User state persists across components

✅ **Secure API Calls**
- All API calls use `withCredentials: true`
- Cookies sent automatically with requests
- Axios configured for cookie-based auth

## API Endpoints

### Public Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Protected Routes (Require Authentication)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- All `/api/expenses/*` routes
- All `/api/investments/*` routes
- All `/api/salary/*` routes
- All `/api/analytics/*` routes

## Usage

### Registration Flow

1. User opens application → Redirected to Login page
2. User clicks "Register" button
3. Enters email and password (min 6 characters)
4. On success → Redirected back to Login page
5. User must login manually (no auto-login)

### Login Flow

1. User enters email and password
2. On success:
   - JWT token set in HTTP-only cookie
   - User redirected to Dashboard
   - All protected routes accessible

### Logout Flow

1. User clicks "Logout" button in navbar
2. Auth cookie cleared
3. User redirected to Login page
4. All protected routes inaccessible

## Testing Authentication

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Protected Route (with cookie)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

## Security Best Practices

1. **Environment Variables**
   - Always use strong, random JWT_SECRET
   - Never commit secrets to version control
   - Use different secrets for development/production

2. **Password Security**
   - Minimum 6 characters (can be increased)
   - Passwords hashed with bcrypt (salt rounds: 12)
   - Never log passwords or send in error messages

3. **Cookie Security**
   - HTTP-only cookies prevent XSS attacks
   - Secure flag enabled in production (HTTPS only)
   - SameSite prevents CSRF attacks

4. **Data Isolation**
   - Always filter by `req.user.id` in controllers
   - Never trust userId from request body
   - Verify user owns resource before update/delete

5. **Error Messages**
   - Generic error messages (don't reveal if email exists)
   - No sensitive information in error responses
   - Detailed errors only in development mode

## Troubleshooting

### "Authentication required" errors
- Check if JWT_SECRET is set in environment variables
- Verify cookie is being sent (check browser DevTools → Application → Cookies)
- Ensure `withCredentials: true` is set in axios config

### CORS errors with cookies
- Verify `credentials: true` in CORS configuration
- Check that frontend URL is in allowed origins
- Ensure cookies are being sent (check Network tab)

### "User not found" after login
- User may have been deleted from database
- Token may be invalid/expired
- Clear cookies and login again

### Rate limiting errors
- Wait 15 minutes or increase limit in `authRoutes.js`
- Check if multiple login attempts are being made

## Production Deployment

### Backend (Render/Heroku)

1. Set environment variables:
   - `JWT_SECRET` (strong random secret)
   - `JWT_EXPIRES_IN` (default: 7d)
   - `MONGODB_URI`
   - `NODE_ENV=production`
   - `PORT` (usually auto-set)

2. Verify cookie settings work with HTTPS

### Frontend (Vercel/Netlify)

1. Set environment variable:
   - `REACT_APP_API_URL` (your backend URL)

2. Ensure backend CORS includes your frontend domain

3. Test authentication flow in production

## Notes

- Authentication is mandatory - no guest/anonymous access
- Each user has completely isolated data
- Old data (before auth) will not be accessible to new users
- Consider data migration strategy if upgrading existing deployment

