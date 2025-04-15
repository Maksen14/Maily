# Email Assistant

A secure application for reading, generating AI responses, and replying to emails - without marking them as read until you've replied.

## Features

- Read unread emails without marking them as read
- Generate AI-powered response suggestions
- Add personal context to get more relevant suggestions
- Reply to emails with ease
- Simple, clean interface
- Mobile responsive

## Security Features

This app implements multiple layers of security:

1. **Authentication**
   - Password-protected login
   - Password stored as bcrypt hash in environment variables
   - Special utility for secure password comparison
   - Rate limiting (5 attempts per 15 minutes)

2. **CSRF Protection**
   - Double-submit CSRF token verification
   - Tokens for all API requests
   - Prevention against cross-site request forgery

3. **API Security**
   - Rate limiting for authentication endpoints
   - Proper error handling
   - Input validation

## Password Authentication

For production, we recommend installing bcrypt:
```bash
npm install bcrypt @types/bcrypt
```

Then generate a hashed password:
```javascript
import bcrypt from "bcrypt"
const hash = await bcrypt.hash("yourpassword", 10)
console.log(hash) // ← copy this into .env
```

Add to `.env.local`:
```
HASHED_PASSWORD=your-bcrypt-hash-here
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-gmail-app-password
   CLAUDE_API_KEY=your-claude-api-key
   CLAUDE_MODEL=claude-3-haiku-20240307
   HASHED_PASSWORD=your-bcrypt-password-hash
   ```

4. Run the development server:
   ```
   npm run dev
   ```

## Deployment

This application can be deployed to Vercel or other Next.js-compatible hosting services.

Ensure all environment variables are properly set in your deployment environment.

## License

This project is licensed under the MIT License. 