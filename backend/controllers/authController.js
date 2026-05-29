const bcrypt = require('bcryptjs');
const supabase = require('../database/supabase');
const { generateToken } = require('../middleware/auth');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * POST /api/auth/register
 * Player registration only
 */
async function registerPlayer(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Format fields
    const formattedEmail = email.trim().toLowerCase();
    const formattedPhone = phone ? phone.replace(/\s+/g, '') : null;

    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', formattedEmail)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Save to Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: formattedEmail,
        phone: formattedPhone,
        password_hash: passwordHash,
        role: 'player'
      })
      .select('id, name, email, phone, role')
      .single();

    if (error) {
      console.error('Registration insert error:', error.message);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    return res.status(201).json({
      success: true,
      token,
      user: newUser
    });

  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

/**
 * POST /api/auth/login
 * Unified Login (Players & Admins)
 */
async function loginUser(req, res) {
  try {
    const { emailOrUsername, password, role } = req.body;

    if (!emailOrUsername || !password || !role) {
      return res.status(400).json({ error: 'Email/Username, password, and role are required' });
    }

    const formattedInput = emailOrUsername.trim().toLowerCase();

    // ─── ADMIN LOGIN FLOW ───
    if (role === 'admin') {
      // 1. Check fallback credentials from environment variables first
      const envUsernameMatch = formattedInput === ADMIN_USERNAME.toLowerCase();
      const envEmailMatch = formattedInput === 'admin@eagleboxcricket.com'; // custom fallback

      if ((envUsernameMatch || envEmailMatch) && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
        const token = generateToken({
          id: 'admin-env-id',
          name: 'Eagle Admin',
          email: 'admin@eagleboxcricket.com',
          role: 'admin'
        });
        return res.json({
          success: true,
          token,
          user: { id: 'admin-env-id', name: 'Eagle Admin', email: 'admin@eagleboxcricket.com', role: 'admin' }
        });
      }

      // 2. Otherwise check database for admin user
      const { data: dbAdmin } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${formattedInput},name.eq.${emailOrUsername}`)
        .eq('role', 'admin')
        .limit(1);

      const adminUser = dbAdmin?.[0];

      if (!adminUser) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const isPasswordValid = bcrypt.compareSync(password, adminUser.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const token = generateToken({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin'
      });

      return res.json({
        success: true,
        token,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'admin'
        }
      });
    }

    // ─── PLAYER LOGIN FLOW ───
    if (role === 'player') {
      const { data: playerUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', formattedInput)
        .eq('role', 'player')
        .single();

      if (error || !playerUser) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = bcrypt.compareSync(password, playerUser.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken({
        id: playerUser.id,
        name: playerUser.name,
        email: playerUser.email,
        role: 'player'
      });

      return res.json({
        success: true,
        token,
        user: {
          id: playerUser.id,
          name: playerUser.name,
          email: playerUser.email,
          role: 'player'
        }
      });
    }

    return res.status(400).json({ error: 'Invalid role' });

  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

/**
 * GET /api/auth/me
 * Get current profile from valid JWT
 */
async function getProfile(req, res) {
  try {
    const { id, role } = req.user;

    if (id === 'admin-env-id') {
      return res.json({
        id: 'admin-env-id',
        name: 'Eagle Admin',
        email: 'admin@eagleboxcricket.com',
        role: 'admin'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * GET /api/auth/bookings
 * Get booking history for logged-in player
 */
async function getPlayerBookings(req, res) {
  try {
    const { id, email } = req.user;

    // Fetch leads where user_id = id OR email = email
    const { data: bookings, error } = await supabase
      .from('leads')
      .select('*')
      .or(`user_id.eq.${id},email.eq.${email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch bookings error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch booking history' });
    }

    return res.json(bookings || []);
  } catch (error) {
    console.error('Bookings fetch error:', error.message);
    return res.status(500).json({ error: 'Internal server error fetching bookings' });
  }
}

module.exports = { registerPlayer, loginUser, getProfile, getPlayerBookings };
