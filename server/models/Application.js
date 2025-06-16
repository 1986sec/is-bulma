const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'],
    default: 'pending',
  },
  coverLetter: {
    type: String,
    required: true,
  },
  resume: {
    type: String,
    required: true,
  },
  portfolio: {
    type: String,
    default: null,
  },
  experience: {
    type: Number,
    required: true,
  },
  expectedSalary: {
    type: Number,
    required: true,
  },
  availability: {
    type: String,
    enum: ['immediate', '1-week', '2-weeks', '1-month', 'custom'],
    default: 'immediate',
  },
  customAvailability: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },
  interview: {
    scheduled: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical', 'other'],
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  documents: [{
    type: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  viewed: {
    type: Boolean,
    default: false,
  },
  viewedAt: {
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
applicationSchema.index({ job: 1 });
applicationSchema.index({ company: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

// Sanal alanlar
applicationSchema.virtual('jobDetails', {
  ref: 'Job',
  localField: 'job',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('companyDetails', {
  ref: 'Company',
  localField: 'company',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('applicantDetails', {
  ref: 'User',
  localField: 'applicant',
  foreignField: '_id',
  justOne: true,
});

// Metodlar
applicationSchema.methods.toJSON = function() {
  const application = this.toObject();
  delete application.__v;
  return application;
};

applicationSchema.methods.markAsViewed = async function() {
  if (!this.viewed) {
    this.viewed = true;
    this.viewedAt = new Date();
    await this.save();
  }
};

applicationSchema.methods.updateStatus = async function(status, feedback = null) {
  this.status = status;
  if (feedback) {
    this.feedback = feedback;
  }
  await this.save();
};

applicationSchema.methods.scheduleInterview = async function(interviewData) {
  this.interview = {
    ...this.interview,
    ...interviewData,
    scheduled: true,
  };
  await this.save();
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application; 