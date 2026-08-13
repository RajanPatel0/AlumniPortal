/**
 * Windows Service Uninstaller for AlumniPortalCampaignWorker
 * Run in an Administrator prompt:
 *   node scripts/uninstall-service.js
 */
const path = require('path');

let Service;
try {
  Service = require('node-windows').Service;
} catch (e) {
  console.error('node-windows is not installed.');
  process.exit(1);
}

const svc = new Service({
  name: 'AlumniPortalCampaignWorker',
  script: path.join(__dirname, 'campaign-worker.ts'),
});

svc.on('uninstall', () => {
  console.log('✅ Service "AlumniPortalCampaignWorker" uninstalled successfully.');
});

svc.uninstall();
