import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'company', 'admin'],
    default: 'user',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  profile: {
    title: String,
    bio: String,
    location: String,
    skills: [String],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      description: String
    }],
    education: [{
      school: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date
    }],
    languages: [{
      name: String,
      level: String
    }],
    socialLinks: {
      linkedin: String,
      github: String,
      website: String
    }
  },
  preferences: {
    jobAlerts: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      },
      categories: [String],
      locations: [String]
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      }
    }
  },
  lastLogin: Date,
  lastActive: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// İndeksler
userSchema.index({ 'profile.skills': 1 });
userSchema.index({ 'profile.location': 1 });
userSchema.index({ 'preferences.jobAlerts.categories': 1 });
userSchema.index({ 'preferences.jobAlerts.locations': 1 });
userSchema.index({ firstName: 1, lastName: 1 });

// Şifre hashleme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Kullanıcı durumunu güncelleme metodu
userSchema.methods.updateStatus = async function(status) {
  this.status = status;
  return this.save();
};

// Profil güncelleme metodu
userSchema.methods.updateProfile = async function(profileData) {
  Object.assign(this.profile, profileData);
  return this.save();
};

// Tercihleri güncelleme metodu
userSchema.methods.updatePreferences = async function(preferencesData) {
  Object.assign(this.preferences, preferencesData);
  return this.save();
};

// Son aktivite güncelleme metodu
userSchema.methods.updateLastActive = async function() {
  this.lastActive = new Date();
  return this.save();
};

// Virtual for jobs posted by employer
userSchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'employer',
  justOne: false,
});

// Virtual for job applications
userSchema.virtual('applications', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'applicants',
  justOne: false,
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  return verificationToken;
};

const User = mongoose.model('User', userSchema);

export default User; 