import User from '@/models/User';

export const authController = {
  /**
   * Register a new user
   */
  register: async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
      });

      await user.save();

      // Return user data without password
      const userObj = user.toObject();
      const { password: _, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  /**
   * Login user with email and password
   */
  login: async (email: string, password: string) => {
    try {
      // Find user by email with password field selected
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Return user data without password
      const userObj = user.toObject();
      const { password: _, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userObj = user.toObject();
      const { password: _, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  },

  /**
   * Update user password
   */
  updatePassword: async (userId: string, oldPassword: string, newPassword: string) => {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isPasswordValid = await user.comparePassword(oldPassword);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      const userObj = user.toObject();
      const { password: _, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  },
};
