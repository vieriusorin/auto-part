# OWASP Security — A04–A10 Reference Patterns

This file covers A04 through A10 of the OWASP Top 10 (2021), cross-cutting practices, automated security testing, and static analysis tools. For A01–A03, see `../SKILL.md`.

---

## A04 — Insecure Design
**Risk**: Missing or ineffective security controls by design.

### SECURE Design Patterns:
```typescript
// Rate Limiting (Prevents brute force)
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, loginHandler);

// Account Lockout Pattern
async function attemptLogin(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials'); // Generic error — no user enumeration
  }

  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    throw new Error('Account temporarily locked. Try again later.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    await incrementFailedAttempts(user.id);

    if (user.failedAttempts >= 5) {
      await lockAccount(user.id, 30); // Lock for 30 minutes
    }

    throw new Error('Invalid credentials');
  }

  await resetFailedAttempts(user.id);
  return user;
}

// Secure Password Reset Flow
async function initiatePasswordReset(email: string) {
  const user = await getUserByEmail(email);

  if (!user) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Timing-safe delay
    return { message: 'If that email exists, a reset link was sent' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  await storeResetToken(user.id, resetTokenHash, {
    expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
    used: false
  });

  await sendPasswordResetEmail(user.email, resetToken);

  return { message: 'If that email exists, a reset link was sent' };
}
```

### INSECURE Design:
```typescript
// NEVER DO THIS - No rate limiting
app.post('/api/auth/login', loginHandler); // Unlimited attempts!

// NEVER DO THIS - User enumeration
async function initiatePasswordReset(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return { error: 'Email not found' }; // Reveals which emails exist!
  }
}

// NEVER DO THIS - Predictable tokens
function generateResetToken() {
  return Date.now().toString(); // Easily guessable!
}

// NEVER DO THIS - No token expiry
async function resetPassword(token: string, newPassword: string) {
  const reset = await findResetToken(token);
  // No expiry check — token valid forever!
  await updatePassword(reset.userId, newPassword);
}
```

**Prevention Checklist**:
- [ ] Implement rate limiting on all public endpoints
- [ ] Use account lockout after failed login attempts
- [ ] Prevent user enumeration (same response for valid/invalid users)
- [ ] Use cryptographically secure random tokens
- [ ] Set expiration on all tokens and sessions
- [ ] Implement secure password reset flows
- [ ] Use CAPTCHA for public forms after failed attempts

---

## A05 — Security Misconfiguration
**Risk**: Insecure default configurations, missing security headers, exposed error details.

### SECURE Configuration:
```typescript
import helmet from 'helmet';
import cors from 'cors';

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Strict CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Secure error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // Full error server-side only

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // Prevent XSS access
    maxAge: 3600000, // 1 hour
    sameSite: 'strict', // CSRF protection
  },
}));
```

### INSECURE Configuration:
```typescript
// NEVER DO THIS - Permissive CORS
app.use(cors({
  origin: '*', // Allows any origin!
  credentials: true, // With credentials is dangerous!
}));

// NEVER DO THIS - Exposing stack traces
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // Reveals internal paths and logic!
  });
});

// NEVER DO THIS - Insecure session
app.use(session({
  secret: 'keyboard cat', // Weak secret!
  cookie: {
    secure: false, // Sent over HTTP!
    httpOnly: false, // Accessible via JavaScript (XSS risk)!
  },
}));
```

**Prevention Checklist**:
- [ ] Use security headers (Helmet.js)
- [ ] Configure strict CORS policies
- [ ] Disable detailed error messages in production
- [ ] Remove default credentials and examples
- [ ] Keep all dependencies updated
- [ ] Use secure session/cookie configuration
- [ ] Disable directory listing and unnecessary features

---

## A06 — Vulnerable and Outdated Components
**Risk**: Using libraries with known security vulnerabilities.

### SECURE Practices:
```bash
# Regular dependency audits
npm audit
pnpm audit

# Fix vulnerabilities automatically
npm audit fix
pnpm audit --fix

# Keep dependencies updated
npm update
pnpm update

# Use lock files
package-lock.json  # npm
pnpm-lock.yaml     # pnpm
```

