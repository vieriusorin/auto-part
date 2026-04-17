---
name: owasp-security
description: Comprehensive OWASP Top 10 security best practices for secure coding, authentication, access control, input validation, and more. Use this skill to identify and fix common security vulnerabilities in your code.
triggers:
  - "security best practices"
  - "owasp top 10"
  - "secure coding guidelines"
allowed-tools: [Read, Write, Edit, Bash]
---

# OWASP Security Best Practices Skill

## Purpose
This skill provides security guidance based on OWASP Top 10 to identify, prevent, and fix security vulnerabilities during code implementation and review. Use this skill proactively when writing or reviewing security-sensitive code.

## When to Use This Skill

### ✅ DO Use This Skill When:
1. **Implementing Authentication/Authorization**
   - Login systems, session management, password handling
   - API authentication (JWT, OAuth, API keys)
   - Role-based access control (RBAC)
   - Permission checks

2. **Handling User Input**
   - Forms, query parameters, request bodies
   - File uploads
   - Search functionality
   - Any data from untrusted sources

3. **Database Operations**
   - Writing SQL queries with user input
   - ORM usage with dynamic queries
   - Database schema design for sensitive data

4. **API Development**
   - REST/GraphQL endpoints
   - Rate limiting implementation
   - CORS configuration
   - API response design

5. **Data Processing**
   - Rendering user-generated content
   - Processing files or images
   - Serialization/deserialization
   - Data validation and sanitization

6. **Configuration & Secrets**
   - Environment variables
   - API keys, tokens, credentials
   - Cryptographic operations
   - Third-party service integration

### ❌ DO NOT Use This Skill When:
1. Writing pure UI components without data handling
2. Simple utility functions with no external input
3. Internal-only calculations or transformations
4. Static content generation
5. Non-security-critical refactoring

---

## OWASP Top 10 (2021) Security Guidelines

### 1. Broken Access Control
**Risk**: Users can access resources or perform actions they shouldn't be authorized for.

#### ✅ SECURE Example:
```typescript
// Middleware with proper authorization
async function updateEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user.id; // From authenticated session
  const userRole = req.user.role;

  // Check ownership or admin role
  if (userRole !== 'admin' && userId !== id) {
    return res.status(403).json({ error: 'Forbidden: Cannot update other users' });
  }

  // Additional RBAC check
  if (!hasPermission(req.user, 'employee:update')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Proceed with update
  await employeeService.update(id, req.body);
}
```

#### ❌ VULNERABLE Example:
```typescript
// NO ACCESS CONTROL - Anyone can update any employee!
async function updateEmployee(req: Request, res: Response) {
  const { id } = req.params;
  await employeeService.update(id, req.body); // ⚠️ No authorization check!
}

// INSECURE - Trusting client-provided role
async function updateEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body; // ⚠️ Never trust client for roles!

  if (role === 'admin') {
    // ⚠️ Privilege escalation vulnerability
    await employeeService.update(id, req.body);
  }
}
```

**Prevention Checklist**:
- [ ] Always verify user identity from session/token, never from request body
- [ ] Implement deny-by-default access control
- [ ] Check permissions on every protected endpoint
- [ ] Use middleware for consistent authorization
- [ ] Validate resource ownership before operations
- [ ] Never expose internal object IDs without authorization

---

### 2. Cryptographic Failures
**Risk**: Sensitive data exposed through weak encryption or transmission.

#### ✅ SECURE Example:
```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Password hashing
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // ✅ Strong work factor
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Encryption for sensitive data
function encryptSensitiveData(data: string, key: Buffer): string {
  const iv = crypto.randomBytes(16); // ✅ Random IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); // ✅ GCM mode

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Return IV + authTag + encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Environment-based secrets (never hardcode)
const config = {
  jwtSecret: process.env.JWT_SECRET!, // ✅ From environment
  encryptionKey: Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
  databaseUrl: process.env.DATABASE_URL!,
};
```

