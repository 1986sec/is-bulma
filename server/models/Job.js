import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please provide a job type'],
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
      minlength: [50, 'Description must be at least 50 characters'],
    },
    requirements: {
      type: [String],
      required: [true, 'Please provide job requirements'],
    },
    responsibilities: {
      type: [String],
      required: [true, 'Please provide job responsibilities'],
    },
    salary: {
      min: {
        type: Number,
        required: [true, 'Please provide minimum salary'],
      },
      max: {
        type: Number,
        required: [true, 'Please provide maximum salary'],
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    benefits: [String],
    skills: [String],
    experience: {
      type: String,
      required: [true, 'Please provide required experience'],
      enum: ['entry', 'junior', 'mid', 'senior', 'lead'],
    },
    education: {
      type: String,
      required: [true, 'Please provide required education'],
      enum: ['high-school', 'associate', 'bachelor', 'master', 'phd'],
    },
    employer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
          default: 'pending',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        resume: String,
        coverLetter: String,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Please provide an expiration date'],
    },
    views: {
      type: Number,
      default: 0,
    },
    applications: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create index for search
jobSchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
  location: 'text',
  skills: 'text',
});

// Virtual for time remaining
jobSchema.virtual('timeRemaining').get(function () {
  return this.expiresAt - Date.now();
});

// Check if job is expired
jobSchema.methods.isExpired = function () {
  return Date.now() > this.expiresAt;
};

// Check if job is active
jobSchema.methods.isActive = function () {
  return this.status === 'published' && !this.isExpired();
};

// Check if user has already applied
jobSchema.methods.hasApplied = function (userId) {
  return this.applicants.some(
    (applicant) => applicant.user.toString() === userId.toString()
  );
};

// Add application
jobSchema.methods.addApplication = function (userId, resume, coverLetter) {
  if (this.hasApplied(userId)) {
    throw new Error('You have already applied for this job');
  }

  this.applicants.push({
    user: userId,
    resume,
    coverLetter,
  });

  this.applications += 1;
  return this.save();
};

// Update application status
jobSchema.methods.updateApplicationStatus = function (userId, status) {
  const application = this.applicants.find(
    (applicant) => applicant.user.toString() === userId.toString()
  );

  if (!application) {
    throw new Error('Application not found');
  }

  application.status = status;
  return this.save();
};

export const Job = mongoose.model('Job', jobSchema); 