import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmailOTP from '../models/EmailOTP.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { generateToken } from '../utils/generateToken.js';
import { generateOTP, hashOTP, compareOTP } from '../utils/generateOTP.js';
import { sendEmail } from '../utils/sendEmail.js';
import { runBrevoDiagnostic } from '../utils/brevoDiagnostic.js';
import { sendWhatsAppOTP } from '../utils/whatsappNotification.js';

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const findUserByNormalizedEmail = async (email, includePassword = false) => {
  if (!email || typeof email !== 'string') return null;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const query = {
    $or: [
      { email: normalizedEmail },
      { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      {
        email: {
          $in: [
            normalizedEmail.replace('@shoping.com', '@smartcart.ai'),
            normalizedEmail.replace('@smartcart.ai', '@shoping.com'),
          ],
        },
      },
      {
        $expr: {
          $eq: [{ $toLower: { $trim: { input: '$email' } } }, normalizedEmail],
        },
      },
    ],
  };

  let userQuery = User.findOne(query);
  if (includePassword) {
    userQuery = userQuery.select('+password');
  }
  let user = await userQuery;

  if (user) return user;

  // Fallback: check if user registered and is waiting in PendingRegistration
  try {
    const pending = await PendingRegistration.findOne({
      $or: [
        { email: normalizedEmail },
        { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        {
          $expr: {
            $eq: [{ $toLower: { $trim: { input: '$email' } } }, normalizedEmail],
          },
        },
      ],
    });

    if (pending) {
      user = new User({
        name: pending.name,
        email: normalizedEmail,
        phone: pending.phone || '',
        password: pending.passwordHash,
        isVerified: false,
        role: 'customer',
      });
      user.$locals.passwordIsHashed = true;
      await user.save();
      await PendingRegistration.deleteOne({ _id: pending._id }).catch(() => {});
      if (includePassword) {
        user = await User.findById(user._id).select('+password');
      }
      return user;
    }
  } catch (err) {
    console.warn('PendingRegistration lookup fallback warning:', err.message);
  }

  return null;
};

const isDatabaseUnavailable = (error) => (
  mongoose.connection.readyState !== 1 ||
  ['MongoNetworkError', 'MongoNotConnectedError', 'MongoServerSelectionError', 'MongooseServerSelectionError'].includes(error?.name)
);

const sendDatabaseUnavailable = (res) => res.status(503).json({
  success: false,
  message: 'The database is temporarily unavailable. Please try again shortly.',
});

const sendRegistrationError = (res, error) => {
  console.error('Registration request failed:', {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
  });

  if (error?.name === 'ValidationError') {
    const messages = Object.values(error.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation error',
      errors: messages,
    });
  }

  if (error?.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
    return res.status(409).json({
      success: false,
      message: 'A registration request for this email is already in progress. Please verify the code already sent or try signing in.',
    });
  }

  if (isDatabaseUnavailable(error)) {
    return sendDatabaseUnavailable(res);
  }

  const statusCode = error?.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error?.message || 'We could not complete registration. Please try again.',
    stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
  });
};

const getCooldownResponse = (res, pending) => {
  const cooldown = Math.max(1, Math.ceil((pending.resendCooldown.getTime() - Date.now()) / 1000));
  return res.status(429).json({
    success: false,
    requiresVerification: true,
    email: pending.email,
    cooldown,
    message: `A verification code has already been sent. Please wait ${cooldown} seconds or use the code in your email.`,
  });
};

/**
 * Send OTP standalone endpoint (e.g. for registration pre-verification or email verification)
 * POST /api/auth/send-otp
 */
