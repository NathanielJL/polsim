# Alt Account Prevention Strategies

## Current Vulnerabilities
Your game currently has NO protection against alt accounts. Users can create unlimited accounts.

## Prevention Strategies (Ranked by Effectiveness)

### Tier 1: Basic (Easy to Implement)
1. **Email Verification** ⭐⭐⭐
   - Require email confirmation before account activation
   - Prevents mass account creation
   - Free to implement
   - Easy to bypass with temp email services

2. **IP Rate Limiting** ⭐⭐
   - Limit registrations per IP (e.g., 3 per day)
   - Prevents bot attacks
   - Can block legitimate users (shared IPs, VPNs)

3. **CAPTCHA** ⭐⭐⭐
   - Google reCAPTCHA v3 (invisible)
   - Prevents bot registration
   - Free tier available
   - Users can solve multiple times

### Tier 2: Moderate (More Complex)
4. **Phone Verification** ⭐⭐⭐⭐
   - SMS verification code (Twilio, AWS SNS)
   - Very effective deterrent
   - Costs $0.01-0.05 per SMS
   - Users can use burner numbers

5. **Device Fingerprinting** ⭐⭐⭐
   - Track browser fingerprint
   - Detect same device creating multiple accounts
   - Libraries: FingerprintJS
   - Can be bypassed with different browsers

6. **Account Aging** ⭐⭐⭐⭐
   - New accounts have limited actions
   - Full permissions after 24-48 hours
   - Reduces alt abuse incentive
   - Doesn't prevent creation

### Tier 3: Advanced (Professional Grade)
7. **Multi-Factor Authentication** ⭐⭐⭐⭐⭐
   - Require MFA for all accounts
   - Makes alts very tedious
   - Improves security overall

8. **Social Graph Analysis** ⭐⭐⭐⭐
   - Track account relationships/behaviors
   - Flag suspicious patterns (same voting, same actions)
   - Machine learning detection
   - Complex to implement

9. **Proof of Identity** ⭐⭐⭐⭐⭐
   - Government ID verification (Stripe Identity, Onfido)
   - Most effective but expensive ($0.50-5 per check)
   - Privacy concerns
   - Only for competitive/money games

### Tier 4: Game Design Solutions
10. **Make Alts Less Useful** ⭐⭐⭐⭐⭐
    - One account per session
    - Diminishing returns for multiple accounts
    - Encourage cooperation over competition
    - **Best long-term solution**

## Recommended Implementation for POLSIM

### Phase 1 (Immediate - Free)
```javascript
// 1. Email verification required
// 2. IP rate limiting (3 accounts per IP per 24h)
// 3. reCAPTCHA v3 on registration
// 4. Account must be 24h old to vote/propose
```

### Phase 2 (Beta - Low Cost)
```javascript
// 5. Device fingerprinting
// 6. One account per session (game design rule)
// 7. Account aging - gradual permission unlock
```

### Phase 3 (Production - If Needed)
```javascript
// 8. Optional phone verification for trusted status
// 9. Social graph analysis for voting fraud
// 10. Admin tools to flag suspicious accounts
```

## Implementation Code

### 1. Email Verification
```javascript
// Backend: Send verification email
const nodemailer = require('nodemailer');
const crypto = require('crypto');

async function sendVerificationEmail(email, username) {
  const token = crypto.randomBytes(32).toString('hex');
  // Save token to database with expiry
  await VerificationToken.create({
    email,
    token,
    expiresAt: new Date(Date.now() + 24*60*60*1000) // 24h
  });

  const verifyUrl = \`https://yoursite.com/verify?token=\${token}\`;
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    to: email,
    subject: 'Verify your POLSIM account',
    html: \`<p>Welcome \${username}! Click <a href="\${verifyUrl}">here</a> to verify your email.</p>\`
  });
}
```

### 2. IP Rate Limiting
```javascript
// Backend middleware
const rateLimit = require('express-rate-limit');

const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 accounts per IP
  message: 'Too many accounts created from this IP. Try again in 24 hours.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/auth/register', registrationLimiter, async (req, res) => {
  // ... registration logic
});
```

### 3. reCAPTCHA v3
```javascript
// Frontend
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

function onRegisterSubmit() {
  grecaptcha.execute('YOUR_SITE_KEY', {action: 'register'})
    .then(token => {
      // Send token to backend
      registerUser({ ...formData, recaptchaToken: token });
    });
}

// Backend
const axios = require('axios');

async function verifyRecaptcha(token) {
  const response = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET,
        response: token
      }
    }
  );
  return response.data.success && response.data.score > 0.5;
}
```

### 4. Account Aging
```javascript
// Backend: Check account age
function canVote(player) {
  const accountAge = Date.now() - player.createdAt.getTime();
  const MIN_AGE = 24 * 60 * 60 * 1000; // 24 hours
  return accountAge >= MIN_AGE;
}

// Restrict actions
if (!canVote(player)) {
  return res.status(403).json({ 
    error: 'Your account must be 24 hours old to vote.' 
  });
}
```

## How NationStates Handles This
- **One nation per user** (honor system)
- **Multi detection** via IP/browser fingerprinting
- **Bans for confirmed multi abuse**
- **Game design**: Having alts provides minimal advantage
- **Community reporting**: Players report suspected alts

## Recommendation for You
Start with **Phase 1** (email + reCAPTCHA + rate limiting). It's free and blocks 90% of casual alt abuse. Add more layers only if you see actual abuse.

**Most important**: Design the game so alts aren't overpowered. One vote per person, one office per person, etc.
