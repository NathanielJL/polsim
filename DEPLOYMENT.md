# Deployment Guide for POLSIM

This guide covers deploying POLSIM to production hosting platforms.

## Quick Deploy Options

### Option 1: Railway.app (Recommended - Easiest)

**Pros:**
- Auto-deploys from GitHub
- Managed MongoDB included
- Free trial with $5 credit
- ~$10-15/month after trial
- Excellent for beginners

**Steps:**

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Sign up at Railway.app**:
   - Go to https://railway.app
   - Sign in with GitHub
   - Authorize Railway to access your repository

3. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `NathanielJL/polsim`

4. **Add MongoDB**:
   - In your project, click "+ New"
   - Select "Database" → "MongoDB"
   - Railway will create a MongoDB instance and provide connection string

5. **Deploy Backend**:
   - Click "+ New" → "GitHub Repo"
   - Select your polsim repo
   - Configure settings:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=[copy from MongoDB plugin]
     JWT_SECRET=[generate random string: https://randomkeygen.com/]
     FRONTEND_URL=[will add after frontend deployed]
     ```

6. **Deploy Frontend**:
   - Click "+ New" → "GitHub Repo"  
   - Select your polsim repo again
   - Configure settings:
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npx serve -s build -p $PORT`
   
   - Add environment variables:
     ```
     REACT_APP_API_URL=[copy backend URL from Railway]
     REACT_APP_WS_URL=[same as API URL]
     ```

7. **Update CORS**:
   - Go back to backend environment variables
   - Set `FRONTEND_URL` to your frontend Railway URL
   - Redeploy backend

8. **Create First GM Account**:
   - Register on your live site
   - Connect to MongoDB in Railway dashboard
   - Run:
     ```javascript
     db.players.updateOne(
       { username: "YourUsername" },
       { $set: { isGameMaster: true } }
     )
     ```

**Your app is now live!** 🎉

---

### Option 2: Render.com (Free Tier Available)

**Pros:**
- Free tier for both frontend and backend
- Managed PostgreSQL free tier (can adapt to MongoDB Atlas)
- Auto-deploys from GitHub
- Free SSL certificates

**Cons:**
- Free tier spins down after 15 minutes of inactivity (30s cold start)
- Limited to 750 hours/month free compute

**Steps:**

1. **Create MongoDB Atlas Account** (free tier):
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Sign up at Render.com**:
   - Go to https://render.com
   - Sign in with GitHub

3. **Create Backend Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: polsim-backend
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free
   
   - Environment Variables:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=[your Atlas connection string]
     JWT_SECRET=[generate random string]
     FRONTEND_URL=[will add later]
     ```

4. **Create Frontend Static Site**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repo
   - Configure:
     - **Name**: polsim
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`
   
   - Environment Variables:
     ```
     REACT_APP_API_URL=[your backend render URL]
     REACT_APP_WS_URL=[same as API URL]
     ```

5. **Update CORS**:
   - Go to backend environment variables
   - Set `FRONTEND_URL` to your frontend Render URL
   - Save (auto-redeploys)

---

### Option 3: Heroku

**Pros:**
- Very polished developer experience
- Good documentation
- Reliable performance

**Cons:**
- No free tier (~$7/month minimum per dyno)
- Two dynos needed (backend + frontend) = ~$14/month

**Steps:**

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Apps**:
   ```bash
   heroku create polsim-backend
   heroku create polsim-frontend
   ```

3. **Add MongoDB**:
   ```bash
   heroku addons:create mongolab:sandbox -a polsim-backend
   ```

4. **Deploy Backend**:
   ```bash
   cd backend
   git init
   heroku git:remote -a polsim-backend
   
   # Set environment variables
   heroku config:set NODE_ENV=production -a polsim-backend
   heroku config:set JWT_SECRET=your-secret-key -a polsim-backend
   
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

5. **Deploy Frontend**:
   ```bash
   cd ../frontend
   git init
   heroku git:remote -a polsim-frontend
   
   # Set environment variables
   heroku config:set REACT_APP_API_URL=https://polsim-backend.herokuapp.com -a polsim-frontend
   
   git add .
   git commit -m "Deploy frontend"
   git push heroku main
   ```

---

### Option 4: Custom VPS (Advanced)

**For**: DigitalOcean, AWS EC2, Linode, etc.

**Prerequisites:**
- Linux server administration knowledge
- Domain name
- SSL certificate setup

**Basic Steps:**

1. **Provision Ubuntu Server** (20.04 LTS+)

2. **Install Dependencies**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt update
   sudo apt install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Install Nginx
   sudo apt install -y nginx
   
   # Install PM2 (process manager)
   sudo npm install -g pm2
   ```

3. **Clone Repository**:
   ```bash
   cd /var/www
   git clone https://github.com/NathanielJL/polsim.git
   cd polsim
   ```

4. **Setup Backend**:
   ```bash
   cd backend
   npm install
   npm run build
   
   # Create .env file
   cat > .env << EOF
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/polsim
   JWT_SECRET=$(openssl rand -base64 32)
   FRONTEND_URL=https://yourdomain.com
   EOF
   
   # Start with PM2
   pm2 start dist/index.js --name polsim-backend
   pm2 save
   pm2 startup
   ```

5. **Setup Frontend**:
   ```bash
   cd ../frontend
   
   # Create .env file
   cat > .env << EOF
   REACT_APP_API_URL=https://api.yourdomain.com
   REACT_APP_WS_URL=https://api.yourdomain.com
   EOF
   
   npm install
   npm run build
   ```

6. **Configure Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/polsim
   ```
   
   Add:
   ```nginx
   # Frontend
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/polsim/frontend/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   
   # Backend API
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/polsim /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

---

## Post-Deployment Checklist

### Security

- [ ] Change default JWT_SECRET to secure random string
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Review CORS settings (only allow your frontend domain)
- [ ] Add rate limiting (optional but recommended)
- [ ] Setup MongoDB authentication (if using custom server)

### Monitoring

- [ ] Setup error tracking (Sentry recommended)
  ```bash
  npm install @sentry/node @sentry/react
  ```

- [ ] Setup uptime monitoring (UptimeRobot free tier)
  - Add both frontend and backend URLs

- [ ] Enable logging (LogTail, Papertrail, or CloudWatch)

### Database

- [ ] Backup strategy configured
- [ ] MongoDB Atlas has automatic backups (if using)
- [ ] Test restore procedure

### First Admin Setup

1. Register first account on live site
2. Access MongoDB and run:
   ```javascript
   db.players.updateOne(
     { username: "FirstAdminUsername" },
     { $set: { isGameMaster: true } }
   )
   ```
3. Log in and verify GM dashboard access

---

## Environment Variables Reference

### Backend Required Variables

```env
NODE_ENV=production              # Always 'production' for live
PORT=5000                        # Port to run on (usually 5000)
MONGODB_URI=mongodb://...        # MongoDB connection string
JWT_SECRET=<random-string>       # Secret for JWT tokens (must be secure)
FRONTEND_URL=https://...         # Your frontend URL for CORS
```

### Frontend Required Variables

```env
REACT_APP_API_URL=https://...    # Backend API URL
REACT_APP_WS_URL=https://...     # WebSocket URL (usually same as API)
```

---

## Troubleshooting Common Issues

### Backend won't start

**Error**: "Session validation failed: gamemaster: Path 'gamemaster' is required"
- **Fix**: This was patched in latest version. Update `backend/src/models/mongoose.ts` line 897:
  ```typescript
  gamemaster: { type: Schema.Types.ObjectId, ref: 'Player', required: false },
  ```

**Error**: "Cannot find module"
- **Fix**: Run `npm install` in backend folder
- **Fix**: Run `npm run build` before `npm start` in production

### Frontend can't connect to backend

**Error**: "Network Error" or CORS errors
- **Fix**: Check `REACT_APP_API_URL` matches your backend URL exactly
- **Fix**: Update backend `FRONTEND_URL` to match frontend domain
- **Fix**: Ensure backend CORS is configured:
  ```typescript
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }));
  ```

### Database connection fails

**Error**: "MongooseError: Connection refused"
- **Fix**: Check `MONGODB_URI` is correct
- **Fix**: Ensure MongoDB is running (if self-hosted)
- **Fix**: Check IP whitelist (MongoDB Atlas)
- **Fix**: Verify network connectivity

### Registration fails

**Error**: "Registration failed" 
- **Check**: Backend logs for actual error
- **Common**: Missing environment variables
- **Common**: Database connection issue

---

## Estimated Costs

### Railway.app
- **Free Trial**: $5 credit
- **After Trial**: ~$10-15/month
  - Backend: $5/month
  - Frontend: $5/month
  - MongoDB: $0-5/month (depending on usage)

### Render.com
- **Free Tier**: $0/month
  - Backend: Free (750 hours/month limit)
  - Frontend: Free (100GB bandwidth/month)
  - MongoDB: Free (MongoDB Atlas)
- **Paid Tier**: ~$7/month for always-on backend

### Heroku
- **Minimum**: ~$14/month
  - Backend: $7/month (Eco dyno)
  - Frontend: $7/month (Eco dyno)
  - MongoDB: Free (via mLab addon)

### Custom VPS
- **DigitalOcean**: $6/month (basic droplet)
- **Linode**: $5/month (Nanode)
- **AWS EC2**: ~$5-10/month (t2.micro/t3.micro)
- **Plus domain**: ~$10-15/year

---

## Getting Help

- **GitHub Issues**: https://github.com/NathanielJL/polsim/issues
- **Discord**: [TBD]
- **Documentation**: See README.md and other docs in `/docs`

---

## License

[TBD]
