import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

console.log(process.env.API_POSTGRES_TEST_HOST);
