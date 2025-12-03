import { Router, Response } from 'express';
import { models } from '../models/mongoose';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/register
 * Register a new player
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if player already exists
    const existingPlayer = await models.Player.findOne({ $or: [{ username }, { email }] });
    if (existingPlayer) {
      res.status(409).json({ error: 'Username or email already taken' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create player
    const player = new models.Player({
      username,
      email,
      passwordHash: hashedPassword,
      ideologyPoint: {
        economic: 0,
        social: 0,
        personalFreedom: 0,
      },
      approval: {},
    });

    await player.save();

    // Generate token
    const token = generateToken(player._id.toString(), username);

    res.status(201).json({
      message: 'Player registered successfully',
      token,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Login with username/email and password
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find player
    const player = await models.Player.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!player) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Check password
    const passwordMatch = await comparePassword(password, player.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate token
    const token = generateToken(player._id.toString(), player.username);

    res.json({
      message: 'Login successful',
      token,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/verify
 * Verify current token (protected route)
 */
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const player = await models.Player.findById(req.playerId);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({
      valid: true,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /auth/logout
 * Logout (client-side token deletion, no backend action needed)
 */
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
