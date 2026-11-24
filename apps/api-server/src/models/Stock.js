import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
  facilityId: { type: String, required: true, index: true },
  facilityName: String,
  medicineName: { type: String, required: true },
  genericName: String,
  category: { type: String, enum: ['Essential', 'Vaccine', 'Contraceptive', 'Supplement', 'Emergency', 'Diagnostic'], default: 'Essential' },
  quantityInHand: Number,
  reorderLevel: Number,
  unit: String,          // tablets, vials, strips
  expiryDate: Date,
  lastIndentDate: Date,
  status: { type: String, enum: ['adequate', 'low', 'critical', 'stockout'], default: 'adequate' },
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

StockSchema.pre('save', function (next) {
  if (this.quantityInHand <= 0) this.status = 'stockout';
  else if (this.quantityInHand <= this.reorderLevel) this.status = 'critical';
  else if (this.quantityInHand <= this.reorderLevel * 2) this.status = 'low';
  else this.status = 'adequate';
  next();
});

export default mongoose.model('Stock', StockSchema);
