# 🚂 Railway Deployment Guide for Movie Explorer Backend

This guide will help you deploy your Movie Explorer FastAPI backend to Railway.

## 🚀 Quick Deployment (Recommended)

### **Step 1: Prepare Your Repository**

1. **Ensure your code is in GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Required files are ready:**
   - ✅ `backend/requirements.txt` (with gunicorn)
   - ✅ `backend/Procfile` 
   - ✅ `backend/railway.json`
   - ✅ `backend/railway_setup.py`

### **Step 2: Deploy to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your movie-explorer repository**
6. **Select the backend folder** as the root directory

### **Step 3: Add PostgreSQL Database**

1. **In your Railway project dashboard:**
   - Click "**+ New**"
   - Select "**Database**"
   - Choose "**PostgreSQL**"

2. **Copy the DATABASE_URL:**
   - Go to your PostgreSQL service
   - Click "**Variables**" tab
   - Copy the `DATABASE_URL` value

### **Step 4: Configure Environment Variables**

**In your backend service, add these variables:**

```bash
# Required Variables
DATABASE_URL=postgresql://postgres:password@host:5432/railway
TMDB_API_KEY=57d74fbc7e37c7dd45bc8dd8b3961bab

# Optional Variables
PORT=8000
FRONTEND_URL=https://your-frontend-domain.vercel.app
RAILWAY_STATIC_URL=your-backend-domain.railway.app
```

### **Step 5: Deploy and Test**

1. **Railway will automatically deploy**
2. **Check the deployment logs**
3. **Test your API:**
   ```bash
   curl https://your-backend.railway.app/health
   curl https://your-backend.railway.app/movies
   ```

---

## 🛠️ Manual Setup (Alternative)

### **Using Railway CLI**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy:**
   ```bash
   railway login
   railway link
   railway up
   ```

3. **Add PostgreSQL:**
   ```bash
   railway add postgresql
   ```

4. **Set environment variables:**
   ```bash
   railway variables set TMDB_API_KEY=57d74fbc7e37c7dd45bc8dd8b3961bab
   ```

---

## 🗄️ Database Setup

### **Automatic Setup (Recommended)**

Railway will automatically:
1. ✅ Create database tables
2. ✅ Run the setup script
3. ✅ Seed with MovieLens data (if data files are included)

### **Manual Database Seeding**

If you need to manually seed:

1. **Connect to your Railway backend:**
   ```bash
   railway shell
   ```

2. **Run the seeder:**
   ```bash
   python railway_setup.py
   # or
   python seed_movielens_ml100k.py
   ```

---

## 📁 Required Project Structure

```
movie-explorer/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   └── ...
│   ├── data/               # MovieLens data files
│   │   ├── u.item
│   │   └── u.data
│   ├── requirements.txt    # ✅ Updated with gunicorn
│   ├── Procfile           # ✅ Railway start command
│   ├── railway.json       # ✅ Railway config
│   └── railway_setup.py   # ✅ Database initialization
└── frontend/
    └── ...
```

---

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `TMDB_API_KEY` | ✅ | TMDb API key for movie data | `57d74fbc7e37c7dd45bc8dd8b3961bab` |
| `PORT` | ⚪ | Server port (Railway sets automatically) | `8000` |
| `FRONTEND_URL` | ⚪ | Your frontend URL for CORS | `https://app.vercel.app` |
| `RAILWAY_STATIC_URL` | ⚪ | Railway domain for CORS | `app.railway.app` |

---

## 🔍 Troubleshooting

### **Common Issues:**

1. **Build Fails:**
   ```
   Solution: Check requirements.txt has all dependencies
   ```

2. **Database Connection Error:**
   ```
   Solution: Verify DATABASE_URL is set correctly
   ```

3. **Import Errors:**
   ```
   Solution: Ensure all app modules are in the backend folder
   ```

4. **CORS Errors:**
   ```
   Solution: Add your frontend URL to FRONTEND_URL variable
   ```

### **Check Deployment Status:**

```bash
# View logs
railway logs

# Check variables
railway variables

# Test health endpoint
curl https://your-app.railway.app/health
```

---

## 📊 Monitoring

### **Railway Dashboard:**
- ✅ View deployment logs
- ✅ Monitor resource usage
- ✅ Check service health
- ✅ Manage environment variables

### **API Endpoints to Test:**
```bash
# Health check
curl https://your-app.railway.app/health

# Get movies
curl https://your-app.railway.app/movies

# API documentation
https://your-app.railway.app/docs
```

---

## 💰 Railway Pricing

- **Hobby Plan:** $5/month
  - ✅ Unlimited projects
  - ✅ PostgreSQL included
  - ✅ Custom domains
  - ✅ 500 hours execution time

- **Pro Plan:** $20/month
  - ✅ Everything in Hobby
  - ✅ Priority support
  - ✅ More resources

---

## 🎉 Post-Deployment

### **Update Frontend:**
```javascript
// In your frontend .env
VITE_API_BASE_URL=https://your-backend.railway.app
```

### **Test Integration:**
1. ✅ Frontend can connect to Railway backend
2. ✅ Movie data loads correctly
3. ✅ Actor search works
4. ✅ All API endpoints respond

### **Custom Domain (Optional):**
1. Go to Railway dashboard
2. Click on your service
3. Go to "Settings" → "Domains"
4. Add your custom domain

---

## 📞 Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** [railway.app/discord](https://railway.app/discord)
- **Railway Status:** [status.railway.app](https://status.railway.app)

---

**🚂 Your Movie Explorer backend is now ready for Railway! All aboard! 🎉**