```json
// package.json - Specify version ranges carefully
{
  "dependencies": {
    "express": "^4.18.2",     // Caret allows patch/minor updates
    "helmet": "~7.1.0",       // Tilde allows patch updates only
    "bcrypt": "5.1.1"         // Exact version for critical security libs
  },
  "scripts": {
    "audit": "pnpm audit",
    "update-deps": "pnpm update --latest"
  }
}
```

### VULNERABLE Practices:
```json
{
  "dependencies": {
    "express": "*",           // Any version - dangerous!
    "lodash": "3.10.1",      // Ancient version with known vulns!
    "jquery": "1.12.0"       // Outdated, vulnerable
  }
}
```

**Prevention Checklist**:
- [ ] Run `npm audit` / `pnpm audit` regularly
- [ ] Enable Dependabot or Renovate for automated updates
- [ ] Review security advisories for dependencies
- [ ] Remove unused dependencies
- [ ] Use lock files and commit them
- [ ] Monitor CVE databases for used libraries

---

## A07 — Identification and Authentication Failures
**Risk**: Weak authentication mechanisms allowing account compromise.

### SECURE Authentication:
```typescript
// Strong password requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

// Secure JWT implementation
function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h', // Short expiry
      issuer: 'your-app',
      audience: 'your-app-api',
    }
  );
}

function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'your-app',
      audience: 'your-app-api',
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Multi-factor authentication
async function verifyMFA(userId: string, code: string): Promise<boolean> {
  const user = await getUser(userId);

  if (!user.mfaSecret) {
    throw new Error('MFA not enabled');
  }

  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1, // Allow 1 time step tolerance
  });
}

// Session management
async function createSession(user: User, req: Request): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');

  await storeSession({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return sessionId;
}

// Logout and session invalidation
async function logout(sessionId: string, res: Response): Promise<void> {
  await deleteSession(sessionId); // Server-side session deletion
  res.clearCookie('sessionId'); // Clear client cookie
}
```

### VULNERABLE Authentication:
```typescript
// NEVER DO THIS - Weak password requirements
const passwordSchema = z.string().min(6); // Too short, no complexity!

// NEVER DO THIS - Tokens that never expire
function generateToken(user: User): string {
  return jwt.sign({ userId: user.id }, 'secret'); // No expiry, weak secret!
}

// NEVER DO THIS - Client-side only authentication
function login(email: string, password: string) {
  if (email && password) {
    localStorage.setItem('isAuthenticated', 'true'); // No server validation!
    localStorage.setItem('role', 'admin'); // Client controls role!
  }
}

// NEVER DO THIS - Session fixation vulnerability
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);
  req.session.userId = user.id; // Reusing existing session ID — should regenerate!
});
```

**Prevention Checklist**:
- [ ] Enforce strong password policies (length + complexity)
- [ ] Implement rate limiting on authentication endpoints
- [ ] Use secure session management with server-side storage
- [ ] Implement token expiration and refresh mechanisms
- [ ] Support multi-factor authentication (MFA)
- [ ] Regenerate session IDs after login
- [ ] Implement proper logout (clear server + client sessions)
- [ ] Never trust client-side authentication state

---

## A08 — Software and Data Integrity Failures
**Risk**: Code or data modified without integrity verification.

### SECURE Practices:
```typescript
// Subresource Integrity for CDN resources
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

// Verify file uploads
import crypto from 'crypto';

async function verifyFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => {
      const fileHash = hash.digest('hex');
      resolve(fileHash === expectedHash);
    });
    stream.on('error', reject);
  });
}

// Secure deserialization
function deserializeData(jsonString: string): unknown {
  try {
    const data = JSON.parse(jsonString);
    const validated = dataSchema.parse(data); // Validate against schema
    return validated;
  } catch (error) {
    throw new Error('Invalid data format');
  }
}
```

