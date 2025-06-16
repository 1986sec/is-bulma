import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    employer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    matchFactors: {
      skills: {
        match: Number,
        required: Number,
        matched: [String],
        missing: [String],
      },
      experience: {
        match: Number,
        required: String,
        candidate: String,
      },
      education: {
        match: Number,
        required: String,
        candidate: String,
      },
      location: {
        match: Number,
        required: String,
        candidate: String,
      },
    },
    notes: String,
    viewedByEmployer: {
      type: Boolean,
      default: false,
    },
    viewedByCandidate: {
      type: Boolean,
      default: false,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
matchSchema.index({ job: 1, candidate: 1 }, { unique: true });
matchSchema.index({ employer: 1, status: 1 });
matchSchema.index({ candidate: 1, status: 1 });
matchSchema.index({ score: -1 });
matchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Calculate match score
matchSchema.methods.calculateScore = function () {
  const factors = this.matchFactors;
  const weights = {
    skills: 0.4,
    experience: 0.25,
    education: 0.2,
    location: 0.15,
  };

  this.score = Math.round(
    factors.skills.match * weights.skills +
      factors.experience.match * weights.experience +
      factors.education.match * weights.education +
      factors.location.match * weights.location
  );

  return this.score;
};

// Check if match is expired
matchSchema.methods.isExpired = function () {
  return this.expiresAt && Date.now() > this.expiresAt;
};

// Update match status
matchSchema.methods.updateStatus = function (status) {
  this.status = status;
  if (status === 'accepted' || status === 'rejected') {
    this.expiresAt = undefined;
  }
  return this.save();
};

// Mark as viewed by employer
matchSchema.methods.markAsViewedByEmployer = function () {
  this.viewedByEmployer = true;
  return this.save();
};

// Mark as viewed by candidate
matchSchema.methods.markAsViewedByCandidate = function () {
  this.viewedByCandidate = true;
  return this.save();
};

// Create match
matchSchema.statics.createMatch = async function (
  jobId,
  candidateId,
  employerId,
  matchFactors
) {
  const match = await this.create({
    job: jobId,
    candidate: candidateId,
    employer: employerId,
    matchFactors,
  });

  match.calculateScore();
  return match.save();
};

// Get matches for job
matchSchema.statics.getJobMatches = async function (jobId, options = {}) {
  const query = { job: jobId };
  if (options.status) query.status = options.status;
  if (options.minScore) query.score = { $gte: options.minScore };

  return await this.find(query)
    .sort({ score: -1 })
    .populate('candidate', 'name email avatar title company')
    .limit(options.limit || 10);
};

// Get matches for candidate
matchSchema.statics.getCandidateMatches = async function (
  candidateId,
  options = {}
) {
  const query = { candidate: candidateId };
  if (options.status) query.status = options.status;
  if (options.minScore) query.score = { $gte: options.minScore };

  return await this.find(query)
    .sort({ score: -1 })
    .populate('job', 'title company location type')
    .populate('employer', 'name company')
    .limit(options.limit || 10);
};

export const Match = mongoose.model('Match', matchSchema); 