const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in the server directory
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Check required environment variables
const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

console.log('Environment Variables:');
console.log('---------------------');

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = value !== undefined && value !== '';
  
  if (!isPresent) {
    allVarsPresent = false;
    console.error(`❌ ${varName} is missing`);
  } else {
    // Mask sensitive values
    const displayValue = ['DB_PASSWORD', 'JWT_SECRET'].includes(varName) 
      ? '********' 
      : value;
    console.log(`✅ ${varName}=${displayValue}`);
  }
});

if (!allVarsPresent) {
  console.error('\n❌ Error: Some required environment variables are missing');
  console.log('\nMake sure your .env file contains all required variables.');
  console.log('Example .env file:');
  console.log('------------------');
  console.log('DB_HOST=your_db_host');
  console.log('DB_PORT=5432');
  console.log('DB_USER=your_db_user');
  console.log('DB_PASSWORD=your_db_password');
  console.log('DB_NAME=your_db_name');
  console.log('JWT_SECRET=your_jwt_secret');
  console.log('JWT_EXPIRES_IN=24h');
  console.log('PORT=5000');
  console.log('NODE_ENV=development');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present!');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Environment file loaded from: ${envPath}`);
