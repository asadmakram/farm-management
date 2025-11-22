# 🚀 Deployment Guide - Free Hosting Options

## Quick Start - Deploy in 5 Minutes

### Option 1: Render.com (Recommended)
**Free Tier**: 750 hours/month, Auto-sleep after inactivity

#### Step-by-Step:

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dairy-farm-management.git
git push -u origin main
```

2. **Sign up at Render**: https://render.com (use GitHub login)

3. **Create MongoDB Database**:
   - Dashboard → "New +" → "MongoDB"
   - Name: `dairy-farm-mongodb`
   - Plan: Free (1GB)
   - Click "Create Database"
   - Copy the "Internal Connection String"

4. **Deploy Web Service**:
   - Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `dairy-farm-app`
     - **Environment**: Docker
     - **Region**: Choose closest to you
     - **Branch**: main
     - **Instance Type**: Free
   
5. **Environment Variables** (in Render dashboard):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<paste-your-mongodb-connection-string>
   JWT_SECRET=<generate-random-string-min-32-chars>
   CLIENT_URL=https://dairy-farm-app.onrender.com
   ```

6. **Deploy**: Click "Create Web Service"

✅ Your app will be live at: `https://dairy-farm-app.onrender.com`

---

### Option 2: Railway.app
**Free Tier**: $5 credit/month (enough for small apps)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add MongoDB
railway add mongodb

# Deploy
railway up

# Get your URL
railway domain
```

**Set Environment Variables**:
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
```

---

### Option 3: Fly.io (Docker Native)
**Free Tier**: 3 shared-cpu VMs, 160GB bandwidth

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch --no-deploy

# Add MongoDB (using Upstash or MongoDB Atlas)
# Get connection string and set it:
fly secrets set MONGODB_URI="your-mongodb-uri"
fly secrets set JWT_SECRET="your-secret-key"

# Deploy
fly deploy

# Get URL
fly open
```

---

### Option 4: Cyclic.sh (No Docker, but Serverless)
**Free Tier**: Unlimited apps, auto-sleep

For this option, we'd need to modify the setup slightly (no Docker).

---

## MongoDB Atlas (Free Database for Any Option)

If your hosting doesn't include MongoDB:

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create Free Cluster**:
   - Choose: AWS, Free Tier (M0)
   - Region: Closest to your app hosting
3. **Database Access**: Create a user
4. **Network Access**: Add IP `0.0.0.0/0` (allow all)
5. **Get Connection String**:
   - Cluster → Connect → Drivers
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `myFirstDatabase` with `dairy-farm-db`

---

## Vercel + Serverless (Alternative - No Docker)

If you want the easiest deployment (but need to modify the backend):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Note**: This requires converting the Express app to serverless functions.

---

## 🎯 Recommended Path

**For Beginners**: 
1. Use **MongoDB Atlas** (free database)
2. Deploy to **Render.com** (easiest Docker deployment)

**Total Cost**: $0/month
**Setup Time**: ~15 minutes
**Uptime**: Auto-sleeps when inactive, wakes on first request

---

## Generate JWT Secret

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online
# Visit: https://randomkeygen.com/
```

---

## Post-Deployment Checklist

✅ App is accessible at your URL  
✅ Can register a new account  
✅ Can login  
✅ Dashboard loads  
✅ Can add animals  
✅ MongoDB connection works  

---

## Troubleshooting

### App won't start:
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check Render/Railway logs

### Database connection fails:
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has read/write permissions

### Build fails:
- Check Docker build locally: `docker-compose up --build`
- Verify all dependencies in package.json
- Check Node.js version compatibility

---

## Monitoring

**Render**: Dashboard → Your Service → Logs  
**Railway**: Dashboard → Your Project → Deployments → View Logs  
**Fly.io**: `fly logs`

---

## Custom Domain (Optional)

All platforms support custom domains:
- **Render**: Settings → Custom Domain → Add your domain
- **Railway**: Settings → Domains → Add custom domain
- **Fly.io**: `fly certs add yourdomain.com`

---

## Scaling (When You Outgrow Free Tier)

**Paid Options**:
- Render: $7/month for always-on instance
- Railway: Pay-as-you-go after $5 credit
- Fly.io: ~$5-10/month for production
- DigitalOcean App Platform: $5/month

---

Need help? Open an issue or contact support!
