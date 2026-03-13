const { validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken, hashPassword, comparePassword, sanitizeUser } = require('../utils/helpers');
const { PERMISSIONS } = require('../middleware/rbac.middleware');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, name, phone, address } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await db.findOne('users', { email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.create('users', {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      phone,
      address: address || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // No token - user must login after registration
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login to continue.',
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

  exports.registerFromWebhook = async (req, res, next) => {
    try {
      const { email, name, phone, secret_token, isRetry } = req.body;
  
      // Basic security check (Token should match ENV or a hardcoded string for simple usage)
      const EXPECTED_TOKEN = process.env.WEBHOOK_SECRET || 'sen_webhook_secret_2026';
      if (secret_token !== EXPECTED_TOKEN) {
        return res.status(403).json({ success: false, message: 'Invalid secret token' });
      }
  
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
  
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await db.findOne('users', { email: normalizedEmail });
      
      if (existingUser) {
        if (isRetry) {
          // NẾU TÀI KHOẢN ĐÃ TỒN TẠI VÀ CHẠY GOOGLE RETRY (Do rớt mạng lúc Gửi Form Google)
          // -> TIẾN HÀNH RESET LẠI MẬT KHẨU MỚI TINH, LƯU VÀO DB VÀ TRẢ VỀ ĐỂ GOOGLE SCRIPT GỬI MAIL BÙ CHO KHÁCH CŨ
          const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
          const generatedPassword = `SEN-${randomChars}`;
          const hashedPassword = await hashPassword(generatedPassword);
          
          await db.update('users', existingUser.id, {
            password: hashedPassword
          });
          
          return res.status(200).json({ 
            success: true, 
            message: 'User already exists, password reset and re-sent via webhook', 
            isNew: false, 
            email: normalizedEmail, 
            randomPassword: generatedPassword 
          });
        }
        
        // CÒN NẾU TÀI KHOẢN TỒN TẠI RỒI NHƯNG KHÁCH VẪN BẤM FORM SUBMIT TIẾP (Spam Form / Lỗi Nhớ Sai Email)
        // -> THÌ BUNG MÃ TRẢ VỀ RỖNG isNew: false, KHÔNG NẠP MẬT KHẨU, ĐỂ TOOL GOOGLE SCRIPT TÁNG NGAY QUẢ MAIL CẢNH BÁO TỒN TẠI VÔ MẶT KHÁCH
        return res.status(200).json({ success: true, message: 'User already exists, skipped', isNew: false });
      }
  
      // TẠO MẬT KHẨU RANDOM CHO NGƯỜI MỚI TOANH: SEN-XXXX (X gồm số và chữ cái)
      const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedPassword = `SEN-${randomChars}`;
      
      const hashedPassword = await hashPassword(generatedPassword);
  
      const user = await db.create('users', {
        email: normalizedEmail,
        password: hashedPassword,
        name: name || normalizedEmail.split('@')[0],
        phone: phone || '0000000000',
      address: '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || normalizedEmail.split('@')[0])}&background=random`,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // ÉP THÊM 'randomPassword' VÀO RESPONSE ĐỂ GOOGLE SCRIPT LẤY ĐƯỢC MẬT KHẨU GỐC GỬI CHO KHÁCH
    res.status(201).json({ success: true, message: 'User created successfully', isNew: true, email: normalizedEmail, randomPassword: generatedPassword });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db.findOne('users', { email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await db.update('users', user.id, {
      lastLogin: new Date().toISOString()
    });

    // Load latest user from DB
    const updatedUser = await db.findById('users', user.id);

    // Generate token
    const token = generateToken(updatedUser.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...sanitizeUser(updatedUser),
          permissions: PERMISSIONS[updatedUser.role] || {}
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        ...sanitizeUser(req.user),
        permissions: PERMISSIONS[req.user.role] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // ✅ Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // ✅ Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // ✅ Prevent same password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Check current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.update('users', user.id, {
      password: hashedPassword
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};