### VULNERABLE Practices:
```typescript
// NEVER DO THIS - Insecure deserialization
function deserializeData(data: string) {
  return eval(data); // Code execution vulnerability!
}

// NEVER DO THIS - No integrity checks
function loadPlugin(pluginCode: string) {
  return new Function(pluginCode)(); // Arbitrary code execution!
}

// NEVER DO THIS - Unverified file uploads
app.post('/upload', async (req, res) => {
  const file = req.file;
  // No validation — could be malicious executable!
  await fs.promises.writeFile(`./uploads/${file.originalname}`, file.buffer);
});
```

**Prevention Checklist**:
- [ ] Use Subresource Integrity (SRI) for CDN resources
- [ ] Verify digital signatures on packages
- [ ] Use lock files and verify integrity
- [ ] Never use eval() or new Function() with untrusted data
- [ ] Validate file types and contents before processing
- [ ] Implement checksum verification for critical data
- [ ] Use code review for third-party code

---

## A09 — Security Logging and Monitoring Failures
**Risk**: Insufficient logging prevents detection of breaches.

### SECURE Logging:
```typescript
import winston from 'winston';

// Structured logging with levels
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log security events
async function login(email: string, password: string, req: Request) {
  try {
    const user = await authenticateUser(email, password);

    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    logger.warn('Login attempt failed', {
      email: email,
      ipAddress: req.ip,
      reason: 'Invalid credentials',
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

// Log access control failures
async function updateResource(userId: string, resourceId: string, req: Request) {
  if (!hasPermission(userId, resourceId)) {
    logger.warn('Unauthorized access attempt', {
      userId,
      resourceId,
      action: 'update',
      ipAddress: req.ip,
      timestamp: new Date().toISOString(),
    });

    throw new Error('Forbidden');
  }
}

// Monitor suspicious patterns
function detectSuspiciousActivity(userId: string, action: string) {
  const recentActions = getRecentActions(userId, 60000); // Last minute

  if (recentActions.length > 100) {
    logger.error('Suspicious activity detected', {
      userId,
      actionCount: recentActions.length,
      timeWindow: '1 minute',
      type: 'rate_limit_exceeded',
    });

    notifySecurityTeam('Potential abuse', { userId, actionCount: recentActions.length });
  }
}
```

### INADEQUATE Logging:
```typescript
// NEVER DO THIS - No logging
async function login(email: string, password: string) {
  const user = await authenticateUser(email, password);
  return user; // No audit trail!
}

// NEVER DO THIS - Logging sensitive data
logger.info('User login', {
  email: user.email,
  password: password, // Never log passwords!
  creditCard: user.creditCard, // Never log PII!
});

// NEVER DO THIS - No monitoring
async function transfer(from: string, to: string, amount: number) {
  await processTransfer(from, to, amount);
  // No logging of financial transactions!
}
```

**Prevention Checklist**:
- [ ] Log all authentication attempts (success and failure)
- [ ] Log authorization failures
- [ ] Log input validation failures
- [ ] Never log sensitive data (passwords, tokens, PII)
- [ ] Use structured logging with correlation IDs
- [ ] Implement log rotation and retention
- [ ] Set up alerts for suspicious patterns
- [ ] Ensure logs are tamper-proof

---

## A10 — Server-Side Request Forgery (SSRF)
**Risk**: Application makes requests to unintended locations.

### SECURE Implementation:
```typescript
import { URL } from 'url';

const ALLOWED_DOMAINS = [
  'api.github.com',
  'api.stripe.com',
  'maps.googleapis.com',
];

async function fetchExternalResource(urlString: string) {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    throw new Error('Invalid URL');
  }

  // Protocol validation
  if (url.protocol !== 'https:') {
    throw new Error('Only HTTPS is allowed');
  }

  // Domain allowlist
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    throw new Error('Domain not allowed');
  }

  // Prevent private IP ranges
  const ip = await dns.promises.resolve4(url.hostname).catch(() => null);
  if (ip && isPrivateIP(ip[0])) {
    throw new Error('Private IP addresses not allowed');
  }

  // Make request with timeout, no auto-redirects
  const response = await fetch(url.toString(), {
    timeout: 5000,
    redirect: 'manual',
  });

  return response;
}

function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254)
  );
}
```

