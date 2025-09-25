# 🚀 Movie Explorer Deployment Guide

This guide covers multiple deployment options for the Movie Explorer application.

## 📋 Quick Start (Local Production)

### 1. **Clone and Setup**
```bash
git clone <your-repo>
cd movie-explorer
cp env.example .env
# Edit .env with your values
```

### 2. **Deploy with Docker Compose**
```bash
# Build and run production stack
docker-compose -f docker-compose.prod.yml up -d --build

# Seed the database (one-time setup)
docker exec movie-explorer-backend python seed_movielens_ml100k.py

# Check health
curl http://localhost/health        # Frontend
curl http://localhost:8000/health  # Backend
```

### 3. **Access Your App**
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ☁️ Cloud Deployment Options

### Option 1: **Vercel (Frontend) + Render (Backend)**

#### **Backend on Render:**
1. Push code to GitHub
2. Connect repository to [Render](https://render.com)
3. Create PostgreSQL database on Render
4. Create Web Service with settings:
   - **Build Command**: `pip install -r requirements-prod.txt`
   - **Start Command**: `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Environment Variables**:
     ```
     DATABASE_URL=postgresql://user:pass@host:5432/dbname
     TMDB_API_KEY=your_tmdb_key
     ```

#### **Frontend on Vercel:**
1. Push frontend to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Set environment variable:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com
   ```
4. Deploy automatically from main branch

---

### Option 2: **AWS Deployment**

#### **Backend (ECS + RDS):**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker build -f backend/Dockerfile.prod -t movie-explorer-backend backend/
docker tag movie-explorer-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/movie-explorer-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/movie-explorer-backend:latest
```

#### **Frontend (S3 + CloudFront):**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-bucket-name/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

### Option 3: **Google Cloud Platform**

#### **Backend (Cloud Run):**
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/movie-explorer-backend backend/
gcloud run deploy movie-explorer-backend \
  --image gcr.io/PROJECT_ID/movie-explorer-backend \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://...",TMDB_API_KEY="..."
```

#### **Frontend (Firebase Hosting):**
```bash
cd frontend
npm run build
firebase init hosting
firebase deploy
```

---

### Option 4: **DigitalOcean Apps**

1. **Connect GitHub repository**
2. **Configure app spec:**
   ```yaml
   services:
   - name: backend
     source_dir: /backend
     github:
       repo: your-username/movie-explorer
       branch: main
     run_command: gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
     environment_slug: python
     instance_count: 1
     instance_size_slug: basic-xxs
     
   - name: frontend
     source_dir: /frontend
     github:
       repo: your-username/movie-explorer
       branch: main
     build_command: npm run build
     output_dir: dist
     environment_slug: node-js
     
   databases:
   - name: postgres
     engine: PG
     version: "13"
   ```

---

## 🔧 Environment Configuration

### **Required Environment Variables:**

#### **Backend:**
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
TMDB_API_KEY=your_tmdb_api_key
PORT=8000  # Optional, defaults to 8000
```

#### **Frontend:**
```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

---

## 🛠️ Database Setup

### **Migration and Seeding:**
```bash
# For any deployment, after backend is running:

# 1. Access your backend container/instance
# 2. Run the seeder
python seed_movielens_ml100k.py

# Or via Docker:
docker exec -it movie-explorer-backend python seed_movielens_ml100k.py
```

### **External Database (Production):**
- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **DigitalOcean Managed Database**
- **Supabase**
- **PlanetScale** (MySQL alternative)

---

## 🔒 Security Checklist

### **Backend Security:**
- [ ] Change default database passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up proper database backups
- [ ] Monitor API rate limiting

### **Frontend Security:**
- [ ] Configure Content Security Policy
- [ ] Enable HTTPS
- [ ] Set proper caching headers
- [ ] Validate all environment variables

---

## 📊 Monitoring & Logs

### **Health Checks:**
```bash
# Backend health
curl https://your-backend.com/health

# Frontend health  
curl https://your-frontend.com/health
```

### **Application Monitoring:**
- **Backend**: Use FastAPI's built-in metrics + external services like DataDog
- **Frontend**: Browser performance monitoring with Vercel Analytics
- **Database**: Monitor connection pools and query performance

---

## 🚀 CI/CD Pipeline Example

### **GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy Movie Explorer

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        # Add your deployment steps
        
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        # Add your deployment steps
```

---

## 🆘 Troubleshooting

### **Common Issues:**

1. **CORS Errors:**
   - Update `allow_origins` in `backend/app/main.py`
   - Set correct `VITE_API_BASE_URL` in frontend

2. **Database Connection:**
   - Check `DATABASE_URL` format
   - Ensure database is accessible from backend

3. **Build Failures:**
   - Check Node.js version (use 18+)
   - Verify Python version (use 3.11+)
   - Clear build caches

4. **API Not Found:**
   - Verify backend is running and accessible
   - Check health endpoint: `/health`

---

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test health endpoints
4. Review this deployment guide

---

**🎉 Happy Deploying!** Your Movie Explorer app is ready for the world!
