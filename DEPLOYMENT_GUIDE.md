# 🚀 Deployment Guide for Zan88Keys

This guide covers multiple deployment options for your React piano notes application.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Supabase project set up with database and storage
- ✅ Environment variables configured
- ✅ All dependencies installed (`npm install`)

## 🔧 Environment Setup

### 1. Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Configuration

Ensure your Supabase project has:

- Database table `notes_for_zan` created
- Storage buckets for `photos`, `videos`, and `audio`
- Proper Row Level Security (RLS) policies
- CORS settings configured for your domain

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:** Easy setup, automatic deployments, great performance, free tier

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Build your project:**

   ```bash
   npm run build
   ```

3. **Deploy:**

   ```bash
   vercel
   ```

4. **Follow the prompts:**

   - Link to existing project or create new
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Set environment variables in Vercel dashboard

5. **Configure environment variables in Vercel dashboard:**

   - Go to your project settings
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

6. **Set up automatic deployments:**
   - Connect your GitHub repository
   - Vercel will auto-deploy on push to main branch

### Option 2: Netlify

**Pros:** Easy setup, good performance, free tier

1. **Build your project:**

   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI:**

   ```bash
   npm install -g netlify-cli
   netlify deploy --dir=dist --prod
   ```

3. **Or deploy via Netlify UI:**

   - Drag and drop your `dist` folder to Netlify
   - Or connect your GitHub repository

4. **Configure environment variables:**
   - Go to Site settings > Environment variables
   - Add your Supabase credentials

### Option 3: GitHub Pages

**Pros:** Free, good for static sites

1. **Add GitHub Pages to package.json:**

   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

2. **Install gh-pages:**

   ```bash
   npm install --save-dev gh-pages
   ```

3. **Deploy:**

   ```bash
   npm run deploy
   ```

4. **Configure environment variables:**
   - Use GitHub Secrets for sensitive data
   - Or use a `.env.production` file (not recommended for secrets)

### Option 4: Firebase Hosting

**Pros:** Google's infrastructure, good performance

1. **Install Firebase CLI:**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**

   ```bash
   firebase login
   ```

3. **Initialize Firebase:**

   ```bash
   firebase init hosting
   ```

4. **Configure firebase.json:**

   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

5. **Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

### Option 5: AWS S3 + CloudFront

**Pros:** Highly scalable, cost-effective for high traffic

1. **Create S3 bucket:**

   - Enable static website hosting
   - Set bucket policy for public read access

2. **Upload files:**

   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **Set up CloudFront distribution:**

   - Origin: Your S3 bucket
   - Default root object: `index.html`
   - Error pages: Redirect 404 to `/index.html`

4. **Configure environment variables:**
   - Use AWS Systems Manager Parameter Store
   - Or build with environment variables

## 🔒 Security Considerations

### 1. Environment Variables

- ✅ Never commit `.env` files to version control
- ✅ Use deployment platform's environment variable system
- ✅ Rotate API keys regularly

### 2. Supabase Security

- ✅ Enable Row Level Security (RLS)
- ✅ Configure proper CORS settings
- ✅ Set up storage bucket policies
- ✅ Use service role keys only on backend

### 3. Content Security Policy

Add to your `index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https:;"
/>
```

### 4. Input Validation

- ✅ All user inputs are sanitized (already implemented)
- ✅ File uploads are validated
- ✅ XSS protection enabled
- ✅ SQL injection protection via Supabase

## 🚀 Production Build

Before deploying, ensure a clean production build:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build for production
npm run build

# Test the build locally
npm run preview
```

## 📊 Performance Optimization

### 1. Build Optimization

- ✅ Code splitting enabled
- ✅ Tree shaking active
- ✅ Minification enabled
- ✅ Gzip compression

### 2. Image Optimization

- ✅ Use WebP format when possible
- ✅ Implement lazy loading for images
- ✅ Optimize image sizes before upload

### 3. Caching Strategy

- ✅ Static assets cached aggressively
- ✅ API responses cached appropriately
- ✅ Service worker for offline functionality (optional)

## 🔍 Post-Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] Supabase connection working
- [ ] File uploads functioning
- [ ] All features tested
- [ ] Mobile responsiveness verified
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] SSL certificate active
- [ ] Domain configured (if custom domain)

## 🐛 Troubleshooting

### Common Issues:

1. **Environment Variables Not Working:**

   - Ensure variables are prefixed with `VITE_`
   - Check deployment platform's environment variable system
   - Verify variable names match exactly

2. **Supabase Connection Errors:**

   - Verify URL and API key
   - Check CORS settings in Supabase
   - Ensure RLS policies are configured

3. **File Upload Issues:**

   - Check storage bucket permissions
   - Verify file size limits
   - Ensure bucket policies allow uploads

4. **Build Errors:**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify all dependencies are installed

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify Supabase dashboard for database issues
3. Check deployment platform logs
4. Review environment variable configuration

## 🎉 Success!

Once deployed, your piano notes application will be live and accessible to users worldwide. The application includes comprehensive input sanitization and security measures to protect against common web vulnerabilities.

Remember to:

- Monitor your application's performance
- Keep dependencies updated
- Regularly backup your Supabase data
- Monitor for any security issues