### VULNERABLE Implementation:
```typescript
// NEVER DO THIS - Unvalidated URL fetching
async function fetchResource(url: string) {
  return await fetch(url);
  // Attack: url = "http://localhost:6379/" accesses Redis!
  // Attack: url = "http://169.254.169.254/latest/meta-data/" steals cloud credentials!
}

// NEVER DO THIS - User-controlled redirect
app.get('/redirect', (req, res) => {
  const { url } = req.query;
  res.redirect(url as string); // Open redirect vulnerability!
});

// NEVER DO THIS - No validation on webhook URLs
async function registerWebhook(webhookUrl: string) {
  await db.insert(webhooks).values({ url: webhookUrl });
  // Attacker can set webhook to internal service!
}
```

**Prevention Checklist**:
- [ ] Use allowlist for domains/IPs that can be accessed
- [ ] Validate URL protocols (allow only HTTPS)
- [ ] Block requests to private IP ranges and localhost
- [ ] Disable or limit URL redirects
- [ ] Use DNS resolution to check for private IPs
- [ ] Implement network segmentation
- [ ] Use dedicated egress proxies with strict rules

---

## Cross-Cutting Practices

### Input Validation
```typescript
import { z } from 'zod';

// Always validate input at the boundary
const createEmployeeSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'employee']), // Strict enum
  salary: z.number().positive().max(1000000),
  startDate: z.string().datetime(),
});

app.post('/api/employees', async (req, res) => {
  const validated = createEmployeeSchema.parse(req.body);
  await employeeService.create(validated);
});
```

### Output Encoding
```typescript
// Sanitize output to prevent XSS
import DOMPurify from 'isomorphic-dompurify';

function renderUserContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

// React, Vue, Angular auto-escape by default
return <div>{userInput}</div>; // Auto-escaped
```

### Principle of Least Privilege
```typescript
// Database user with minimal permissions
// CREATE USER app_user WITH PASSWORD 'strong_password';
// GRANT SELECT, INSERT, UPDATE ON employees TO app_user;
// REVOKE DELETE, DROP ON ALL TABLES FROM app_user;

// API with minimal scope
const apiKey = createAPIKey({
  scope: ['read:employees'], // Only read access
  expiresIn: '30d',
});
```

---

## Automated Security Testing

### Security Test Examples
```typescript
// Test authorization
describe('Authorization', () => {
  it('should prevent unauthorized access to admin routes', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer ' + regularUserToken);

    expect(response.status).toBe(403);
  });

  it('should prevent IDOR attacks', async () => {
    const response = await request(app)
      .get('/api/users/999') // Different user ID
      .set('Authorization', 'Bearer ' + userToken);

    expect(response.status).toBe(403);
  });
});

// Test input validation
describe('Input Validation', () => {
  it('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .post('/api/search')
      .send({ query: "'; DROP TABLE users; --" });

    expect(response.status).toBe(400);
  });

  it('should reject XSS attempts', async () => {
    const response = await request(app)
      .post('/api/comments')
      .send({ content: '<script>alert("XSS")</script>' });

    const comment = await getComment(response.body.id);
    expect(comment.content).not.toContain('<script>');
  });
});
```

---

## Static Analysis Tools

```bash
# Run security linting
npm install --save-dev eslint-plugin-security

# .eslintrc.js
module.exports = {
  plugins: ['security'],
  extends: ['plugin:security/recommended'],
};

# Scan for secrets
npm install --save-dev @gitguardian/ggshield
ggshield secret scan path .

# Audit package signatures
npm audit signatures
```

---

## When in Doubt

1. **Default to deny** - Explicitly allow actions, don't deny exceptions
2. **Trust nothing** - Validate all input, even from "trusted" sources
3. **Fail securely** - Errors should not reveal sensitive information
4. **Layer security** - Defense in depth (multiple security controls)
5. **Keep it simple** - Complex security is error-prone

## Resources

- OWASP Top 10: https://owasp.org/Top10/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- CWE Top 25: https://cwe.mitre.org/top25/
