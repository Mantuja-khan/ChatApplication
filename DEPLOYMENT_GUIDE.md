# Production Deployment Guide

This guide will help you deploy your chat application to production with the backend on Render and frontend on Hostinger.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Hostinger Account** - Sign up at [hostinger.com](https://hostinger.com)
4. **Supabase Project** - Your database should be set up on Supabase

## Part 1: Backend Deployment on Render

### Step 1: Prepare Your Backend

1. **Create a separate repository for your backend** or ensure your `server` folder is ready:
   ```
   server/
   ├── package.json
   ├── src/
   │   ├── index.js
   │   ├── routes/
   │   └── services/
   └── .env (don't commit this)
   ```

2. **Update your server/package.json** to include a start script:
   ```json
   {
     "scripts": {
       "start": "node src/index.js",
       "dev": "nodemon src/index.js"
     }
   }
   ```

3. **Update server/src/index.js** for production:
   ```javascript
   const PORT = process.env.PORT || 3000;
   
   // Update CORS for production
   const io = new Server(httpServer, {
     cors: {
       origin: [
         process.env.CLIENT_URL || 'http://localhost:5173',
         'https://yourdomain.com' // Your Hostinger domain
       ],
       methods: ['GET', 'POST']
     }
   });
   ```

### Step 2: Deploy to Render

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"

2. **Connect Your Repository**
   - Connect your GitHub account
   - Select your repository
   - Choose the `server` folder as the root directory (if applicable)

3. **Configure the Service**
   - **Name**: `your-app-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (for testing) or `Starter` (for production)

4. **Set Environment Variables**
   Add these environment variables in Render:
   ```
   NODE_ENV=production
   CLIENT_URL=https://yourdomain.com
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_SUBJECT=mailto:your-email@gmail.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your Render URL: `https://your-app-backend.onrender.com`

### Step 3: Generate VAPID Keys

Run this locally to generate VAPID keys:
```bash
cd server
npm run generate-vapid
```

Copy the generated keys to your Render environment variables.

## Part 2: Frontend Deployment on Hostinger

### Step 1: Prepare Your Frontend

1. **Update environment variables** in your frontend:
   Create a `.env.production` file:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **Update socket connection** in `src/lib/socket.js`:
   ```javascript
   const SOCKET_URL = process.env.NODE_ENV === 'production' 
     ? 'https://your-app-backend.onrender.com' 
     : 'http://localhost:3000';
   ```

3. **Update notification service** in `src/utils/notificationUtils.js`:
   ```javascript
   const serverUrl = process.env.NODE_ENV === 'production' 
     ? 'https://your-app-backend.onrender.com' 
     : 'http://localhost:3000';
   ```

### Step 2: Build Your Frontend

1. **Install dependencies and build**:
   ```bash
   npm install
   npm run build
   ```

2. **Test the build locally**:
   ```bash
   npm run preview
   ```

### Step 3: Deploy to Hostinger

#### Option A: Using Hostinger File Manager

1. **Access Hostinger Control Panel**
   - Log in to your Hostinger account
   - Go to "Hosting" → "Manage"

2. **Upload Files**
   - Open "File Manager"
   - Navigate to `public_html` folder
   - Delete default files (if any)
   - Upload all files from your `dist` folder

3. **Configure Domain**
   - Ensure your domain points to the `public_html` folder
   - Update DNS if necessary

#### Option B: Using Git (if Hostinger supports it)

1. **Connect Git Repository**
   - In Hostinger control panel, look for "Git" or "Version Control"
   - Connect your GitHub repository
   - Set deployment branch to `main` or `master`

2. **Set Build Commands**
   ```bash
   npm install
   npm run build
   cp -r dist/* public_html/
   ```

## Part 3: Configure Supabase for Production

### Step 1: Update Supabase Settings

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to "Settings" → "API"

2. **Update Site URL**
   - Set Site URL to: `https://yourdomain.com`
   - Add redirect URLs:
     - `https://yourdomain.com`
     - `https://yourdomain.com/**`

3. **Update CORS Settings**
   - Go to "Settings" → "Database"
   - Add your domain to allowed origins

### Step 2: Update RLS Policies (if needed)

Ensure your Row Level Security policies work with production URLs.

## Part 4: Testing and Monitoring

### Step 1: Test Your Deployment

1. **Test Frontend**
   - Visit your Hostinger domain
   - Check if the app loads correctly
   - Test user registration/login

2. **Test Backend**
   - Check if real-time messaging works
   - Test push notifications
   - Verify email sending

3. **Test Integration**
   - Send messages between users
   - Check if notifications are delivered
   - Test on mobile devices

### Step 2: Monitor Your Application

1. **Render Monitoring**
   - Check logs in Render dashboard
   - Monitor resource usage
   - Set up alerts

2. **Supabase Monitoring**
   - Monitor database performance
   - Check API usage
   - Review logs

## Part 5: Domain and SSL Configuration

### Step 1: Configure Custom Domain (Optional)

1. **In Hostinger**
   - Go to "Domains" → "Manage"
   - Point your domain to Hostinger servers

2. **SSL Certificate**
   - Hostinger usually provides free SSL
   - Ensure HTTPS is enabled

### Step 2: Update All URLs

Update all hardcoded URLs in your application to use your production domain.

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for your frontend domain
   - Check Supabase CORS settings

2. **Environment Variables**
   - Verify all environment variables are set correctly
   - Check for typos in variable names

3. **Build Errors**
   - Ensure all dependencies are installed
   - Check for missing environment variables during build

4. **Socket Connection Issues**
   - Verify WebSocket support on Render
   - Check firewall settings

### Performance Optimization

1. **Enable Gzip Compression** on Hostinger
2. **Use CDN** for static assets
3. **Optimize Images** and assets
4. **Enable Caching** headers

## Security Checklist

- [ ] All environment variables are secure
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Database RLS policies are active
- [ ] API keys are not exposed in frontend
- [ ] Rate limiting is implemented
- [ ] Input validation is in place

## Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update Node.js version as needed

2. **Backup Strategy**
   - Regular database backups via Supabase
   - Code backups via Git
   - Environment variable documentation

3. **Monitoring**
   - Set up uptime monitoring
   - Monitor error rates
   - Track performance metrics

Your chat application should now be fully deployed and accessible to users worldwide!