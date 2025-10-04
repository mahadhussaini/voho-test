# Deployment Guide

Complete instructions for deploying Voho SaaS to production with security and scalability in mind.

## 🎯 Deployment Overview

### Architecture
```
Internet
    │
    ▼
┌─────────────┐    ┌─────────────┐
│   Netlify   │    │   Railway   │
│ (Frontend)  │◄──►│  (Backend)  │
│             │    │             │
│ • React App │    │ • Express   │
│ • CDN       │    │ • API       │
│ • SSL       │    │ • WebSocket │
└─────────────┘    └─────────────┘
        │               │
        ▼               ▼
┌─────────────┐    ┌─────────────┐
│ MongoDB     │    │    Redis    │
│ Atlas       │    │   Cloud     │
│             │    │ (Optional)  │
└─────────────┘    └─────────────┘
```

## 🚀 Quick Deploy

### 1. Prerequisites
- GitHub account
- MongoDB Atlas account
- Netlify account
- Railway/Heroku account
- Domain name (optional)

### 2. Database Setup (MongoDB Atlas)

```bash
# 1. Create MongoDB Atlas cluster
# 2. Create database user
# 3. Whitelist IP addresses (0.0.0.0/0 for development)
# 4. Get connection string
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/voho-production?retryWrites=true&w=majority
```

### 3. Backend Deployment (Railway)

```bash
# 1. Connect GitHub repository
# 2. Set Node.js runtime
# 3. Configure environment variables
# 4. Deploy
```

**Railway Environment Variables:**
```env
PORT=8080
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secure-random-jwt-secret-64-chars-minimum
ULTRAVOX_API_KEY=your-ultravox-api-key
ULTRAVOX_API_URL=https://api.ultravox.ai
FRONTEND_URL=https://your-app.netlify.app
```

### 4. Frontend Deployment (Netlify)

```bash
# 1. Connect GitHub repository
# 2. Set build settings
# 3. Configure environment variables
# 4. Deploy with custom domain
```

**Netlify Build Settings:**
- **Build command:** `cd frontend && npm run build`
- **Publish directory:** `frontend/dist`
- **Node version:** 18

**Netlify Environment Variables:**
```env
VITE_API_URL=https://your-backend.railway.app/api
```

### 5. Domain Configuration

#### Netlify Custom Domain
```bash
# 1. Add custom domain in Netlify
# 2. Configure DNS records
# 3. Set up SSL certificate (automatic)
```

#### Subdomain Routing (Railway)
```bash
# Configure wildcard subdomain routing
# *.yourapp.com → your-backend.railway.app
```

## 🔧 Detailed Setup Instructions

### MongoDB Atlas Configuration

1. **Create Cluster**
   - Choose M0 (free) for development
   - Select region closest to users
   - Enable backup (recommended)

2. **Security Settings**
   ```javascript
   // Network Access
   IP Address: 0.0.0.0/0  // Allow all (restrict in production)

   // Database Access
   Username: voho-prod-user
   Password: [strong-password]
   Built-in Role: Read and write to any database
   ```

3. **Connection Optimization**
   ```javascript
   // mongoose connection options
   {
     maxPoolSize: 10,           // Connection pool
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
     bufferMaxEntries: 0,
     bufferCommands: false,
     maxIdleTimeMS: 30000,
   }
   ```

### Backend Deployment (Railway)

1. **Project Setup**
   ```bash
   # Railway CLI (optional)
   railway login
   railway link
   railway up
   ```

2. **Environment Configuration**
   ```env
   # Required
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=[64+ character random string]
   ULTRAVOX_API_KEY=sk-...

   # Optional
   REDIS_URL=redis://...
   PORT=8080
   NODE_ENV=production
   ```

3. **Health Checks**
   ```javascript
   // Add to Railway health check
   GET https://your-app.railway.app/api/health
   Expected: 200 OK with { status: "ok" }
   ```

### Frontend Deployment (Netlify)

1. **Build Configuration**
   ```toml
   # netlify.toml
   [build]
     command = "cd frontend && npm run build"
     publish = "frontend/dist"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "https://your-backend.railway.app/api/:splat"
     status = 200
   ```

2. **Environment Variables**
   ```bash
   # Netlify dashboard or CLI
   VITE_API_URL=https://your-backend.railway.app/api
   ```

3. **Custom Domain**
   ```bash
   # DNS Configuration
   # Type: CNAME
   # Name: @
   # Value: your-app.netlify.app

   # For subdomains:
   # Type: CNAME
   # Name: *.yourapp.com
   # Value: your-app.netlify.app
   ```

