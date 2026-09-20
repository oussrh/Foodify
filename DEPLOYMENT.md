# 🚀 Foodify Deployment Guide

This guide covers the deployment process for Foodify, including common issues and their solutions.

## 📋 Pre-Deployment Checklist

### 1. Code Quality
- [ ] Run `npm run lint` and fix all ESLint errors
- [ ] Run `npm run build` locally to ensure successful build
- [ ] Test all AR functionality locally
- [ ] Verify database connectivity

### 2. Environment Variables
Ensure these are set in your deployment platform (Vercel, Netlify, etc.):

```bash
# Database
DATABASE_URL="your-neon-postgres-connection-string"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-secret-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM="noreply@yourdomain.com"
RESEND_DOMAIN="yourdomain.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

## 🔧 Common Deployment Issues & Solutions

### Issue 1: ESLint Errors
**Error:** Unescaped entities in JSX
```
Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.
```

**Solution:**
Replace apostrophes and quotes in JSX:
- `'` → `&apos;`
- `"` → `&ldquo;` or `&rdquo;`

### Issue 2: Image Optimization Warnings
**Error:** Using `<img>` instead of Next.js `<Image />`

**Solution:**
```jsx
// ❌ Don't use
<img src={imageUrl} alt="Description" />

// ✅ Use instead
import Image from 'next/image'
<Image src={imageUrl} alt="Description" width={200} height={200} />
```

**Next.js Config Update:**
```javascript
// next.config.js
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'api.qrserver.com'],
  },
}
```

### Issue 3: Database Connection Issues
**Error:** Database connection timeouts or missing tables

**Solution:**
1. Ensure `DATABASE_URL` is correctly formatted for Neon:
```bash
DATABASE_URL="postgresql://<user>:<password>@host-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require&connect_timeout=15&pool_timeout=15&connection_limit=10&pgbouncer=true"
```

2. The build process automatically runs database setup:
```bash
prisma generate && prisma db push --force-reset --accept-data-loss && prisma db seed
```

### Issue 4: React Hook Dependencies
**Warning:** Missing dependencies in useCallback

**Solution:**
Add all referenced variables to the dependency array:
```jsx
// ❌ Missing dependency
useCallback(() => {
  processFile(file)
}, [])

// ✅ Include dependency
useCallback(() => {
  processFile(file)
}, [processFile])
```

## 🌐 Vercel Deployment Steps

### 1. Project Setup
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 2. Build Process
The `vercel-build` script handles:
1. Prisma client generation
2. Database schema push with reset
3. Database seeding
4. Next.js build

### 3. Custom Build Script
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma db push --force-reset --accept-data-loss && prisma db seed && next build"
  }
}
```

## 🗃️ Database Management

### Neon Database Setup
1. Create a Neon project at [neon.tech](https://neon.tech)
2. Get the connection string from the dashboard
3. Ensure the connection string includes pooling parameters

### Prisma Schema Changes
When updating the database schema:
1. Update `prisma/schema.prisma`
2. Run `prisma db push` (handled automatically in build)
3. Update seed data if needed in `prisma/seed.ts`

### Seed Data
The seed script creates:
- Super Admin user: `ousrh7@gmail.com` (password: `changeme`)
- Restaurant Admin: `owner@foodify.test` (password: `changeme`)
- Test restaurant: "Foodify Test Kitchen" with slug `foodify-test-kitchen`
- Sample dishes and categories

## 📱 AR Functionality Testing

### After Deployment
1. Visit `/restaurant/foodify-test-kitchen` to test the public menu
2. Test QR code generation and scanning
3. Verify AR buttons work on mobile devices
4. Test both iOS (USDZ) and Android (GLB) AR experiences

### Mobile Testing
- iOS: AR Quick Look with USDZ files
- Android: Scene Viewer with GLB files
- WebXR fallback for other devices

## 🔍 Post-Deployment Verification

### Checklist
- [ ] Restaurant page loads without errors
- [ ] QR code generation works
- [ ] AR buttons are visible on dishes
- [ ] Admin login works with seeded credentials
- [ ] Image uploads work (Cloudinary integration)
- [ ] Email notifications work (Resend integration)

### Test URLs
- Public menu: `https://your-domain.com/restaurant/foodify-test-kitchen`
- Admin login: `https://your-domain.com/auth/signin`
- AR viewer: `https://your-domain.com/ar-viewer`

## 🚨 Troubleshooting

### Build Failures
1. Check Vercel build logs for specific errors
2. Ensure all environment variables are set
3. Verify database connectivity
4. Check for ESLint errors in code

**Note:** Windows Development Environment:
- Local builds may show EPERM symlink errors (Windows permission issues)
- These errors don't affect deployment to Vercel/Linux environments
- The build still completes successfully despite these warnings

### Runtime Issues
1. Check browser console for JavaScript errors
2. Verify API endpoints are working
3. Test database queries in Neon dashboard
4. Check network requests for failed API calls

### Performance Issues
1. Optimize images through Cloudinary
2. Use Next.js Image component with proper sizing
3. Implement proper caching strategies
4. Monitor Core Web Vitals in Vercel dashboard

## 📚 Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs/concepts/deployments/overview)
- [Neon Database Documentation](https://neon.tech/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

## 🔄 Future Updates

When deploying updates:
1. Test locally first with `npm run build`
2. Commit changes to main branch
3. Vercel will automatically redeploy
4. Monitor deployment status in Vercel dashboard
5. Test functionality on the live site

---

**Last Updated:** January 2025
**Version:** 1.0.0