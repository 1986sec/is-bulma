const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  bucket: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  extension: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['profile', 'resume', 'portfolio', 'company', 'job', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// İndeksler
fileSchema.index({ name: 1 });
fileSchema.index({ type: 1 });
fileSchema.index({ category: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ createdAt: -1 });

// Sanal alanlar
fileSchema.virtual('uploaderDetails', {
  ref: 'User',
  localField: 'uploadedBy',
  foreignField: '_id',
  justOne: true,
});

// Metodlar
fileSchema.methods.toJSON = function() {
  const file = this.toObject();
  delete file.__v;
  return file;
};

fileSchema.methods.updateStatus = async function(status) {
  this.status = status;
  await this.save();
};

fileSchema.methods.updateMetadata = async function(metadata) {
  this.metadata = {
    ...this.metadata,
    ...metadata,
  };
  await this.save();
};

const File = mongoose.model('File', fileSchema);

module.exports = File; 