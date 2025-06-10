import { Pool } from 'pg';

// It's recommended to use environment variables for connection details
// For now, we'll use the hardcoded values from the previous steps
const pool = new Pool({
  user: 'app_user',
  host: 'localhost',
  database: 'app_db',
  password: 'app_password',
  port: 5432,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

// Optional: Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to local PostgreSQL database:', result.rows);
  });
});
