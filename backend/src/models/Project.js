import mongoose from 'mongoose';

export const REGIONS = ['us-east', 'us-west', 'eu-west'];

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    region: { type: String, enum: REGIONS, default: 'us-east' },
  },
  { timestamps: true }
);

projectSchema.methods.toPublic = function () {
  return { id: this._id, name: this.name, region: this.region, createdAt: this.createdAt, updatedAt: this.updatedAt };
};

export const Project = mongoose.model('Project', projectSchema);
