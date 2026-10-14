import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: String,
  category: { type: String, index: true },
  description: String,
  color: String,
  cover: String,
  duration: String,
  featured: Boolean,
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const activitySchema = new mongoose.Schema({
  userId: { type: String, index: true, default: 'shamili' },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  type: { type: String, enum: ['view', 'like'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
