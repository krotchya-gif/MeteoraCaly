# Production Deployment Checklist

**Project:** Meteora DLMM Calculator  
**Version:** 1.0.0  
**Date:** February 6, 2026  
**Deployer:** _______________

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No console errors in browser
- [ ] No console warnings (or documented)
- [ ] Linting passed (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] Bundle size acceptable (<200KB gzipped)
- [ ] Code review completed
- [ ] No TODO/FIXME in production code

### Documentation
- [ ] README.md updated
- [ ] CHANGELOG.md updated with version
- [ ] API.md reflects current endpoints
- [ ] DEPLOYMENT.md reviewed
- [ ] Environment variables documented

### Testing
- [ ] Calculator calculations accurate
- [ ] Comparison view working
- [ ] All 4 charts rendering
- [ ] CSV export working
- [ ] Mobile responsive (tested on real device)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Accessibility check (basic keyboard navigation)
- [ ] Error handling works (network failures, etc.)

### Performance
- [ ] Lighthouse score >90 (all metrics)
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No memory leaks (checked with DevTools)
- [ ] Images optimized
- [ ] Lazy loading implemented where needed

### Security
- [ ] No API keys in frontend code
- [ ] Environment variables properly set
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Dependencies have no known vulnerabilities (`npm audit`)
- [ ] No sensitive data in localStorage

---

## Deployment Steps

### 1. Backend Deployment (Cloudflare Workers)

#### 1.1 Verify Configuration
```bash
cd backend
cat wrangler.toml
# Verify:
# - Correct namespace IDs
# - Production routes
# - Environment variables
```
- [ ] wrangler.toml configured
- [ ] KV namespaces created
- [ ] Environment variables set

#### 1.2 Deploy Backend
```bash
# Test locally first
wrangler dev
# Test endpoints at http://localhost:8787

# Deploy to production
wrangler publish

# Verify deployment
curl https://YOUR_WORKER.workers.dev/api/health
```
- [ ] Local test successful
- [ ] Production deployment successful
- [ ] Health check returns OK
- [ ] Pools endpoint returns data

#### 1.3 Configure Custom Domain (Optional)
```bash
# Via Cloudflare dashboard:
# Workers & Pages → Triggers → Custom Domains
# Add: api.meteora-calculator.com
```
- [ ] Custom domain added
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Endpoint accessible via custom domain

---

### 2. Frontend Deployment (Vercel)

#### 2.1 Update Environment Variables
```bash
cd frontend
cat .env.production
# Verify VITE_API_URL points to deployed backend
```
- [ ] .env.production configured
- [ ] API URL correct
- [ ] Feature flags set

#### 2.2 Build and Test
```bash
# Build production bundle
npm run build

# Preview locally
npm run preview
# Test at http://localhost:4173
```
- [ ] Build successful
- [ ] No build warnings
- [ ] Preview works correctly
- [ ] API calls successful

#### 2.3 Deploy to Vercel
```bash
# Option 1: Via Dashboard
# 1. Push to GitHub
# 2. Vercel auto-deploys

# Option 2: Via CLI
vercel --prod
```
- [ ] Code pushed to GitHub
- [ ] Vercel deployment triggered
- [ ] Build successful on Vercel
- [ ] Deployment preview checked
- [ ] Promoted to production

#### 2.4 Configure Custom Domain (Optional)
- [ ] Domain added in Vercel dashboard
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Site accessible via custom domain

---

### 3. Data Collection Setup

#### 3.1 Manual Collection (Immediate)
```bash
cd scripts
node collect-pools.js
# Verify output in data/ directory
```
- [ ] Script runs successfully
- [ ] pools.json generated
- [ ] Data looks correct (50+ pools)

#### 3.2 Automated Collection (Optional)
```bash
# GitHub Actions workflow
cat .github/workflows/update-pools.yml
# Verify cron schedule
```
- [ ] GitHub Actions workflow created
- [ ] First run successful
- [ ] Cron schedule verified

---

## Post-Deployment Verification

### Smoke Tests

#### Frontend
```bash
# Homepage loads
curl -I https://meteora-calculator.com
# Should return 200 OK

# Assets load
curl -I https://meteora-calculator.com/assets/index-*.js
# Should return 200 OK
```
- [ ] Homepage accessible
- [ ] JavaScript loads
- [ ] CSS loads
- [ ] No 404 errors in Network tab

#### Backend
```bash
# Health check
curl https://api.meteora-calculator.com/api/health
# Should return {"status":"ok"}

# Pools endpoint
curl https://api.meteora-calculator.com/api/pools | jq '.count'
# Should return number (e.g., 50)

# CORS check
curl -H "Origin: https://meteora-calculator.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.meteora-calculator.com/api/pools \
     -I
# Should include Access-Control-Allow-Origin header
```
- [ ] Health check OK
- [ ] Pools endpoint returns data
- [ ] CORS headers present
- [ ] Rate limiting works