#### ❌ VULNERABLE Example:
```typescript
// NEVER DO THIS!
function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex'); // ⚠️ MD5 is broken!
}

// NEVER DO THIS!
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex'); // ⚠️ No salt, vulnerable to rainbow tables!
}

// NEVER DO THIS!
const config = {
  jwtSecret: 'my-secret-key-123', // ⚠️ Hardcoded secret in code!
  apiKey: 'sk_live_abc123xyz', // ⚠️ Committed to Git!
};

// NEVER DO THIS!
function encryptData(data: string): string {
  const cipher = crypto.createCipheriv('aes-256-ecb', key, null); // ⚠️ ECB mode is insecure!
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}
```

**Prevention Checklist**:
- [ ] Use bcrypt, scrypt, or Argon2 for password hashing (never MD5, SHA1, or plain SHA256)
- [ ] Store secrets in environment variables, never in code
- [ ] Use strong encryption algorithms (AES-256-GCM, ChaCha20-Poly1305)
- [ ] Generate random IVs for each encryption
- [ ] Use HTTPS/TLS for data in transit
- [ ] Never store passwords in plain text or reversible encryption

---

### 3. Injection (SQL, NoSQL, Command, etc.)
**Risk**: Attackers can execute malicious commands through untrusted input.

#### ✅ SECURE Example:
```typescript
// SQL Injection Prevention - Parameterized Queries
async function getUserByEmail(email: string) {
  // ✅ Using parameterized query with Drizzle ORM
  const users = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, email)); // ✅ Automatically escaped

  return users[0];
}

// ✅ Using prepared statements
async function searchEmployees(searchTerm: string) {
  const query = db.select()
    .from(employees)
    .where(like(employees.name, `%${searchTerm}%`)); // ✅ ORM handles escaping

  return await query;
}

// Command Injection Prevention
async function processFile(filename: string) {
  // ✅ Validate input against whitelist
  if (!/^[a-zA-Z0-9_-]+\.pdf$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  // ✅ Use parameterized APIs instead of shell commands
  await fs.promises.readFile(`./uploads/${filename}`);
}

// NoSQL Injection Prevention
async function findUserByCredentials(email: string, password: string) {
  // ✅ Explicit type checking and sanitization
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid input types');
  }

  // ✅ Use strict equality, not $where operators with user input
  const user = await User.findOne({
    email: email.toLowerCase().trim()
  });

  if (!user) return null;

  // ✅ Compare password separately, never pass to query
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}
```

#### ❌ VULNERABLE Example:
```typescript
// NEVER DO THIS - SQL Injection
async function getUserByEmail(email: string) {
  // ⚠️ String concatenation with user input!
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return await db.execute(query);
  // Attack: email = "' OR '1'='1' --" returns all users!
}

// NEVER DO THIS - Command Injection
async function processFile(filename: string) {
  // ⚠️ Passing user input directly to shell command!
  exec(`convert uploads/${filename} output.pdf`);
  // Attack: filename = "file.pdf; rm -rf /" executes rm command!
}

// NEVER DO THIS - NoSQL Injection
async function login(req: Request) {
  const { email, password } = req.body;
  // ⚠️ Passing entire request body to query!
  const user = await User.findOne({
    email: email,
    password: password // ⚠️ Never query password directly!
  });
  // Attack: email = {$gt: ""} returns any user!
}

// NEVER DO THIS - Template Injection
function renderTemplate(userInput: string) {
  // ⚠️ Evaluating user input as code!
  return eval(`\`Hello ${userInput}\``);
  // Attack: userInput = "${process.exit()}" crashes server!
}
```

**Prevention Checklist**:
- [ ] Always use parameterized queries/prepared statements
- [ ] Never concatenate user input into SQL queries
- [ ] Use ORM/query builders that auto-escape parameters
- [ ] Validate and sanitize all inputs against expected format
- [ ] Use allowlists for filenames, commands, and dynamic values
- [ ] Avoid shell commands; use native APIs when possible
- [ ] Never use eval() or Function() with user input

---

### 4. Insecure Design
**Risk**: Missing or ineffective security controls by design.

#### ✅ SECURE Design Patterns:
```typescript
// Rate Limiting (Prevents brute force)
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ✅ 15 minutes
  max: 5, // ✅ Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, loginHandler);

