const cron = require('node-cron');
const { getTenantIntegrations } = require('./db');
const { syncFailedPayments } = require('./whop-service');
const { decrypt } = require('./encryption');

/**
 * Sincroniza pagos de todos los tenants que tengan Whop configurado
 */
async function syncAllTenants() {
  try {
    console.log('🔄 [CRON] Iniciando sincronización automática de todos los tenants...');
    
    // Obtener todos los tenants con Whop configurado
    const db = require('better-sqlite3')(process.env.DATABASE_URL || './data.db');
    const tenants = db.prepare(`
      SELECT tenant_id, whop_api_key 
      FROM tenant_integrations 
      WHERE whop_api_key IS NOT NULL 
      AND whop_api_key != ''
      AND is_whop_connected = 1
    `).all();
    
    if (tenants.length === 0) {
      console.log('ℹ️ [CRON] No hay tenants con Whop configurado');
      return;
    }
    
    console.log(`📊 [CRON] Sincronizando ${tenants.length} tenants...`);
    
    let totalSynced = 0;
    let errors = 0;
    
    for (const tenant of tenants) {
      try {
        const whopApiKey = decrypt(tenant.whop_api_key);
        const result = await syncFailedPayments(whopApiKey, tenant.tenant_id);
        
        if (result.success && result.inserted > 0) {
          console.log(`✅ [CRON] Tenant ${tenant.tenant_id}: ${result.inserted} pagos nuevos`);
          totalSynced += result.inserted;
        }
        
      } catch (err) {
        console.error(`❌ [CRON] Error sincronizando tenant ${tenant.tenant_id}:`, err.message);
        errors++;
      }
    }
    
    console.log(`✅ [CRON] Sincronización completada: ${totalSynced} pagos nuevos | ${errors} errores`);
    
  } catch (error) {
    console.error('❌ [CRON] Error en sincronización automática:', error.message);
  }
}

/**
 * Inicia el cron job para sincronización automática
 * Ejecuta cada 5 minutos
 */
function startWhopSyncScheduler() {
  // Ejecutar cada 5 minutos: */5 * * * *
  const cronSchedule = '*/5 * * * *';
  
  cron.schedule(cronSchedule, async () => {
    await syncAllTenants();
  });
  
  console.log('⏰ Whop Sync Scheduler iniciado (cada 5 minutos)');
  
  // Ejecutar una vez al iniciar (después de 30 segundos)
  setTimeout(async () => {
    console.log('🚀 [CRON] Primera sincronización automática...');
    await syncAllTenants();
  }, 30000);
}

module.exports = {
  startWhopSyncScheduler,
  syncAllTenants
};