### Functionality Tests

#### Core Features
- [ ] Pool data loads in calculator
- [ ] Calculator performs calculations
- [ ] Results display correctly
- [ ] Comparison view loads
- [ ] Can select multiple pools
- [ ] Comparison results accurate
- [ ] Charts render (all 4 types)
- [ ] Tab navigation works
- [ ] Export CSV downloads

#### Error Handling
- [ ] Network error shows message
- [ ] Invalid input shows validation
- [ ] Empty state displays correctly
- [ ] Retry button works

#### Mobile (Test on Real Device)
- [ ] Layout responsive
- [ ] Touch controls work
- [ ] Charts display properly
- [ ] No horizontal scroll
- [ ] Keyboard doesn't break layout

### Performance Tests

```bash
# Lighthouse audit
npx lighthouse https://meteora-calculator.com \
  --only-categories=performance,accessibility,best-practices,seo \
  --view
```

Performance Goals:
- [ ] Performance: ≥90
- [ ] Accessibility: ≥90
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90
- [ ] First Contentful Paint: <1.5s
- [ ] Largest Contentful Paint: <2.5s
- [ ] Time to Interactive: <3.0s
- [ ] Cumulative Layout Shift: <0.1

### Monitoring Setup

#### Vercel
- [ ] Analytics enabled
- [ ] Web Vitals tracking active
- [ ] Error tracking configured (if using Sentry)

#### Cloudflare
- [ ] Worker metrics visible
- [ ] Request count tracking
- [ ] Error rate monitoring
- [ ] Cache hit ratio monitoring

---

## Launch Announcement

### Internal
- [ ] Team notified
- [ ] Documentation shared
- [ ] Known issues documented
- [ ] Support plan in place

### External (Optional)
- [ ] Twitter announcement
- [ ] Discord announcement
- [ ] Blog post published
- [ ] Product Hunt submission

---

## Rollback Plan

### If Critical Issues Found

#### Frontend Rollback
```bash
# Vercel Dashboard:
# 1. Go to Deployments
# 2. Find last stable deployment
# 3. Click "..." → Promote to Production
```

#### Backend Rollback
```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback [DEPLOYMENT_ID]
```

- [ ] Rollback procedure documented
- [ ] Team knows how to rollback
- [ ] Previous stable version identified

---

## Post-Launch Monitoring (First 24 Hours)

### Metrics to Watch

#### Hour 1
- [ ] No critical errors
- [ ] API response time <500ms
- [ ] Frontend loads <2s
- [ ] No user complaints

#### Hour 6
- [ ] Error rate <1%
- [ ] Successful calculations >95%
- [ ] Cache hit ratio >80%
- [ ] No memory leaks

#### Hour 24
- [ ] Performance stable
- [ ] No unexpected costs
- [ ] User feedback positive
- [ ] All features working

### Action Items (If Issues)
- [ ] Investigate errors immediately
- [ ] Contact users if needed
- [ ] Prepare hotfix if necessary
- [ ] Consider rollback if critical

---

## Success Criteria

Deployment is successful when:

- [ ] All smoke tests pass
- [ ] All functionality tests pass
- [ ] Performance meets goals
- [ ] No critical bugs
- [ ] Monitoring active
- [ ] Team ready to support
- [ ] Users can access app
- [ ] Core features working

---

## Sign-Off

### Development Team
- [ ] Code complete and tested
- [ ] Documentation updated
- [ ] Deployment verified

**Developer:** _______________  
**Date:** _______________

### QA Team (If Applicable)
- [ ] All test cases passed
- [ ] No blockers found
- [ ] Ready for production

**QA Lead:** _______________  
**Date:** _______________

### Product Owner
- [ ] Features as expected
- [ ] Ready for users
- [ ] Approved for launch

**Product Owner:** _______________  
**Date:** _______________

---

## Notes

**Deployment Notes:**
```
[Add any notes about this deployment]
- 
- 
- 
```

**Known Issues:**
```
[List any known issues that are acceptable for launch]
- 
- 
- 
```

**Future Improvements:**
```
[List items to address post-launch]
- 
- 
- 
```

---

## Emergency Contacts

- **Developer:** [Name] - [Email] - [Phone]
- **DevOps:** [Name] - [Email] - [Phone]
- **Product Owner:** [Name] - [Email] - [Phone]
- **Vercel Support:** https://vercel.com/support
- **Cloudflare Support:** https://support.cloudflare.com

---

**Deployment Status:** ⏳ NOT STARTED

**Update status as you progress:**
- ⏳ NOT STARTED
- 🔄 IN PROGRESS
- ✅ COMPLETED
- ❌ FAILED
- 🔙 ROLLED BACK

---

*Checklist Version: 1.0*  
*Last Updated: February 6, 2026*