// Account Lockout Pattern
async function attemptLogin(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user) {
    // ✅ Generic error message (no user enumeration)
    throw new Error('Invalid credentials');
  }

  // ✅ Check if account is locked
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    throw new Error('Account temporarily locked. Try again later.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    // ✅ Increment failed attempts
    await incrementFailedAttempts(user.id);

    if (user.failedAttempts >= 5) {
      // ✅ Lock account for 30 minutes
      await lockAccount(user.id, 30);
    }

    throw new Error('Invalid credentials');
  }

  // ✅ Reset failed attempts on success
  await resetFailedAttempts(user.id);
  return user;
}

// Secure Password Reset Flow
async function initiatePasswordReset(email: string) {
  const user = await getUserByEmail(email);

  // ✅ Don't reveal if email exists (timing-safe)
  if (!user) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
    return { message: 'If that email exists, a reset link was sent' };
  }

  // ✅ Generate cryptographically secure token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // ✅ Store hash, not plain token
  await storeResetToken(user.id, resetTokenHash, {
    expiresAt: new Date(Date.now() + 3600000), // ✅ 1 hour expiry
    used: false
  });

  // ✅ Send token via email (not in URL query for logged requests)
  await sendPasswordResetEmail(user.email, resetToken);

  return { message: 'If that email exists, a reset link was sent' };
}
```

#### ❌ INSECURE Design:
```typescript
// NEVER DO THIS - No rate limiting
app.post('/api/auth/login', loginHandler); // ⚠️ Unlimited attempts!

// NEVER DO THIS - User enumeration
async function initiatePasswordReset(email: string) {
  const user = await getUserByEmail(email);

  if (!user) {
    return { error: 'Email not found' }; // ⚠️ Reveals which emails exist!
  }

  // Send reset email...
}

// NEVER DO THIS - Predictable tokens
function generateResetToken() {
  return Date.now().toString(); // ⚠️ Easily guessable!
}

