# Evalytics Backend

Backend server for the Evalytics application built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (comes with Node.js)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Evalytics_UI/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a new PostgreSQL database named `evalytics_db`
   - Run the SQL commands from `database.sql` to create the users table

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your database credentials

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register a new user
  ```json
  {
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```

- `POST /api/v1/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```

## Environment Variables

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: evalytics_db)
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRES_IN` - JWT expiration time (default: 24h)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Application environment (development/production)

## Development

- Use `npm run dev` to start the development server with nodemon
- The server will automatically restart when you make changes to the code

## Production

- Set `NODE_ENV=production` in your `.env` file
- Use `npm start` to start the production server

## License

MIT
