const AuthService = require('../services/auth-service');
const { StatusCodes } = require('http-status-codes');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, fullName, username } = req.body;

      // Basic validation
      if (!email || !password || !fullName) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Email, password, and full name are required'
        });
      }

      if (password.length < 6) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const result = await AuthService.register({
        email,
        password,
        fullName,
        username
      });

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await AuthService.login(email, password);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await AuthService.getUserProfile(req.user.id);

      res.status(StatusCodes.OK).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { fullName, username } = req.body;
      
      const user = await AuthService.updateProfile(req.user.id, {
        full_name: fullName,
        username
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      const result = await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();