// NEVER DO THIS - No token expiry
async function resetPassword(token: string, newPassword: string) {
  const reset = await findResetToken(token);
  // ⚠️ No expiry check, token valid forever!

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

### 5. Security Misconfiguration
**Risk**: Insecure default configurations, missing security headers, exposed error details.

#### ✅ SECURE Configuration:
```typescript
import helmet from 'helmet';
import cors from 'cors';

// ✅ Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // ✅ Minimize inline scripts
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

// ✅ Strict CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // ✅ Specific origins
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Secure error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // ✅ Log full error server-side

  // ✅ Don't expose internal errors to client
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An error occurred' // ✅ Generic message in production
    : err.message; // ✅ Detailed in development only

  res.status(statusCode).json({
    error: message,
    // ⚠️ Never send stack trace to client in production!
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ✅ Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
    httpOnly: true, // ✅ Prevent XSS access
    maxAge: 3600000, // ✅ 1 hour
    sameSite: 'strict', // ✅ CSRF protection
  },
}));
```

#### ❌ INSECURE Configuration:
```typescript
// NEVER DO THIS - Permissive CORS
app.use(cors({
  origin: '*', // ⚠️ Allows any origin!
  credentials: true, // ⚠️ With credentials is dangerous!
}));

// NEVER DO THIS - Exposing stack traces
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // ⚠️ Reveals internal paths and logic!
  });
});

// NEVER DO THIS - Insecure session
app.use(session({
  secret: 'keyboard cat', // ⚠️ Weak secret!
  cookie: {
    secure: false, // ⚠️ Sent over HTTP!
    httpOnly: false, // ⚠️ Accessible via JavaScript (XSS risk)!
  },
}));

// NEVER DO THIS - Default error pages
app.get('/api/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
  // ⚠️ If error occurs, default Express error exposes stack trace!
});
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

### 6. Vulnerable and Outdated Components
**Risk**: Using libraries with known security vulnerabilities.

#### ✅ SECURE Practices:
```bash
# ✅ Regular dependency audits
npm audit
pnpm audit

# ✅ Fix vulnerabilities automatically
npm audit fix
pnpm audit --fix

# ✅ Keep dependencies updated
npm update
pnpm update

# ✅ Use lock files
package-lock.json  # npm
pnpm-lock.yaml     # pnpm
```

```json
// package.json - ✅ Specify version ranges carefully
{
  "dependencies": {
    "express": "^4.18.2",     // ✅ Caret allows patch/minor updates
    "helmet": "~7.1.0",       // ✅ Tilde allows patch updates only
    "bcrypt": "5.1.1"         // ✅ Exact version for critical security libs
  },
  "scripts": {
    "audit": "pnpm audit",
    "update-deps": "pnpm update --latest"
  }
}
```

#### ❌ VULNERABLE Practices:
```json
// NEVER DO THIS
{
  "dependencies": {
    "express": "*",           // ⚠️ Any version - dangerous!
    "lodash": "3.10.1",      // ⚠️ Ancient version with known vulns!
    "jquery": "1.12.0"       // ⚠️ Outdated, vulnerable
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

### 7. Identification and Authentication Failures
**Risk**: Weak authentication mechanisms allowing account compromise.

#### ✅ SECURE Authentication:
```typescript
// ✅ Strong password requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

// ✅ Secure JWT implementation
function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h', // ✅ Short expiry
      issuer: 'profiller-hr',
      audience: 'profiller-hr-api',
    }
  );
}

function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'profiller-hr',
      audience: 'profiller-hr-api',
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// ✅ Multi-factor authentication
async function verifyMFA(userId: string, code: string): Promise<boolean> {
  const user = await getUser(userId);

  if (!user.mfaSecret) {
    throw new Error('MFA not enabled');
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1, // ✅ Allow 1 time step tolerance
  });

  return verified;
}

// ✅ Session management
async function createSession(user: User): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');

  await storeSession({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // ✅ 1 hour
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return sessionId;
}

// ✅ Logout and session invalidation
async function logout(sessionId: string): Promise<void> {
  await deleteSession(sessionId); // ✅ Server-side session deletion
  res.clearCookie('sessionId'); // ✅ Clear client cookie
}
```

#### ❌ VULNERABLE Authentication:
```typescript
// NEVER DO THIS - Weak password requirements
const passwordSchema = z.string().min(6); // ⚠️ Too short, no complexity!

// NEVER DO THIS - Tokens that never expire
function generateToken(user: User): string {
  return jwt.sign({ userId: user.id }, 'secret'); // ⚠️ No expiry, weak secret!
}

// NEVER DO THIS - Client-side only authentication
function login(email: string, password: string) {
  if (email && password) {
    localStorage.setItem('isAuthenticated', 'true'); // ⚠️ No server validation!
    localStorage.setItem('role', 'admin'); // ⚠️ Client controls role!
  }
}

// NEVER DO THIS - Session fixation vulnerability
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);

  // ⚠️ Reusing existing session ID after authentication!
  req.session.userId = user.id;
  // Should regenerate session ID: req.session.regenerate()
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

### 8. Software and Data Integrity Failures
**Risk**: Code or data modified without integrity verification.

#### ✅ SECURE Practices:
```typescript
// ✅ Subresource Integrity for CDN resources
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

// ✅ Verify file uploads
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

// ✅ Secure deserialization
function deserializeData(jsonString: string): unknown {
  try {
    const data = JSON.parse(jsonString);

    // ✅ Validate against schema
    const validated = dataSchema.parse(data);
    return validated;
  } catch (error) {
    throw new Error('Invalid data format');
  }
}

// ✅ Code signing and verification
// Use npm audit signatures
npm audit signatures

// ✅ Lock file integrity
// Always commit and verify lock files
pnpm-lock.yaml
package-lock.json
```

#### ❌ VULNERABLE Practices:
```typescript
// NEVER DO THIS - Insecure deserialization
function deserializeData(data: string) {
  return eval(data); // ⚠️ Code execution vulnerability!
}

// NEVER DO THIS - No integrity checks
function loadPlugin(pluginCode: string) {
  return new Function(pluginCode)(); // ⚠️ Arbitrary code execution!
}

// NEVER DO THIS - Unverified file uploads
app.post('/upload', async (req, res) => {
  const file = req.file;
  // ⚠️ No validation, could be malicious executable!
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

### 9. Security Logging and Monitoring Failures
**Risk**: Insufficient logging prevents detection of breaches.

#### ✅ SECURE Logging:
```typescript
import winston from 'winston';

// ✅ Structured logging with levels
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// ✅ Log security events
async function login(email: string, password: string) {
  try {
    const user = await authenticateUser(email, password);

    // ✅ Log successful login
    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    // ✅ Log failed login attempt
    logger.warn('Login attempt failed', {
      email: email, // ✅ Include attempted email
      ipAddress: req.ip,
      reason: 'Invalid credentials',
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

// ✅ Log access control failures
async function updateResource(userId: string, resourceId: string) {
  if (!hasPermission(userId, resourceId)) {
    // ✅ Log authorization failure
    logger.warn('Unauthorized access attempt', {
      userId,
      resourceId,
      action: 'update',
      ipAddress: req.ip,
      timestamp: new Date().toISOString(),
    });

    throw new Error('Forbidden');
  }

  // Proceed with update...
}

// ✅ Monitor suspicious patterns
function detectSuspiciousActivity(userId: string, action: string) {
  const recentActions = getRecentActions(userId, 60000); // Last minute

  if (recentActions.length > 100) {
    // ✅ Log potential abuse
    logger.error('Suspicious activity detected', {
      userId,
      actionCount: recentActions.length,
      timeWindow: '1 minute',
      type: 'rate_limit_exceeded',
    });

    // ✅ Alert security team
    notifySecurityTeam('Potential abuse', { userId, actionCount: recentActions.length });
  }
}
```

#### ❌ INADEQUATE Logging:
```typescript
// NEVER DO THIS - No logging
async function login(email: string, password: string) {
  const user = await authenticateUser(email, password);
  return user; // ⚠️ No audit trail!
}

// NEVER DO THIS - Logging sensitive data
logger.info('User login', {
  email: user.email,
  password: password, // ⚠️ Never log passwords!
  creditCard: user.creditCard, // ⚠️ Never log PII!
});

// NEVER DO THIS - No monitoring
async function transfer(from: string, to: string, amount: number) {
  await processTransfer(from, to, amount);
  // ⚠️ No logging of financial transactions!
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

### 10. Server-Side Request Forgery (SSRF)
**Risk**: Application makes requests to unintended locations.

#### ✅ SECURE Implementation:
```typescript
import { URL } from 'url';

// ✅ URL validation with allowlist
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

  // ✅ Protocol validation
  if (url.protocol !== 'https:') {
    throw new Error('Only HTTPS is allowed');
  }

  // ✅ Domain allowlist
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    throw new Error('Domain not allowed');
  }

  // ✅ Prevent private IP ranges
  const ip = await dns.promises.resolve4(url.hostname).catch(() => null);
  if (ip && isPrivateIP(ip[0])) {
    throw new Error('Private IP addresses not allowed');
  }

  // ✅ Make request with timeout
  const response = await fetch(url.toString(), {
    timeout: 5000,
    redirect: 'manual', // ✅ Don't follow redirects automatically
  });

  return response;
}

// ✅ Validate IP addresses
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  return (
    parts[0] === 10 ||                              // 10.0.0.0/8
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
    (parts[0] === 192 && parts[1] === 168) ||      // 192.168.0.0/16
    parts[0] === 127 ||                             // 127.0.0.0/8 (localhost)
    parts[0] === 169 && parts[1] === 254           // 169.254.0.0/16 (link-local)
  );
}

// ✅ Proxy for external resources
async function fetchViaProxy(url: string) {
  // ✅ Use dedicated proxy with strict rules
  return await fetch(url, {
    agent: new ProxyAgent(process.env.PROXY_URL!),
  });
}
```

#### ❌ VULNERABLE Implementation:
```typescript
// NEVER DO THIS - Unvalidated URL fetching
async function fetchResource(url: string) {
  return await fetch(url); // ⚠️ Can access internal services!
  // Attack: url = "http://localhost:6379/" accesses Redis!
  // Attack: url = "http://169.254.169.254/latest/meta-data/" steals cloud credentials!
}

// NEVER DO THIS - User-controlled redirect
app.get('/redirect', (req, res) => {
  const { url } = req.query;
  res.redirect(url); // ⚠️ Open redirect vulnerability!
  // Attack: url = "http://evil.com" redirects users to phishing site!
});

// NEVER DO THIS - No validation on webhook URLs
async function registerWebhook(webhookUrl: string) {
  await db.insert(webhooks).values({ url: webhookUrl });
  // ⚠️ Attacker can set webhook to internal service!
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

## Cross-Cutting Security Practices

### Input Validation
```typescript
import { z } from 'zod';

// ✅ Always validate input at the boundary
const createEmployeeSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'employee']), // ✅ Strict enum
  salary: z.number().positive().max(1000000),
  startDate: z.string().datetime(),
});

app.post('/api/employees', async (req, res) => {
  // ✅ Validate before processing
  const validated = createEmployeeSchema.parse(req.body);

  // Now safe to use validated data
  await employeeService.create(validated);
});
```

### Output Encoding
```typescript
// ✅ Sanitize output to prevent XSS
import DOMPurify from 'isomorphic-dompurify';

function renderUserContent(html: string): string {
  // ✅ Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

// ✅ Use template engines with auto-escaping
// React, Vue, Angular auto-escape by default
return <div>{userInput}</div>; // ✅ Auto-escaped
```

### Principle of Least Privilege
```typescript
// ✅ Database user with minimal permissions
// CREATE USER app_user WITH PASSWORD 'strong_password';
// GRANT SELECT, INSERT, UPDATE ON employees TO app_user;
// REVOKE DELETE, DROP ON ALL TABLES FROM app_user;

// ✅ API with minimal scope
const apiKey = createAPIKey({
  scope: ['read:employees'], // ✅ Only read access
  expiresIn: '30d',
});
```

---

## Automated Security Testing

### Security Test Examples
```typescript
// ✅ Test authorization
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

// ✅ Test input validation
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

### Static Analysis Tools
```bash
# ✅ Run security linting
npm install --save-dev eslint-plugin-security

# .eslintrc.js
module.exports = {
  plugins: ['security'],
  extends: ['plugin:security/recommended'],
};

# ✅ Scan for secrets
npm install --save-dev @gitguardian/ggshield
ggshield secret scan path .
```

---

## Quick Reference Checklist

Before deploying ANY feature, verify:

- [ ] **Authentication**: All endpoints properly authenticated
- [ ] **Authorization**: Resource ownership and permissions verified
- [ ] **Input Validation**: All user input validated with schemas
- [ ] **SQL Injection**: Using parameterized queries/ORM
- [ ] **XSS Prevention**: Output properly escaped/sanitized
- [ ] **CSRF Protection**: Tokens on state-changing operations
- [ ] **Sensitive Data**: No secrets in code, encrypted at rest
- [ ] **Error Handling**: No stack traces or internal info exposed
- [ ] **Rate Limiting**: Applied to authentication and public APIs
- [ ] **Security Headers**: Helmet configured properly
- [ ] **HTTPS**: Enforced in production
- [ ] **Dependencies**: No known vulnerabilities (`npm audit`)
- [ ] **Logging**: Security events properly logged
- [ ] **CORS**: Restricted to specific origins

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