## 🔒 Security Hardening

### Environment Security
```bash
# Generate secure JWT secret
openssl rand -base64 64

# Never commit secrets to git
echo ".env" >> .gitignore
echo "*.key" >> .gitignore
```

### Database Security
```javascript
// MongoDB connection with SSL
mongoose.connect(uri, {
  ssl: true,
  sslValidate: true,
  sslCA: fs.readFileSync('/path/to/ca.pem')
});
```

### API Security
```javascript
// Rate limiting (add to Railway)
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}));
```

### SSL/HTTPS
- **Netlify**: Automatic SSL certificates
- **Railway**: Automatic SSL certificates
- **MongoDB Atlas**: TLS encryption required

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Add to backend
const morgan = require('morgan');
app.use(morgan('combined')); // Structured logging

// Error tracking (Sentry)
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Database Monitoring
```javascript
// MongoDB Atlas monitoring
// - Performance metrics
// - Slow query analysis
// - Connection monitoring
// - Backup status
```

### Uptime Monitoring
```bash
# Health check endpoints
GET /api/health         # Basic health
GET /api/health/detailed # Detailed status
GET /api/health/db      # Database connectivity
```

## 🚀 Performance Optimization

### Frontend Optimization
```javascript
// Vite production build
npm run build

// Features enabled:
✅ Code splitting
✅ Tree shaking
✅ Asset optimization
✅ Gzip compression
✅ Service worker (PWA ready)
```

### Backend Optimization
```javascript
// Production middleware
app.use(compression());  // Gzip compression
app.use(helmet());       // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Database Optimization
```javascript
// Connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
});

// Indexing strategy
db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true });
db.calls.createIndex({ tenantId: 1, createdAt: -1 });
```

## 🔄 Backup & Recovery

### Database Backup
```bash
# MongoDB Atlas automated backups
# - Daily snapshots
# - Point-in-time recovery
# - Cross-region replication
```

### Application Backup
```bash
# Environment variables backup
# - Encrypted storage
# - Version controlled (masked)

# Code repository
# - GitHub backup
# - Branch protection rules
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
# Verify environment variables
# Check Node.js version compatibility
```

#### 2. Database Connection
```bash
# Verify connection string
# Check IP whitelisting
# Test with MongoDB Compass
```

#### 3. CORS Issues
```bash
# Verify FRONTEND_URL in backend
# Check CORS configuration
# Test with browser dev tools
```

#### 4. Authentication Issues
```bash
# Verify JWT_SECRET consistency
# Check token expiration
# Validate tenant isolation
```

### Debug Commands
```bash
# Test API endpoints
curl -X GET https://your-backend.railway.app/api/health

# Test database connection
mongosh "mongodb+srv://..."

# Check application logs
railway logs
netlify logs
```

## 📈 Scaling Strategy

### Vertical Scaling
```bash
# Railway plans
# - Starter: 512MB RAM, 1 CPU
# - Standard: 1GB RAM, 1 CPU
# - Pro: 2GB RAM, 2 CPU
```

### Horizontal Scaling
```javascript
// Stateless design supports multiple instances
// Load balancer automatically distributes traffic
// Redis for session/caching consistency
```

### Database Scaling
```javascript
// MongoDB Atlas scaling
// - Vertical: Increase RAM/CPU
// - Horizontal: Sharding by tenantId
// - Read replicas for performance
```

## 🎯 Go-Live Checklist

### Pre-Launch
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificates active
- [ ] Domain DNS configured
- [ ] Backup strategy in place
- [ ] Monitoring tools set up

### Launch Day
- [ ] Deploy backend first
- [ ] Test API endpoints
- [ ] Deploy frontend
- [ ] Test complete user flow
- [ ] Monitor error logs
- [ ] Verify analytics

### Post-Launch
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Monitor performance metrics
- [ ] Plan capacity scaling

## 📞 Support

### Emergency Contacts
- **Database Issues**: MongoDB Atlas support
- **Platform Issues**: Railway/Netlify support
- **Application Issues**: Development team

### Monitoring Dashboards
- **Railway**: Application metrics
- **Netlify**: Frontend analytics
- **MongoDB Atlas**: Database performance
- **Custom**: Application-specific dashboards

---

**Deployment Time**: ~30 minutes
**Cost Estimate**: $0-50/month (free tier)
**Scalability**: Supports 1000+ tenants

Ready for production! 🚀
