# 🚀 Voho SaaS Deployment Guide

Complete step-by-step instructions for deploying the Voho SaaS application to production.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: Push your code to GitHub
2. **MongoDB Atlas**: Set up a MongoDB database
3. **Ultravox API Key**: Get API access from Ultravox
4. **Vercel Account**: For frontend deployment
5. **Render Account**: For backend deployment

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster
```bash
# Visit: https://cloud.mongodb.com
# 1. Create a free M0 cluster
# 2. Choose your preferred cloud provider and region
# 3. Set cluster name (e.g., "voho-saas-prod")
```

### 2. Configure Database Access
```bash
# In MongoDB Atlas Dashboard:
# 1. Go to "Database Access" → "Add New Database User"
# 2. Create user with read/write permissions
# 3. Go to "Network Access" → "Add IP Address"
# 4. Allow access from anywhere (0.0.0.0/0) or specific IPs
```

### 3. Get Connection String
```bash
# In "Clusters" → "Connect" → "Connect your application"
# Choose "Node.js" and copy the connection string
# Format: mongodb+srv://username:password@cluster.mongodb.net/database
```

## 🔧 Backend Deployment (Render)

### Option 1: Using Render Dashboard

1. **Connect Repository**
   ```bash
   # Visit: https://render.com
   # 1. Click "New" → "Web Service"
   # 2. Connect your GitHub repository
   # 3. Select branch (main/master)
   ```

2. **Configure Service**
   ```bash
   # Service Settings:
   Name: voho-saas-backend
   Runtime: Docker
   Build Command: (leave empty - handled by Dockerfile)
   Start Command: (leave empty - handled by Dockerfile)
   ```

3. **Environment Variables**
   ```bash
   # Add these environment variables:
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voho-prod
   JWT_SECRET=your-super-secure-random-jwt-secret-64-chars-minimum
   ULTRAVOX_API_KEY=sk-your-ultravox-api-key
   ULTRAVOX_API_URL=https://api.ultravox.ai
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Deploy**
   ```bash
   # Click "Create Web Service"
   # Wait for deployment to complete
   # Note the service URL (e.g., https://voho-saas-backend.onrender.com)
   ```

### Option 2: Using render.yaml (Recommended)

1. **Push render.yaml to GitHub**
   ```bash
   git add render.yaml backend/
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy via Render Dashboard**
   ```bash
   # 1. Go to Render Dashboard
   # 2. Click "New" → "Blueprint"
   # 3. Connect your repository
   # 4. Render will auto-detect render.yaml
   # 5. Set environment variables
   # 6. Click "Apply"
   ```

## 🎨 Frontend Deployment (Vercel)

### Method 1: Vercel Dashboard

1. **Connect Repository**
   ```bash
   # Visit: https://vercel.com
   # 1. Click "New Project"
   # 2. Import your GitHub repository
   # 3. Configure project settings
   ```

2. **Project Configuration**
   ```bash
   # Framework Preset: Other
   # Root Directory: ./
   # Build Command: cd frontend && npm run build
   # Output Directory: frontend/dist
   ```

3. **Environment Variables**
   ```bash
   # Add environment variable:
   VITE_API_URL=https://your-render-backend.onrender.com
   ```

4. **Deploy**
   ```bash
   # Click "Deploy"
   # Wait for build completion
   # Note the deployment URL (e.g., https://voho-saas.vercel.app)
   ```

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   # Login to Vercel
   vercel login

   # Deploy project
   vercel --prod

   # Follow prompts to configure project
   # Set build command: cd frontend && npm run build
   # Set output directory: frontend/dist
   ```

## 🔗 Connect Frontend to Backend

### Update Vercel Environment Variable

1. **In Vercel Dashboard**
   ```bash
   # 1. Go to your project settings
   # 2. Navigate to "Environment Variables"
   # 3. Update VITE_API_URL with your Render backend URL
   # 4. Redeploy the frontend
   ```

2. **Update Backend CORS**
   ```bash
   # In Render dashboard, update FRONTEND_URL environment variable
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

## 🧪 Testing Deployment

### Health Checks

1. **Backend Health Check**
   ```bash
   curl https://your-render-backend.onrender.com/api/health
   # Should return: {"status":"ok","tenant":"none"}
   ```

2. **Frontend Access**
   ```bash
   # Visit: https://your-vercel-app.vercel.app
   # Should load the Voho SaaS application
   ```

### Functional Testing

1. **Signup Flow**
   ```bash
   # Try creating a new tenant account
   # Should redirect to dashboard after signup
   ```

2. **API Connectivity**
   ```bash
   # Check browser dev tools for API calls
   # Should connect to Render backend without CORS errors
   ```

## 🔒 Security Configuration

### Environment Variables Security

1. **JWT Secret Generation**
   ```bash
   # Generate secure JWT secret
   openssl rand -base64 64
   # Use output as JWT_SECRET
   ```

2. **MongoDB Security**
   ```bash
   # Restrict IP access in MongoDB Atlas
   # Add only Render service IP ranges
   # Use strong database password
   ```

3. **API Key Protection**
   ```bash
   # Store Ultravox API key securely
   # Never expose in frontend code
   # Rotate keys regularly
   ```

## 📊 Monitoring & Maintenance

### Backend Monitoring (Render)

1. **Logs**
   ```bash
   # View application logs in Render dashboard
   # Monitor for errors and performance issues
   ```

2. **Metrics**
   ```bash
   # Monitor CPU, memory, and response times
   # Set up alerts for downtime
   ```

### Frontend Monitoring (Vercel)

1. **Analytics**
   ```bash
   # Enable Vercel Analytics for performance monitoring
   # Monitor Core Web Vitals
   ```

2. **Error Tracking**
   ```bash
   # Use Sentry or similar for error tracking
   # Monitor JavaScript errors
   ```

## 🚀 Production Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables prepared
- [ ] Ultravox API key obtained
- [ ] Domain name configured (optional)

### Deployment
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] API connectivity tested
- [ ] CORS properly configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Signup/login flow working
- [ ] Dashboard loading correctly
- [ ] Call creation functional
- [ ] Monitoring enabled
- [ ] SSL certificates active

## 🆘 Troubleshooting

### Common Issues

#### Backend Deployment Issues
```bash
# Check Render build logs for errors
# Verify environment variables are set
# Check MongoDB connection string
# Ensure PORT is set to 10000
```

#### Frontend Deployment Issues
```bash
# Check Vercel build logs
# Verify VITE_API_URL is correct
# Check for CORS errors in browser console
# Ensure build command is correct
```

#### Connectivity Issues
```bash
# Test backend health endpoint
# Check Render service is running
# Verify environment variables match
# Check MongoDB Atlas network access
```

## 💰 Cost Estimation

### Free Tier Usage
- **Render**: 750 hours/month free
- **Vercel**: 100GB bandwidth/month free
- **MongoDB Atlas**: 512MB free storage

### Paid Upgrades (if needed)
- **Render**: $7/month for persistent apps
- **Vercel**: $20/month for pro features
- **MongoDB Atlas**: $9/month for 2GB storage

## 📞 Support

### Platform Support
- **Render**: https://docs.render.com/
- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

### Application Issues
- Check deployment logs
- Test API endpoints manually
- Verify environment variables
- Check database connectivity

---

**🎉 Your Voho SaaS application is now deployed and ready for production use!**

**Frontend URL**: https://your-vercel-app.vercel.app
**Backend API**: https://your-render-backend.onrender.com
