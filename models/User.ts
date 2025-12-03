import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// TypeScript interface for User document
interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string; // Cloudinary URL
  cloudinaryProfilePictureId?: string; // Cloudinary public ID for deletion
  googleId?: string; // Google OAuth ID
  githubId?: string; // GitHub OAuth ID
  authProvider?: 'local' | 'google' | 'github'; // Authentication provider
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    cloudinaryProfilePictureId: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true, // Allow multiple null values but unique non-null values
    },
    githubId: {
      type: String,
      default: null,
      sparse: true, // Allow multiple null values but unique non-null values
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export the model
const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
