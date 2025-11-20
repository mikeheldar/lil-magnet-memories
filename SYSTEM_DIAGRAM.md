# Apple Pay File Serving Chain - System Diagram

## Expected Flow:
```
1. SOURCE FILE
   Location: public/.well-known/apple-developer-merchantid-domain-association
   Size: 9099 bytes
   Type: ASCII text (hex-encoded string)
   Content: 7B227073704964223A22423836424637463839333737353532...
   
2. BUILD PROCESS
   Command: npm run build (Quasar/Vite)
   Action: Copies public/ → dist/spa/
   Output: dist/spa/.well-known/apple-developer-merchantid-domain-association
   Verified: ✓ 9099 bytes, matches source exactly
   
3. VERCEL DEPLOYMENT
   Config: vercel.json → distDir: "dist/spa"
   Action: @vercel/static-build uploads dist/spa/ to Vercel
   ⚠️ POTENTIAL ISSUE: Is Vercel actually uploading the correct file?
   
4. VERCEL EDGE SERVING
   Route: /.well-known/apple-developer-merchantid-domain-association
   Headers: text/plain, identity encoding, no-cache
   ⚠️ POTENTIAL ISSUE: Is Vercel serving from correct location?
   ⚠️ POTENTIAL ISSUE: Is Vercel compressing/transforming the file?
   
5. CLOUDFLARE PROXY
   Action: Receives response from Vercel
   ⚠️ POTENTIAL ISSUE: Is Cloudflare caching old 2026-byte binary file?
   ⚠️ POTENTIAL ISSUE: Is Cloudflare transforming/compressing?
   
6. BROWSER
   Current: Receives 2026 bytes of binary garbage ✗
   Expected: Should receive 9099 bytes hex string ✓
```

## The Problem:
- Source file: 9099 bytes ✓
- Build output: 9099 bytes ✓  
- Served file: 2026 bytes ✗ (completely different file!)

## Possible Causes:
1. **Vercel serving OLD cached file** from previous deployment (when API route existed)
2. **Cloudflare caching** the old 2026-byte binary version
3. **Vercel not uploading** the correct file from dist/spa/
4. **File transformation** during Vercel deployment (compression/encoding)
5. **Wrong file being served** from a different location

## Next Steps to Debug:
1. Verify Vercel deployment actually includes the 9099-byte file
2. Check Vercel deployment logs to see what files were uploaded
3. Manually purge Cloudflare cache
4. Check if there's a way to verify what Vercel has stored
