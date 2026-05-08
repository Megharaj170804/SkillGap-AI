# SkillGap Platform Deployment Guide

This guide provides step-by-step instructions for deploying the **SkillGap Platform**. We will deploy the **Backend on Render** (a free and easy-to-use cloud platform for Node.js) and the **Frontend on Vercel** (the best platform for React/Vite applications).

---

## Part 1: Deploying the Backend on Render

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

## Part 2: Deploying the Frontend on Vercel

Vercel is optimized for frontend frameworks like Vite and React.

### Prerequisites
1. Create a free account on [Vercel.com](https://vercel.com/) (you can sign up with GitHub).
2. Have your GitHub repository ready.

### Steps
1. **Log in to Vercel** and click **"Add New..."** -> **"Project"**.
2. **Import your GitHub repository** containing the SkillGap project.
3. Configure the Project:
   - **Project Name**: `skillgap-frontend` (or any name)
   - **Framework Preset**: Vercel should automatically detect **Vite**. If not, select Vite from the dropdown.
   - **Root Directory**: Click "Edit" and select the `frontend` folder. (⚠️ *Very Important*)
4. **Configure Build and Output Settings**:
   Leave these as default (Vercel knows how to handle Vite):
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Set Environment Variables**:
   Open the "Environment Variables" dropdown. You need to link your frontend to the backend you just deployed.
   - **Name**: `VITE_API_URL` (or whatever variable name your frontend uses for the backend API).
   - **Value**: The Render backend URL you copied earlier (e.g., `https://skillgap-backend.onrender.com`).
6. Click **"Deploy"**.
7. Vercel will build and deploy your Vite application. Once done, you will get a Vercel URL (e.g., `https://skillgap-frontend.vercel.app`).

---

## Part 3: Final Integration (CORS Settings)

Now that both are deployed, you need to tell your backend to accept requests from your new Vercel frontend.

1. Go back to your **Render dashboard**.
2. Open your `skillgap-backend` web service.
3. Go to the **Environment** tab.
4. Update or add the `FRONTEND_URL` environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Vercel frontend URL (e.g., `https://skillgap-frontend.vercel.app`). *Make sure there is no trailing slash (`/`) at the end.*
5. Save the changes. Render will automatically redeploy the backend with the new environment variable.

## 🎉 Congratulations!
Your SkillGap Platform is now live! 

- **Frontend**: Accessible via your Vercel URL.
- **Backend**: Hosted on Render and securely connected to your frontend.

### Troubleshooting tips:
- If the frontend cannot communicate with the backend, check the browser console (F12) for **CORS errors**. Make sure the `FRONTEND_URL` in Render matches your Vercel URL exactly.
- Keep in mind that Render's free tier "spins down" the backend after 15 minutes of inactivity. When you open the frontend after a while, the first API request might take up to 50 seconds to complete while the backend wakes up.
