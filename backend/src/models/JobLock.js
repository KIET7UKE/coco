import mongoose from 'mongoose';

const jobLockSchema = new mongoose.Schema({
  _id: { type: String },
  holder: { type: String, default: '' },
  until: { type: Date, default: () => new Date(0) },
});

export const JobLock = mongoose.model('JobLock', jobLockSchema);
