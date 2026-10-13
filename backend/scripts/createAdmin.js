// Usage: npm run create-admin -- <email> <password> [name]
// Creates an admin, or promotes an existing account and resets its password.
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const [email, password, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ') || 'CoCo Admin';

if (!email || !password || password.length < 12) {
  console.error('Usage: npm run create-admin -- <email> <password (12+ chars)> [name]');
  process.exit(1);
}
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('MONGODB_URI and JWT_SECRET must be set in backend/.env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
let user = await User.findOne({ email: email.toLowerCase() });
if (user) {
  user.role = 'admin';
  user.status = 'active';
  user.password = password;
  await user.save();
  console.log(`Promoted ${user.email} to admin`);
} else {
  user = await User.create({ name, email, password, role: 'admin' });
  console.log(`Created admin ${user.email}`);
}
await mongoose.disconnect();
