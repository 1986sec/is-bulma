import mongoose from 'mongoose';
const { Schema } = mongoose;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    default: null,
  },
  cover: {
    type: String,
    default: null,
  },
  website: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  industry: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10',
  },
  founded: {
    type: Number,
    default: null,
  },
  type: {
    type: String,
    enum: ['company', 'agency', 'startup'],
    default: 'company',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  social: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
  },
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
    privacy: {
      profile: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public',
      },
      jobs: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public',
      },
    },
  },
  stats: {
    jobs: {
      total: {
        type: Number,
        default: 0,
      },
      active: {
        type: Number,
        default: 0,
      },
      closed: {
        type: Number,
        default: 0,
      },
    },
    applications: {
      total: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      accepted: {
        type: Number,
        default: 0,
      },
      rejected: {
        type: Number,
        default: 0,
      },
    },
    views: {
      total: {
        type: Number,
        default: 0,
      },
      today: {
        type: Number,
        default: 0,
      },
      week: {
        type: Number,
        default: 0,
      },
      month: {
        type: Number,
        default: 0,
      },
    },
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
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ location: '2dsphere' });
companySchema.index({ status: 1 });
companySchema.index({ verified: 1 });
companySchema.index({ featured: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ type: 1 });
companySchema.index({ createdBy: 1 });

// Sanal alanlar
companySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company',
});

companySchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'company',
});

// Middleware
companySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Metodlar
companySchema.methods.toJSON = function() {
  const company = this.toObject();
  delete company.__v;
  return company;
};

companySchema.methods.incrementViews = async function() {
  this.views += 1;
  this.stats.views.total += 1;
  this.stats.views.today += 1;
  this.stats.views.week += 1;
  this.stats.views.month += 1;
  await this.save();
};

companySchema.methods.updateStats = async function() {
  const Job = mongoose.model('Job');
  const Application = mongoose.model('Application');

  const [jobs, applications] = await Promise.all([
    Job.find({ company: this._id }),
    Application.find({ company: this._id }),
  ]);

  this.stats.jobs.total = jobs.length;
  this.stats.jobs.active = jobs.filter(job => job.status === 'active').length;
  this.stats.jobs.closed = jobs.filter(job => job.status === 'closed').length;

  this.stats.applications.total = applications.length;
  this.stats.applications.pending = applications.filter(app => app.status === 'pending').length;
  this.stats.applications.accepted = applications.filter(app => app.status === 'accepted').length;
  this.stats.applications.rejected = applications.filter(app => app.status === 'rejected').length;

  await this.save();
};

const Company = mongoose.model('Company', companySchema);

export default Company; 