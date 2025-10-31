import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

try {
  await connection.execute('ALTER TABLE presenter_cursors ADD COLUMN pageNumber INT NOT NULL DEFAULT 1');
  console.log('✅ Column pageNumber added successfully');
} catch (error) {
  if (error.code === 'ER_DUP_FIELDNAME') {
    console.log('✅ Column pageNumber already exists');
  } else {
    console.error('❌ Error:', error.message);
  }
}

await connection.end();

