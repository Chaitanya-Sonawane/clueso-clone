# Netlify Deployment Guide for Clueso Frontend

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository
The code has been pushed to: `https://github.com/Chaitanya-Sonawane/clueso-clone.git`

### 2. Deploy to Netlify

#### Option A: Netlify Dashboard (Recommended)
1. Go to [Netlify](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your repository: `Chaitanya-Sonawane/clueso-clone`
5. Configure build settings:
   - **Base directory**: `frontend-main`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend-main/.next`
   - **Node version**: `20`

#### Option B: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend directory
cd frontend-main
netlify deploy --prod --dir=.next
```

### 3. Environment Variables Setup
In Netlify dashboard, go to Site settings > Environment variables and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://rqbnpangmcppgeiqocfr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxYm5wYW5nbWNwcGdlaXFvY2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODM0MTksImV4cCI6MjA4MTk1OTQxOX0.LBgGMUTxhRuBpIs5P-a7CBDUyeVg0Zb45gXw-wZBpKc

# Backend URLs (Update with your deployed backend)
NEXT_PUBLIC_API_URL=https://your-backend-url.herokuapp.com
NEXT_PUBLIC_WS_URL=https://your-backend-url.herokuapp.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.herokuapp.com

# AI Service URL
NEXT_PUBLIC_AI_URL=https://your-ai-service-url.herokuapp.com

# Other settings
NEXT_PUBLIC_ALLOW_EXTENSION_ACCESS=true
NODE_ENV=production
```

### 4. Backend Deployment (Required)
The frontend needs a backend API. Deploy the backend to a service like:

#### Heroku (Recommended)
```bash
# Install Heroku CLI
# Create new Heroku app
heroku create your-clueso-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
heroku config:set SUPABASE_URL=https://rqbnpangmcppgeiqocfr.supabase.co
heroku config:set SUPABASE_ANON_KEY=your_key
# ... add other environment variables

# Deploy backend
git subtree push --prefix=Clueso_Node_layer-main heroku main
```

#### Railway
1. Go to [Railway](https://railway.app)
2. Connect your GitHub repository
3. Select the `Clueso_Node_layer-main` folder
4. Add environment variables
5. Deploy

#### Render
1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Set root directory to `Clueso_Node_layer-main`
5. Add environment variables
6. Deploy

### 5. Update Frontend URLs
After deploying the backend, update the environment variables in Netlify:
- Replace `https://your-backend-url.herokuapp.com` with your actual backend URL
- Redeploy the frontend

### 6. Custom Domain (Optional)
1. In Netlify dashboard, go to Domain settings
2. Add your custom domain
3. Configure DNS settings as instructed

## 📋 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify site created and connected to repository
- [ ] Build settings configured (base directory: `frontend-main`)
- [ ] Environment variables added to Netlify
- [ ] Backend deployed to cloud service
- [ ] Frontend environment variables updated with backend URL
- [ ] Site tested and working properly

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version is set to 20
- Verify all dependencies are in package.json
- Check build logs for specific errors

### API Calls Fail
- Verify backend is deployed and accessible
- Check environment variables are set correctly
- Ensure CORS is configured on backend

### WebSocket Issues
- Verify WebSocket URL points to deployed backend
- Check if hosting service supports WebSocket connections
- Consider using Socket.IO fallback options

## 🌐 Expected URLs
- **Frontend**: `https://your-site-name.netlify.app`
- **Backend**: `https://your-backend-url.herokuapp.com`
- **Custom Domain**: `https://your-domain.com` (if configured)

## 📞 Support
If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test backend endpoints directly
4. Check browser console for errors

---
**Note**: Remember to update the backend URLs in the environment variables after deploying your backend service.