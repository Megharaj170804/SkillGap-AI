# SkillGap Platform Deployment Guide

This guide provides step-by-step instructions for deploying the **SkillGap Platform**. We will deploy both the **Backend** and the **Frontend on Render** — a free and easy-to-use cloud platform.

---

## Part 1: Deploying the Backend on Render (Web Service)

Render is a great platform for hosting Node.js applications.

### Prerequisites
1. Create a free account on [Render.com](https://render.com/).
2. Make sure your code is pushed to a GitHub repository.

### Steps
1. **Log in to Render** and click on the **"New +"** button at the top right, then select **"Web Service"**.
2. **Connect your GitHub account** and select the repository containing this project.
3. Configure the Web Service with the following details:
   - **Name**: `skillgap-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Region**: Choose the one closest to you.
   - **Branch**: `main` (or whichever branch you use)
   - **Root Directory**: `backend` (⚠️ *Very Important: since your backend is in a subfolder*)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Set Environment Variables**:
   Scroll down to the "Environment Variables" section and click "Add Environment Variable". Add all the variables from your backend `.env` file. For example:
   - `PORT`: `5000`
   - `MONGODB_URI`: *<Your MongoDB Atlas Connection String>*
   - `JWT_SECRET`: *<Your Secret Key>*
   - `GEMINI_API_KEY`: *<Your Google Gemini API Key>*
   - `FRONTEND_URL`: *<Leave this blank for now, we will update it after deploying the frontend>*
5. Select the **Free instance type**.
6. Click **"Create Web Service"**.
7. Render will now build and deploy your backend. It might take a few minutes. Once it says "Live", copy the **backend URL** (e.g., `https://skillgap-backend.onrender.com`). Keep this URL handy.

---

## Part 2: Deploying the Frontend on Render (Static Site)

Render also supports hosting static sites for free — perfect for a Vite/React frontend.

### Prerequisites
1. Use the same Render account you created above.
2. Have your GitHub repository ready.

### Steps
1. **Log in to Render** and click on **"New +"** at the top right, then select **"Static Site"**.
2. **Connect your GitHub repository** containing the SkillGap project.
3. Configure the Static Site with the following details:
   - **Name**: `skillgap-frontend` (or any name you prefer)
   - **Branch**: `main` (or whichever branch you use)
   - **Root Directory**: `frontend` (⚠️ *Very Important: since your frontend is in a subfolder*)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Set Environment Variables**:
   Click on the "Environment" section and add the following variable so your frontend knows where the backend is:
   - **Key**: `VITE_API_URL`
   - **Value**: The Render backend URL you copied earlier (e.g., `https://skillgap-backend.onrender.com`)
   - **Key**: `VITE_SOCKET_URL`
   - **Value**: Same as above (e.g., `https://skillgap-backend.onrender.com`)
5. **Add a Rewrite Rule (for React Router / SPA)**:
   Since this is a Single Page Application (SPA) using React Router, you need to tell Render to redirect all paths to `index.html`.
   - Go to the **"Redirects/Rewrites"** tab after the site is created.
   - Add a new **Rewrite** rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
   - This ensures that routes like `/dashboard`, `/login`, etc. work correctly when the user refreshes the page or navigates directly to a URL.
6. Click **"Create Static Site"**.
7. Render will build and deploy your Vite application. Once done, you will get a Render URL (e.g., `https://skillgap-frontend.onrender.com`).

> **Note:** Render Static Sites are **completely free** (no spin-down like free Web Services). Your frontend will always be available instantly.

---

## Part 3: Final Integration (CORS Settings)

Now that both are deployed, you need to tell your backend to accept requests from your new Render frontend.

1. Go back to your **Render dashboard**.
2. Open your `skillgap-backend` web service.
3. Go to the **Environment** tab.
4. Update or add the `FRONTEND_URL` environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Render frontend URL (e.g., `https://skillgap-frontend.onrender.com`). *Make sure there is no trailing slash (`/`) at the end.*
5. Save the changes. Render will automatically redeploy the backend with the new environment variable.

---

## 🎉 Congratulations!
Your SkillGap Platform is now live!

- **Frontend**: Accessible via your Render Static Site URL (e.g., `https://skillgap-frontend.onrender.com`).
- **Backend**: Hosted as a Render Web Service and securely connected to your frontend.

### Troubleshooting Tips
- **CORS Errors**: If the frontend cannot communicate with the backend, check the browser console (F12) for CORS errors. Make sure the `FRONTEND_URL` in the backend's environment variables matches your frontend URL exactly (no trailing slash).
- **404 on Page Refresh**: If you get a 404 error when refreshing a page like `/dashboard`, make sure you added the Rewrite rule (`/* → /index.html`) in the Static Site's Redirects/Rewrites tab.
- **Backend Spin-Down**: Keep in mind that Render's free tier "spins down" the backend Web Service after 15 minutes of inactivity. The first API request after inactivity might take up to 50 seconds while the backend wakes up.
- **Build Failures**: If the frontend build fails on Render, check that the `VITE_API_URL` environment variable is set correctly. Vite injects environment variables at **build time**, so they must be set before the build runs.
- **TypeScript Errors**: If the build fails due to TypeScript errors, you can temporarily change the build command to `npm install && npx vite build` (skipping the `tsc` check) to get it deployed while you fix the errors locally.
