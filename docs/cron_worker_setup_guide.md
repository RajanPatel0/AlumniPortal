# 📘 Push Notification Background Cron Worker — Complete Setup & Operator Guide

This guide walks you through setting up, running, testing, and managing the **standalone background worker** for the IKGPTU Alumni Portal push notification system.

---

## 🏗️ How the Architecture Works

```
┌──────────────────────────────┐
│  Admin / Sub-Admin Browser   │
│  (/admin/notifications)      │
└──────────────┬───────────────┘
               │ 1. Submits Campaign (returns 202 in <500ms)
               ▼
┌──────────────────────────────┐
│        MySQL Database        │
│  notification_campaigns row  │ ◄── Single Source of Truth
│   status: "PENDING"          │     (No per-user row explosion)
└──────────────┬───────────────┘
               │ 2. Polled every minute (resumable cursor)
               ▼
┌──────────────────────────────┐
│ Standalone Background Worker │
│ (AlumniPortalCampaignWorker) │ ◄── Decoupled from IIS / iisnode
│   - Windows Service          │     (Runs 24/7, auto-restarts on crash)
└──────────────┬───────────────┘
               │ 3. Delivers in 500-user batches
               ▼
┌──────────────────────────────┐
│ Alumni Devices (Chrome, etc) │
│ - Displays OS-level Push     │
│ - Opens app on click         │
└──────────────────────────────┘
```

---

## 🚀 Part 1: Quick Testing in Development

To test the worker locally in your terminal while developing:

### Step 1: Subscribe an Alumni Account
1. Log in to the alumni portal (`/alumni/login`).
2. Go to your **Profile** (`/alumni/profile`).
3. Scroll to the **Web Push Notifications** card and click **"Enable Notifications"**.
4. Allow browser notification permissions when prompted.

### Step 2: Queue a Campaign in Admin Console
1. Log in to the Admin Dashboard (`/admin/dashboard`).
2. Click **"Push Campaigns"** in the sidebar (or visit `/admin/notifications`).
3. Select your target audience filter (or leave default for all).
4. Enter a **Title**, **Message Body**, and **Target URL**.
5. Click **"Queue Broadcast"** and confirm.

### Step 3: Run the Worker in Terminal
Open a separate PowerShell terminal in your project root:
```powershell
pnpm worker
```

**Output will look like this:**
```
═══════════════════════════════════════════════════════
🚀 Alumni Portal Notification Campaign Worker Started
🕒 Schedule: Every minute (*/1 * * * *)
═══════════════════════════════════════════════════════
[Worker] Found 1 active campaign(s) to process.
[Worker] Processing campaign "Annual Alumni Meet" (cm...)
[Worker] Campaign "Annual Alumni Meet" (cm...) COMPLETED.
```
Your browser will immediately receive the native OS push notification!

---

## 🏢 Part 2: Production Setup as a Windows Service

On your Windows Server, the worker runs as a persistent **Windows Service**. This ensures:
- It runs 24/7 in the background.
- It survives IIS app pool recycles and iisnode downtime.
- It automatically restarts on server reboot or unforeseen crashes.

### Step 1: Install `node-windows` (One-time only)
In your project directory on the server:
```powershell
pnpm add -D node-windows
```

### Step 2: Install and Start the Windows Service
Open **PowerShell as Administrator** and run:
```powershell
node scripts/install-service.js
```

**Output:**
```
✅ Service "AlumniPortalCampaignWorker" installed successfully.
Starting service now...
🚀 Service "AlumniPortalCampaignWorker" is now RUNNING.
```

---

## ⚙️ Part 3: Managing the Windows Service

You can manage the service using standard Windows PowerShell commands:

### Check Service Status
```powershell
Get-Service AlumniPortalCampaignWorker
```
*Status should show `Running`.*

### Restart Service (Run after deploying new code)
```powershell
Restart-Service AlumniPortalCampaignWorker
```

### Stop Service
```powershell
Stop-Service AlumniPortalCampaignWorker
```

### Start Service
```powershell
Start-Service AlumniPortalCampaignWorker
```

### View in Windows Services GUI
1. Press `Win + R`, type `services.msc`, and press **Enter**.
2. Look for **`AlumniPortalCampaignWorker`**.
3. You can right-click to Start, Stop, or Restart.

---

## 🗑️ Part 4: Uninstalling the Service

If you ever need to remove the Windows Service:
Open **PowerShell as Administrator**:
```powershell
node scripts/uninstall-service.js
```

---

## 🔍 Part 5: Troubleshooting & FAQs

### Q1: Where are the worker logs saved?
When running as a Windows Service via `node-windows`, logs are automatically written to:
`d:\PTU\7th-sem\camp_2\daemon\`
- `alumniportalcampaignworker.out.log` (standard output)
- `alumniportalcampaignworker.err.log` (error log)

### Q2: What happens if the server reboots or crashes mid-batch?
The worker uses **database-backed cursor tracking** (`cursor: lastProcessedAlumniId`). Every 500-user batch commits its progress to MySQL immediately. On restart, the worker picks up from the exact cursor where it stopped without restarting from zero or double-sending.

### Q3: What happens to users who uninstalled their browser or revoked notifications?
Web-push returns HTTP `404` or `410` (Gone). The worker catches this automatically and removes the dead endpoint from the `push_subscriptions` table via `pruneExpiredSubscriptions()`.
