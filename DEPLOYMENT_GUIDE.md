# 🚀 Deploying Chanakya Backend to Render

## Prerequisites
- ✅ GitHub account
- ✅ Render account (sign up at https://render.com)
- ✅ MongoDB Atlas database (already configured)
- ✅ API Keys: Gemini, Twilio (optional), Sarvam AI (optional)

---

## Step 1: Prepare Repository

### 1.1 Commit All Changes
```bash
cd "C:\Users\kauti\OneDrive\Desktop\Hackathon Projects\Chanakya"
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 1.2 Verify .gitignore
Ensure `.env` files are NOT pushed to GitHub:
```bash
git status
# Should NOT see .env files listed
```

---

## Step 2: Deploy on Render

### 2.1 Create New Web Service

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **Kautilya346/Chanakya**
5. Click **"Connect"**

### 2.2 Configure Service

Render will auto-detect `render.yaml`. Configure these settings:

**Basic Settings:**
- **Name:** `chanakya-backend`
- **Region:** Oregon (or closest to you)
- **Branch:** `main`
- **Root Directory:** `Server`
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `cd Web_server && uvicorn main:app --host 0.0.0.0 --port $PORT`

**Advanced Settings:**
- **Health Check Path:** `/health`
- **Auto-Deploy:** Yes (deploys on git push)

### 2.3 Add Environment Variables

Click **"Environment"** tab and add these variables:

**Required:**
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
MONGODB_URL=mongodb+srv://kautilyasrivastava07:4V16P4rd7cBDrbaF@cluster0.5leoy.mongodb.net/Chanakya?retryWrites=true&w=majority
SECRET_KEY=your_random_secret_key_at_least_32_chars
```

**Optional (for full functionality):**
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SARVAM_API_KEY=your_sarvam_api_key
```

**Configuration:**
```
DATABASE_NAME=Chanakya
ACCESS_TOKEN_EXPIRE_DAYS=7
ENV=production
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building (15-20 minutes first time due to ML models)
3. Watch the logs for any errors

### 2.5 Get Your Backend URL

Once deployed, you'll get a URL like:
```
https://chanakya-backend.onrender.com
```

**Test it:**
```
https://chanakya-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Chanakya API is running"
}
```

---

## Step 3: Update Twilio Webhooks

If using Twilio, update in Twilio Console (https://console.twilio.com):

1. Go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click your phone number
3. Update webhooks:

**Voice Configuration:**
- When a call comes in: `https://chanakya-backend.onrender.com/api/twilio/voice`
- Method: `HTTP POST`

**Messaging Configuration:**
- When a message comes in: `https://chanakya-backend.onrender.com/api/twilio/sms`
- Method: `HTTP POST`

4. Update environment variable in Render:
```
TWILIO_WEBHOOK_URL=https://chanakya-backend.onrender.com
```

---

## Step 4: Update Frontend (Vercel)

### 4.1 Update API URL in Code

The API client already uses environment variables, so just add to Vercel:

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Add:
```
VITE_API_URL=https://chanakya-backend.onrender.com
```

3. Redeploy frontend:
```bash
cd Client_F/front_chanak
git add .
git commit -m "Update API URL for production"
git push
```

Vercel will auto-deploy.

### 4.2 Update CORS in Backend

Once you have your Vercel URL (e.g., `https://chanakya.vercel.app`):

1. Go to Render dashboard → **chanakya-backend** → **Environment**
2. Update `CORS_ORIGINS`:
```
CORS_ORIGINS=http://localhost:5173,https://chanakya.vercel.app,https://*.vercel.app
```

3. Save changes (Render will auto-redeploy)

---

## Step 5: Verify Deployment

### 5.1 Test Backend Endpoints

```bash
# Health check
curl https://chanakya-backend.onrender.com/health

# Orchestrator status
curl https://chanakya-backend.onrender.com/api/query/status

# Twilio status (if configured)
curl https://chanakya-backend.onrender.com/api/twilio/status
```

### 5.2 Test Frontend

1. Open your Vercel URL: `https://chanakya.vercel.app`
2. Try login/signup
3. Send a test query
4. Check if voice recording works (if Sarvam configured)

### 5.3 Test Twilio Integration

1. Call your Twilio number
2. Record a question
3. Verify SMS response received

---

## Common Issues & Solutions

### Issue 1: Build Takes Too Long
**Cause:** Downloading large ML models (sentence-transformers, torch)
**Solution:** Wait 15-20 minutes on first deploy. Subsequent deploys are faster (cached).

### Issue 2: Cold Start Delay
**Cause:** Free tier sleeps after 15 min inactivity
**Solution:** 
- Upgrade to paid tier ($7/month) for always-on
- Or use cron job to ping `/health` every 10 minutes

### Issue 3: CORS Errors
**Cause:** Frontend URL not in CORS_ORIGINS
**Solution:** Add exact Vercel URL to `CORS_ORIGINS` environment variable

### Issue 4: Module Import Errors
**Cause:** Missing dependencies or incorrect paths
**Solution:** Check Render logs, verify all imports in `requirements.txt`

### Issue 5: Database Connection Failed
**Cause:** MongoDB URL incorrect or network restrictions
**Solution:** 
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check MONGODB_URL environment variable

### Issue 6: Twilio Webhooks Not Working
**Cause:** Incorrect webhook URLs or HTTPS required
**Solution:**
- Verify Render URL uses HTTPS (automatic)
- Update webhook URLs in Twilio console
- Check Render logs for incoming webhook calls

---

## Monitoring & Maintenance

### View Logs
Render Dashboard → **chanakya-backend** → **Logs** (real-time)

### Monitor Performance
Render Dashboard → **Metrics** tab
- Request rate
- Response time
- Memory usage
- CPU usage

### Update Deployment
```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Render auto-deploys within 2-3 minutes
```

### Manual Redeploy
Render Dashboard → **Manual Deploy** → **Deploy latest commit**

---

## Scaling Considerations

### Free Tier Limits:
- 750 hours/month
- Sleeps after 15 min inactivity
- 512MB RAM
- 0.5 CPU

### When to Upgrade ($7/month):
- Always-on (no cold starts)
- Better performance
- 512MB → 2GB RAM
- More concurrent requests

### Database Scaling:
- MongoDB Atlas M0 (free) handles ~100 req/sec
- Upgrade to M10 ($57/month) for production scale

---

## Security Checklist

✅ `.env` files not in git
✅ SECRET_KEY is strong and random
✅ MongoDB credentials secured
✅ API keys stored as environment variables
✅ CORS configured with specific origins
✅ HTTPS enabled (automatic on Render)
✅ Twilio webhook signature validation (optional, currently disabled for testing)

---

## Next Steps After Deployment

1. **Set up monitoring:** Add error tracking (Sentry, LogRocket)
2. **Configure custom domain:** Add your own domain in Render settings
3. **Set up backups:** MongoDB Atlas auto-backups
4. **Load testing:** Test with realistic traffic
5. **Documentation:** Update README with production URLs

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com/
- **Community:** https://community.render.com/

---

## Emergency Rollback

If something breaks:

1. Go to Render Dashboard → **Events** tab
2. Find last working deployment
3. Click **"Rollback to this version"**

Or via git:
```bash
git revert HEAD
git push origin main
```

---

**Deployment URL:** https://chanakya-backend.onrender.com (replace with your actual URL)
**Frontend URL:** https://chanakya.vercel.app (replace with your actual URL)

---

Good luck with your deployment! 🚀