export const sendOTP = async (req, res) => {
  try {
    const { email, name, purpose = 'verification' } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (purpose === 'verification') {
      const existingUser = await User.findOne({ email: normalizedEmail, isVerified: true });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An active account already exists with this email. Please login.',
        });
      }
    }

    // Rate-limiting check for existing active cooldown (60s)
    const activeCooldown = await EmailOTP.findOne({
      email: normalizedEmail,
      purpose,
      resendCooldown: { $gt: new Date() },
    });

    if (activeCooldown) {
      const remainingSeconds = Math.ceil((activeCooldown.resendCooldown.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `An OTP was already sent. Please wait ${remainingSeconds} seconds before requesting again.`,
        cooldown: remainingSeconds,
        email: normalizedEmail,
      });
    }

    // Generate random 6-digit OTP and store hashed version in DB
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    // Invalidate old OTPs for this email and purpose
    await EmailOTP.deleteMany({ email: normalizedEmail, purpose });

    // Store hashed OTP with 5 minute expiration and 60-second cooldown
    await EmailOTP.create({
      email: normalizedEmail,
      otp: hashedOtp,
      purpose,
      attempts: 0,
      resendCooldown: new Date(Date.now() + 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send email via Gmail SMTP / Nodemailer
    await sendEmail({
      to: normalizedEmail,
      otp,
      purpose,
      name: name || 'Customer',
    });

    res.status(200).json({
      success: true,
      message: 'Verification OTP has been sent to your email address.',
      email: normalizedEmail,
      cooldown: 60,
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return sendDatabaseUnavailable(res);
    console.error('OTP request failed:', error.name, error.code || '');
    return res.status(500).json({
      success: false,
      message: 'Unable to process the verification request right now. Please try again shortly.',
    });
  }
};

/**
 * Register User
 * Saves user permanently in MongoDB with hashed password and returns active session.
 * POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is temporarily initializing or unavailable. Please try again shortly.',
      });
    }

    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // 1. Check whether an account with this email already exists
    const existingUser = await findUserByNormalizedEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      });
    }

    // 2. Create the user permanently in MongoDB (password hashed cleanly by User pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Password hashed securely with bcrypt in User model pre-save hook
      phone: typeof phone === 'string' ? phone.trim() : '',
      role: 'customer',
      isVerified: true,
    });

    // 3. Generate valid JWT Token
    const token = generateToken(user._id);

    // 4. Set secure HTTP-only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // 5. Send welcome email/notification in background (non-blocking)
    try {
      sendEmail({
        to: normalizedEmail,
        purpose: 'welcome',
        name: user.name,
      }).catch((emailErr) => console.warn('Welcome email non-fatal notice:', emailErr.message));
    } catch (ignore) {}

    // Clean up any stale OTP or pending registrations for this email
    await Promise.all([
      PendingRegistration.deleteMany({ email: normalizedEmail }).catch(() => {}),
      EmailOTP.deleteMany({ email: normalizedEmail }).catch(() => {}),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Shoping.com.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        addresses: user.addresses,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    sendRegistrationError(res, error);
  }
};

/**
 * Verify Email OTP (Registration or Password Reset)
 * POST /api/auth/verify-otp
 */
export const verifyOTP = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return sendDatabaseUnavailable(res);
    }

    const { email, otp, purpose = 'verification' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit numeric OTP' });
    }

    if (purpose === 'verification') {
      const pending = await PendingRegistration.findOne({
        email: normalizedEmail,
        consumedAt: null,
      });

      if (pending) {
        const now = new Date();
        if (pending.expiresAt <= now) {
          return res.status(400).json({
            success: false,
            message: 'This verification code has expired. Please request a new code.',
          });
        }

        if (pending.attempts >= 5) {
          await PendingRegistration.deleteOne({ _id: pending._id });
          return res.status(400).json({
            success: false,
            message: 'Too many incorrect attempts. Please register again to request a new code.',
          });
        }

        const isMatch = await compareOTP(cleanOtp, pending.otpHash);
        if (!isMatch) {
          const updatedPending = await PendingRegistration.findOneAndUpdate(
            { _id: pending._id, otpHash: pending.otpHash, attempts: { $lt: 5 } },
            { $inc: { attempts: 1 } },
            { new: true }
          );
          if (updatedPending?.attempts >= 5) {
            await PendingRegistration.deleteOne({ _id: pending._id });
            return res.status(400).json({
              success: false,
              message: 'Too many incorrect attempts. Please register again to request a new code.',
            });
          }
          const remaining = Math.max(0, 5 - (updatedPending?.attempts || 5));
          return res.status(400).json({
            success: false,
            message: `Incorrect OTP code. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
          });
        }

        const consumed = await PendingRegistration.findOneAndUpdate(
          {
            _id: pending._id,
            otpHash: pending.otpHash,
            consumedAt: null,
            expiresAt: { $gt: now },
          },
          { $set: { consumedAt: now } },
          { new: true }
        );
        if (!consumed) {
          return res.status(400).json({
            success: false,
            message: 'This verification code has expired or has already been used. Please request a new code.',
          });
        }

        let user;
        try {
          user = await findUserByNormalizedEmail(normalizedEmail);
          if (user?.isVerified) {
            await PendingRegistration.deleteOne({ _id: pending._id });
            return res.status(409).json({
              success: false,
              message: 'An account with this email is already registered. Please sign in instead.',
            });
          }

          if (!user) {
            user = new User({
              name: pending.name,
              email: normalizedEmail,
              phone: pending.phone,
              password: pending.passwordHash,
              role: 'customer',
              isVerified: true,
            });
          } else {
            user.name = pending.name;
            user.email = normalizedEmail;
            user.phone = pending.phone;
            user.password = pending.passwordHash;
            user.isVerified = true;
          }
          user.$locals.passwordIsHashed = true;
          await user.save();
        } catch (error) {
          if (error.code === 11000) {
            const existingUser = await findUserByNormalizedEmail(normalizedEmail);
            if (existingUser?.isVerified) {
              await PendingRegistration.deleteOne({ _id: pending._id });
              return res.status(409).json({
                success: false,
                message: 'An account with this email is already registered. Please sign in instead.',
              });
            }
          }
          await PendingRegistration.updateOne(
            { _id: pending._id, consumedAt: now },
            { $set: { consumedAt: null } }
          );
          throw error;
        }

        await PendingRegistration.deleteOne({ _id: pending._id });
        await EmailOTP.deleteMany({ email: normalizedEmail, purpose: 'verification' });
        const token = generateToken(user._id);
        return res.json({
          success: true,
          message: 'Email verified successfully! Welcome to Shopping.com.',
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            addresses: user.addresses,
            isVerified: user.isVerified,
          },
        });
      }
    }

    // Find the latest active OTP for this email and purpose (must not be expired)
    const otpRecord = await EmailOTP.findOne({
      email: normalizedEmail,
      purpose,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new verification code.',
      });
    }

    // Check attempt limits (max 5)
    if (otpRecord.attempts >= 5) {
      await EmailOTP.deleteMany({ email: normalizedEmail, purpose });
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. This code has been invalidated. Please request a new OTP.',
      });
    }

    // Compare entered OTP with hashed OTP
    const isMatch = await compareOTP(cleanOtp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP code. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
      });
    }

    // OTP is valid! Handle purpose
    if (purpose === 'verification') {
      const user = await findUserByNormalizedEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.email = normalizedEmail;
      user.isVerified = true;
      await user.save();

      // Clean up OTP records
      await EmailOTP.deleteMany({ email: normalizedEmail, purpose: 'verification' });

      // Generate JWT and log user in immediately
      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Email verified successfully! Welcome to Shopping.com.',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          addresses: user.addresses,
          isVerified: user.isVerified,
        },
      });
    } else if (purpose === 'password_reset') {
      return res.json({
        success: true,
        message: 'OTP verified successfully. You may now enter your new password.',
        email: normalizedEmail,
        verified: true,
      });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification failed:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    if (isDatabaseUnavailable(error)) return sendDatabaseUnavailable(res);
    res.status(500).json({
      success: false,
      message: error.message || 'OTP verification encountered an internal error. Please try again.',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
};

/**
 * Resend OTP with 60-second Cooldown & Rate Limiting
 * POST /api/auth/resend-otp
 */
export const resendOTP = async (req, res) => {
  try {
    const { email, purpose = 'verification' } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await findUserByNormalizedEmail(normalizedEmail);
    if (purpose === 'verification' && user?.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please login.' });
    }

    if (purpose === 'verification') {
      const pending = await PendingRegistration.findOne({
        email: normalizedEmail,
        consumedAt: null,
      });

      if (pending) {
        const now = new Date();
        if (pending.resendCooldown > now && pending.expiresAt > now) {
          return getCooldownResponse(res, pending);
        }

        const otp = generateOTP();
        const otpHash = await hashOTP(otp);
        const updatedPending = await PendingRegistration.findOneAndUpdate(
          {
            _id: pending._id,
            consumedAt: null,
            $or: [
              { resendCooldown: { $lte: now } },
              { expiresAt: { $lte: now } },
            ],
          },
          {
            $set: {
              otpHash,
              attempts: 0,
              resendCooldown: new Date(now.getTime() + 60 * 1000),
              expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
            },
          },
          { new: true }
        );

        if (!updatedPending) {
          const currentPending = await PendingRegistration.findOne({ email: normalizedEmail });
          if (currentPending?.resendCooldown > now) return getCooldownResponse(res, currentPending);
          return res.status(400).json({
            success: false,
            message: 'This registration has expired. Please submit the registration form again.',
          });
        }

        try {
          await sendEmail({
            to: normalizedEmail,
            otp,
            purpose,
            name: updatedPending.name,
          });
        } catch (emailErr) {
          console.error('Registration OTP resend email delivery failed:', emailErr.name, emailErr.code || '');
          await PendingRegistration.deleteOne({ _id: updatedPending._id, otpHash });
          return res.status(502).json({
            success: false,
            message: 'We could not send the verification email. Please try again later.',
          });
        }

        if (updatedPending.phone) {
          sendWhatsAppOTP({
            phone: updatedPending.phone,
            otp,
            purpose,
            name: updatedPending.name,
          }).catch((waErr) => console.warn('WhatsApp resend OTP dispatch error:', waErr.message));
        }

        return res.json({
          success: true,
          message: 'We have sent a fresh 6-digit verification code to your email.',
          cooldown: 60,
        });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email' });
    }

    // Check resend cooldown
    const existingOtp = await EmailOTP.findOne({
      $or: [{ email: normalizedEmail }, { email: user.email }],
      purpose,
      resendCooldown: { $gt: new Date() },
    });

    if (existingOtp) {
      const waitSeconds = Math.ceil((existingOtp.resendCooldown.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        cooldown: waitSeconds,
      });
    }

    // Generate fresh secure 6-digit OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    // Remove old OTPs for this email and purpose
    await EmailOTP.deleteMany({
      $or: [{ email: normalizedEmail }, { email: user.email }],
      purpose,
    });

    // Store new hashed OTP
    await EmailOTP.create({
      email: user.email,
      otp: hashedOtp,
      purpose,
      attempts: 0,
      resendCooldown: new Date(Date.now() + 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send transactional email
    try {
      await sendEmail({
        to: user.email,
        otp,
        purpose,
        name: user.name,
      });
    } catch (emailErr) {
      await EmailOTP.deleteMany({
        $or: [{ email: normalizedEmail }, { email: user.email }],
        purpose,
      });
      return res.status(500).json({
        success: false,
        message: emailErr.message || 'Failed to resend verification code.',
      });
    }

    if (user.phone) {
      sendWhatsAppOTP({
        phone: user.phone,
        otp,
        purpose,
        name: user.name,
      }).catch((waErr) => console.warn('WhatsApp resend OTP dispatch error:', waErr.message));
    }

    res.json({
      success: true,
      message: 'We have sent a 6-digit verification code to your email and WhatsApp.',
      cooldown: 60,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Login User
 * Authenticates user with email and password, creates session & sets secure cookie
 * POST /api/auth/login
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // 1. Locate user in MongoDB (with password selected)
    const user = await findUserByNormalizedEmail(normalizedEmail, true);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Compare password securely with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Ensure account is active / verified (auto-heal any prior unverified status)
    if (user.isVerified === false) {
      user.isVerified = true;
      await user.save();
    }

    // 4. Generate valid JWT Token
    const token = generateToken(user._id);

    // 5. Set secure HTTP-only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        addresses: user.addresses,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return sendDatabaseUnavailable(res);
    console.error('Login request failed:', error.name, error.code || '', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to sign in right now. Please try again shortly.',
    });
  }
};

/**
 * Get Current Logged-in User
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        addresses: user.addresses,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return sendDatabaseUnavailable(res);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Logout User
 * Clears authentication cookie
 * POST /api/auth/logout
 */
export const logoutUser = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * Forgot Password - Send 6-Digit Reset OTP
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return sendDatabaseUnavailable(res);
    }

    const rawEmail = req.body?.email || req.body?.userEmail || req.body?.emailAddress || (typeof req.body === 'string' ? req.body : '');

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide your registered email' });
    }

    const normalizedEmail = normalizeEmail(rawEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const user = await findUserByNormalizedEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address' });
    }

    // Check cooldown on both normalized input and canonical stored user.email
    const activeCooldown = await EmailOTP.findOne({
      $or: [
        { email: normalizedEmail, purpose: 'password_reset' },
        { email: user.email, purpose: 'password_reset' },
      ],
      resendCooldown: { $gt: new Date() },
    });

    if (activeCooldown) {
      const remainingSeconds = Math.ceil((activeCooldown.resendCooldown.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting another reset code.`,
        cooldown: remainingSeconds,
      });
    }

    // Generate 6-digit reset OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await EmailOTP.deleteMany({
      $or: [{ email: normalizedEmail }, { email: user.email }],
      purpose: 'password_reset',
    });

    await EmailOTP.create({
      email: user.email,
      otp: hashedOtp,
      purpose: 'password_reset',
      attempts: 0,
      resendCooldown: new Date(Date.now() + 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      await sendEmail({
        to: user.email,
        otp,
        purpose: 'password_reset',
        name: user.name,
      });
    } catch (emailErr) {
      await EmailOTP.deleteMany({
        $or: [{ email: normalizedEmail }, { email: user.email }],
        purpose: 'password_reset',
      });
      return res.status(500).json({
        success: false,
        message: emailErr.message || 'Failed to send password reset code.',
      });
    }

    if (user.phone) {
      sendWhatsAppOTP({
        phone: user.phone,
        otp,
        purpose: 'password_reset',
        name: user.name,
      }).catch((waErr) => console.warn('WhatsApp forgot password OTP error:', waErr.message));
    }

    res.json({
      success: true,
      message: 'We have sent a 6-digit password reset code to your email and WhatsApp.',
      cooldown: 60,
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return sendDatabaseUnavailable(res);
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset Password using 6-Digit OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return sendDatabaseUnavailable(res);
    }

    const { email, otp, newPassword: rawNewPassword, password, confirmPassword } = req.body;
    const newPassword = rawNewPassword || password;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, 6-digit OTP, and your new password',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = normalizeEmail(email);
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit numeric OTP' });
    }

    // Find user using robust lookup across User model
    const user = await findUserByNormalizedEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpRecord = await EmailOTP.findOne({
      $or: [
        { email: normalizedEmail, purpose: 'password_reset' },
        { email: user.email, purpose: 'password_reset' },
      ],
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code. Please request a new password reset.',
      });
    }

    if (otpRecord.attempts >= 5) {
      await EmailOTP.deleteMany({
        $or: [{ email: normalizedEmail }, { email: user.email }],
        purpose: 'password_reset',
      });
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new reset code.',
      });
    }

    const isMatch = await compareOTP(cleanOtp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
      });
    }

    // OTP matched! Update password and verify account
    user.password = newPassword;
    user.$locals.passwordIsHashed = false;
    user.isVerified = true;
    await user.save();

    // Delete OTP records for password_reset
    await EmailOTP.deleteMany({
      $or: [{ email: normalizedEmail }, { email: user.email }],
      purpose: 'password_reset',
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return sendDatabaseUnavailable(res);
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        addresses: user.addresses,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);

    res.json({
      success: true,
      token,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'All address fields are required' });
    }

    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push({
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: isDefault || user.addresses.length === 0,
    });

    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.addressId
    );
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Brevo Diagnostic: Check live status and sender verification
 */
