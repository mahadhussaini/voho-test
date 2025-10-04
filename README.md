# Voho SaaS - Multi-Tenant Application with Ultravox Integration

A production-ready multi-tenant SaaS application demonstrating secure, scalable architecture with real-time Ultravox API integration.

## 🚀 Live Demo

**Frontend**: [Deployed on Vercel](https://your-vercel-app.vercel.app) (Replace with actual Vercel URL)  
**Backend API**: [Deployed on Render](https://your-render-backend.onrender.com) (Replace with actual Render URL)

## ✨ Features

### Multi-Tenant SaaS Basics
- ✅ **Tenant Authentication**: Secure signup/login with JWT tokens
- ✅ **Subdomain Routing**: Each tenant gets their own subdomain (e.g., `acme.yourapp.com`)
- ✅ **Data Isolation**: Complete tenant data separation at database level
- ✅ **Configurable Branding**: Logo, company name, and primary colors per tenant

### Ultravox Integration
- ✅ **Real-Time Calls**: Create and monitor Ultravox calls with live status updates
- ✅ **Call Management**: Queue → Ringing → In Progress → Completed/Ended status flow
- ✅ **Transcript & Recording**: Access call transcripts and audio recordings
- ✅ **Event Streaming**: Real-time event updates for call activities

### Dashboard & Analytics
- ✅ **Role-Based Access**: Admin vs. regular user dashboards
- ✅ **Real-Time Metrics**: Live updating analytics (calls, users, performance)
- ✅ **Activity Monitoring**: Recent calls, status breakdowns, audit logs
- ✅ **Performance Analytics**: Call duration stats, success rates, trends

### Security & Architecture
- ✅ **Password Hashing**: Bcrypt with salt rounds
- ✅ **JWT Authentication**: Secure token-based auth with expiration
- ✅ **Tenant Isolation**: Database-level separation with middleware enforcement
- ✅ **Audit Logging**: Comprehensive security and activity logging
- ✅ **Input Validation**: Robust validation and error handling

## 🏗️ Architecture

### Backend (Express.js + MongoDB)
```
backend/
├── models/          # Mongoose schemas (User, Tenant, Call, AuditLog)
├── routes/          # API endpoints (auth, tenant, calls, dashboard)
├── middleware/      # Auth, tenant isolation, error handling
├── services/        # Ultravox API integration
├── utils/           # JWT, audit logging utilities
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/  # Reusable UI components (Shadcn/UI)
│   ├── pages/       # Route components (Dashboard, Calls, Settings)
│   ├── lib/         # API client, utilities
│   ├── store/       # Zustand state management
│   └── App.jsx      # Main application with routing
```

### Key Design Patterns

#### 1. Tenant Isolation
- **Database Level**: All models include `tenantId` field
- **Middleware Level**: `tenantMiddleware` resolves tenant from subdomain
- **Query Level**: All queries filtered by tenant automatically
- **Audit Level**: Cross-tenant access attempts are logged and blocked

#### 2. Real-Time Updates
- **Polling Strategy**: Dashboard and call status poll every 5-15 seconds
- **WebSocket Ready**: Architecture supports WebSocket upgrades
- **Optimistic UI**: Immediate UI updates with background sync

#### 3. Security First
- **Authentication**: JWT with tenant context
- **Authorization**: Role-based access (admin/user)
- **Audit Trail**: All sensitive operations logged
- **Input Sanitization**: Comprehensive validation

## 🔧 Tech Stack

### Backend
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Caching**: Redis (optional for performance)

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Shadcn/UI + Radix UI primitives
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Styling**: Tailwind CSS

### Infrastructure
- **Deployment**: Netlify (Frontend) + Railway/Heroku (Backend)
- **Database**: MongoDB Atlas
- **Caching**: Redis Cloud (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd voho-test
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Services**
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run client

# Or run both concurrently
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### 🎨 Brand Assets

The application includes professional SVG brand assets:
- **Logo**: `/frontend/public/logo.svg` - Main brand logo
- **Favicon**: `/frontend/public/favicon.svg` - Browser tab icon
- **Responsive**: Both assets are optimized for all screen sizes
- **Customizable**: Logo adapts to tenant branding colors

### 🚀 Production Deployment

**Frontend**: Deployed on Vercel with automatic builds from GitHub
**Backend**: Deployed on Render with Docker containerization

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/voho-saas

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Ultravox API
ULTRAVOX_API_KEY=your-ultravox-api-key
ULTRAVOX_API_URL=https://api.ultravox.ai

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Code Quality

```bash
# Run linting for frontend and backend
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Frontend only linting
cd frontend && npm run lint

# Backend only linting
npx eslint backend/**/*.js --ignore-pattern 'backend/node_modules/**'
```

## 🚀 Deployment

### Frontend (Netlify)
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/dist`
4. Add environment variables

### Backend (Railway/Heroku)
1. Connect GitHub repository
2. Set Node.js runtime
3. Add environment variables
4. Configure MongoDB connection

### Production Checklist
- [ ] Change JWT secret
- [ ] Set NODE_ENV=production
- [ ] Configure production MongoDB
- [ ] Set up Redis (optional)
- [ ] Configure Ultravox API key
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging

## 🔒 Security Features

### Authentication
- Password hashing with bcrypt (12 rounds)
- JWT tokens with 7-day expiration
- Automatic token refresh handling

### Authorization
- Role-based access control (admin/user)
- Tenant-scoped operations
- Admin-only features protected

### Data Protection
- Tenant data isolation at database level
- No cross-tenant data leakage
- Secure API endpoints with validation

### Audit & Monitoring
- Comprehensive audit logging
- Security violation detection
- Activity monitoring and reporting

## 📊 API Documentation

### Authentication
```http
POST /api/auth/signup
POST /api/auth/login
```

### Tenant Management
```http
GET  /api/tenant/branding
PUT  /api/tenant/branding
GET  /api/tenant/info
```

### Calls
```http
POST /api/calls              # Create call
GET  /api/calls              # List calls
GET  /api/calls/:id          # Get call details
GET  /api/calls/:id/status   # Get real-time status
GET  /api/calls/:id/transcript # Get transcript
```

### Dashboard
```http
GET  /api/dashboard/metrics  # Get metrics
GET  /api/dashboard/stats    # Get statistics
GET  /api/dashboard/audit-logs # Get audit logs (admin)
```

## 🔧 Development

### Code Quality
- ESLint configuration
- Prettier formatting
- Modular architecture

### Performance
- Database indexing on tenant fields
- Query optimization
- Caching layer ready (Redis)
- Efficient React re-renders

### Scalability
- Horizontal scaling ready
- Database sharding support
- CDN-ready static assets
- Microservices architecture friendly

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Ultravox AI](https://ultravox.ai) for the voice API
- [Shadcn/UI](https://ui.shadcn.com) for the component library
- [TanStack Query](https://tanstack.com/query) for data fetching
- [Zustand](https://zustand-demo.pmnd.rs) for state management

---

Built with ❤️ for the Voho Senior Software Engineer Technical Test
