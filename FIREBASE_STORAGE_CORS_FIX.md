# Firebase Storage CORS Configuration Fix

## Problem
Images are stuck on "Uploading..." because Firebase Storage is blocking requests from localhost due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution

### Option 1: Using Google Cloud Console (Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **Cloud Storage** → **Browser**
4. Click on your storage bucket
5. Click on the **Permissions** tab
6. Add the following CORS configuration:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

### Option 2: Using gsutil Command Line (Advanced)

If you have Google Cloud SDK installed:

1. The `cors.json` file is already created in your admin-panel directory
2. Run this command (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```bash
gsutil cors set cors.json gs://YOUR-BUCKET-NAME
```

To find your bucket name, check your `.env.local` file for `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

### Option 3: Temporary Workaround (For Testing Only)

If you need to test immediately and can't configure CORS right now:

1. Deploy your admin panel to Vercel
2. Upload images from the deployed version (not localhost)
3. The deployed version won't have CORS issues

## Verifying the Fix

After applying the CORS configuration:

1. Clear your browser cache
2. Try uploading an image again
3. Check the browser console (F12) for any errors
4. The upload should now complete successfully

## Notes

- The `cors.json` file allows all origins (`"*"`). For production, you should restrict this to your specific domains.
- CORS configuration may take a few minutes to propagate.
