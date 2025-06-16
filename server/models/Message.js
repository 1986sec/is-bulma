const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  file: {
    url: String,
    name: String,
    type: String,
    size: Number,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
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
messageSchema.index({ conversation: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ read: 1 });
messageSchema.index({ deleted: 1 });

// Sanal alanlar
messageSchema.virtual('senderDetails', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true,
});

messageSchema.virtual('receiverDetails', {
  ref: 'User',
  localField: 'receiver',
  foreignField: '_id',
  justOne: true,
});

// Metodlar
messageSchema.methods.toJSON = function() {
  const message = this.toObject();
  delete message.__v;
  return message;
};

messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

messageSchema.methods.markAsDeleted = async function() {
  if (!this.deleted) {
    this.deleted = true;
    this.deletedAt = new Date();
    await this.save();
  }
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 