export const checkBrevoStatus = async (req, res) => {
  try {
    const report = await runBrevoDiagnostic();
    res.json({ success: report.overallSuccess, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Brevo Diagnostic: Trigger live real test email and inspect delivery
 */
export const triggerBrevoTest = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || req.user?.email || process.env.BREVO_SENDER_EMAIL || '').trim();
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Please provide a recipient email' });
    }
    const report = await runBrevoDiagnostic(targetEmail);
    res.json({ success: report.overallSuccess, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * WhatsApp Meta Cloud API Diagnostic: Check connection and credentials status
 */
export const checkWhatsAppStatus = async (req, res) => {
  try {
    const token = (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '').trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    const apiVersion = (process.env.WHATSAPP_API_VERSION || 'v21.0').trim();

    if (!token || !phoneNumberId) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'Meta WhatsApp credentials are not configured in server/.env',
      });
    }

    const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=id,verified_name,display_phone_number,quality_rating,status`;
    const metaRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const metaData = await metaRes.json();

    if (metaRes.ok && metaData.id) {
      return res.json({
        success: true,
        configured: true,
        phoneDetails: metaData,
        message: `Connected to Meta WhatsApp Cloud API (${metaData.display_phone_number})`,
      });
    } else {
      return res.status(200).json({
        success: false,
        configured: true,
        error: metaData.error || metaData,
        message: metaData.error?.message || 'Meta API returned error',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * WhatsApp Diagnostic: Send live test OTP to any phone number
 */
export const triggerWhatsAppTest = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a recipient phone number with country code (e.g. +91 98765 43210)',
      });
    }

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendWhatsAppOTP({
      phone,
      otp: testOtp,
      purpose: 'verification',
      name: 'Valued Customer',
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `WhatsApp OTP (${testOtp}) dispatched successfully! Message ID: ${result.messageId}`,
        otp: testOtp,
        recipient: phone,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error?.message || result.reason || 'Failed to dispatch WhatsApp OTP',
        error: result.error,
        details:
          result.error?.error_data?.details ||
          'In Meta Development Mode, recipient phone number must be added to Allowed Phone Numbers list in Meta Developer Portal (WhatsApp > API Setup)',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
