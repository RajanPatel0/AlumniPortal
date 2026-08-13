/**
 * Windows Service Installer for AlumniPortalCampaignWorker
 * Run once on the Windows Server in an Administrator prompt:
 *   node scripts/install-service.js
 */
const path = require('path');

let Service;
try {
  Service = require('node-windows').Service;
} catch (e) {
  console.error('node-windows is not installed. To install as a Windows Service, run: pnpm add -D node-windows');
  process.exit(1);
}

const svc = new Service({
  name: 'AlumniPortalCampaignWorker',
  description: 'Background worker for IKGPTU Alumni Portal push notification campaigns',
  script: path.join(__dirname, 'campaign-worker.ts'),
  nodeOptions: ['--import=tsx'],
});

// Auto-restart tuning on crash / server reboot
svc.maxRestarts = 10;
svc.wait = 2;
svc.grow = 0.5;

svc.on('install', () => {
  console.log('✅ Service "AlumniPortalCampaignWorker" installed successfully.');
  console.log('Starting service now...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️ Service "AlumniPortalCampaignWorker" is already installed.');
});

svc.on('start', () => {
  console.log('🚀 Service "AlumniPortalCampaignWorker" is now RUNNING.');
});

svc.install();
