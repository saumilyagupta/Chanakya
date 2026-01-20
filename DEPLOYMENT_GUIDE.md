# 🚀 Chanakya Deployment Guide

This guide covers deploying Chanakya to production environments.

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Deployment](#production-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Render Deployment (Backend)](#render-deployment-backend)
5. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Local Development Setup

### Quick Start (Script-Based)

The fastest way to set up locally:

**Windows:**
```cmd
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya
setup.bat    # Installs everything
run.bat      # Starts both servers
```

**Unix/Linux/Mac:**
```bash
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya
chmod +x setup.sh run.sh
./setup.sh    # Installs everything
./run.sh      # Starts both servers
```

### Manual Setup (Alternative)

```powershell
# 1. Clone and enter directory
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya

# 2. Setup Python environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
source venv/bin/activate       # Unix
pip install -r requirements.txt
pip install -r Server/requirements.txt

# 3. Setup Frontend
cd Client_F/front_chanak && npm install && cd ../..

# 4. Configure environment
# Edit .env in project root with your API keys

# 5. Start servers (two terminals)
# Terminal 1: python Server/Web_server/main.py
# Terminal 2: cd Client_F/front_chanak && npm run dev
```

### Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Docs | http://localhost:3000/docs |

---

## 🌍 Production Deployment

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Render        │────▶│  MongoDB Atlas  │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   React + Vite  │     │   FastAPI       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   External APIs │
                        │   - Gemini AI   │
                        │   - Sarvam AI   │
                        │   - Twilio      │
                        └─────────────────┘
```

---

## 🔑 Environment Configuration

### Root .env File

All configuration is centralized in a single `.env` file at the project root:

```env
# ==================== API URLs ====================
VITE_API_URL=http://localhost:3000  # Change for production

# ==================== Sarvam AI Configuration ====================
SARVAM_API_KEY=your-sarvam-api-key
VITE_SARVAM_API_KEY=your-sarvam-api-key
VITE_SARVAM_API_URL=https://api.sarvam.ai/speech-to-text
VITE_SARVAM_TTS_API_URL=https://api.sarvam.ai/text-to-speech

# ==================== Google Gemini API ====================
GEMINI_API_KEY=your-gemini-api-key

# ==================== MongoDB Configuration ====================
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/Chanakya
DATABASE_NAME=Chanakya

# ==================== JWT Configuration ====================
SECRET_KEY=your-production-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRE_DAYS=7

# ==================== Environment ====================
ENV=production
DEBUG=false
LOG_LEVEL=INFO

# ==================== Twilio Configuration (Optional) ====================
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-backend.onrender.com

# ==================== CORS Configuration ====================
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

---

## 🎯 Render Deployment (Backend)

### Step 1: Prepare Repository

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: **Kautilya346/Chanakya**
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `chanakya-backend` |
| Region | Oregon (or closest) |
| Branch | `main` |
| Root Directory | `Server` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `cd Web_server && uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Step 3: Add Environment Variables

In Render dashboard → Environment tab:

**Required:**
```
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URL=mongodb+srv://...
SECRET_KEY=your_secure_random_key
DATABASE_NAME=Chanakya
ENV=production
DEBUG=false
```

**Optional:**
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SARVAM_API_KEY=...
CORS_ORIGINS=https://your-app.vercel.app
```

### Step 4: Deploy

Click **"Create Web Service"** - first deployment takes 15-20 minutes.

### Backend URL

Your backend will be available at:
```
https://chanakya-backend.onrender.com
```

Test: `https://chanakya-backend.onrender.com/health`

---

## 🔷 Vercel Deployment (Frontend)

### Step 1: Connect Repository

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Root Directory | `Client_F/front_chanak` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Step 2: Add Environment Variables

In Vercel → Project Settings → Environment Variables:

```
VITE_API_URL=https://chanakya-backend.onrender.com
VITE_SARVAM_API_KEY=your-sarvam-key
VITE_SARVAM_API_URL=https://api.sarvam.ai/speech-to-text
VITE_SARVAM_TTS_API_URL=https://api.sarvam.ai/text-to-speech
```

### Step 3: Deploy

Click **"Deploy"** - deployment takes 2-3 minutes.

### Step 4: Update Backend CORS

After getting your Vercel URL, update Render environment:

```
CORS_ORIGINS=https://chanakya.vercel.app,https://*.vercel.app
```

---

## 🔄 CI/CD Workflow

Both Render and Vercel auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Both services auto-deploy within 2-5 minutes
```

---

## 📊 Monitoring & Maintenance

### View Logs

**Render:** Dashboard → chanakya-backend → Logs

**Vercel:** Dashboard → Project → Functions (for serverless logs)

### Health Checks

```bash
# Backend
curl https://chanakya-backend.onrender.com/health

# API Status
curl https://chanakya-backend.onrender.com/api/query/status
```

### Update Dependencies

```bash
# Update locally
pip freeze > requirements.txt
npm update

# Push to deploy
git add . && git commit -m "Update dependencies" && git push
```

---

## ⚠️ Troubleshooting

### Issue 1: Build Takes Too Long (15+ min)

**Cause:** Downloading large ML models
**Solution:** Wait for first build; subsequent builds are faster (cached)

### Issue 2: Cold Start Delay (Free Tier)

**Cause:** Render free tier sleeps after 15 min inactivity
**Solutions:**
- Upgrade to paid tier ($7/month)
- Use cron job to ping `/health` every 10 minutes

### Issue 3: CORS Errors

**Cause:** Frontend URL not in CORS_ORIGINS
**Solution:** Add exact Vercel URL to `CORS_ORIGINS` in Render

### Issue 4: MongoDB Connection Failed

**Cause:** IP restrictions or wrong URL
**Solutions:**
- MongoDB Atlas: Allow connections from 0.0.0.0/0
- Verify MONGODB_URL is correct

### Issue 5: Twilio Webhooks Not Working

**Solutions:**
- Verify webhook URL uses HTTPS
- Update Twilio console with Render URL
- Check Render logs for incoming requests

---

## 🔒 Security Checklist

- ✅ `.env` files not in git (check `.gitignore`)
- ✅ `SECRET_KEY` is random and 32+ characters
- ✅ MongoDB credentials secured
- ✅ API keys stored as environment variables (not in code)
- ✅ CORS configured with specific origins (not `*`)
- ✅ HTTPS enabled (automatic on Render/Vercel)
- ✅ Database user has minimal required permissions

---

## 📈 Scaling Considerations

### Render Free Tier Limits
- 750 hours/month
- Sleeps after 15 min inactivity
- 512MB RAM, 0.5 CPU

### When to Upgrade
- Always-on requirement → Starter ($7/month)
- More RAM/CPU → Standard or higher
- High traffic → Auto-scaling

### MongoDB Atlas Scaling
- M0 (free): ~100 req/sec
- M10 ($57/month): Production workloads
- M30+: High availability

---

## 🔄 Rollback

### Render
1. Dashboard → Events tab
2. Find last working deployment
3. Click **"Rollback to this version"**

### Vercel
1. Dashboard → Deployments
2. Find working deployment
3. Click **"..."** → **"Promote to Production"**

### Git Rollback
```bash
git revert HEAD
git push origin main
```

---

## 📞 Support Resources

| Resource | URL |
|----------|-----|
| Render Docs | https://render.com/docs |
| Vercel Docs | https://vercel.com/docs |
| MongoDB Atlas | https://docs.atlas.mongodb.com |
| Project Issues | https://github.com/Kautilya346/Chanakya/issues |

---

## 🎉 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] User authentication works
- [ ] AI queries return responses
- [ ] Voice features work (if Sarvam configured)
- [ ] Analytics accessible
- [ ] CORS properly configured
- [ ] Monitoring set up

---

**Production URLs:**
- Backend: `https://chanakya-backend.onrender.com`
- Frontend: `https://chanakya.vercel.app`

*(Replace with your actual URLs)*
