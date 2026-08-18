import 'dotenv/config';
import { initDb } from './db.js';
import { initAuthDb } from './auth.js';

try {
  await initDb();
  await initAuthDb();
  console.log('Trace database initialization complete.');
  process.exit(0);
} catch (error) {
  console.error('Trace database initialization failed.', error);
  process.exit(1);
}
