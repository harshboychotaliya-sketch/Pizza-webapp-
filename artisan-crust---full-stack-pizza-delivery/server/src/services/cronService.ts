import cron, { ScheduledTask } from 'node-cron';
import { IngredientModel } from '../models/Ingredient.js';
import { sendLowStockAlertEmail } from './emailService.js';

let cronTask: ScheduledTask | null = null;

export async function checkAndAlertLowStock(): Promise<{ checked: number; alertedCount: number; items: any[] }> {
  try {
    const lowStockItems = await IngredientModel.getLowStockItems();
    if (lowStockItems.length === 0) {
      return { checked: 0, alertedCount: 0, items: [] };
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter items that haven't been alerted in the last 24 hours to prevent duplicate alert fatigue
    const itemsToAlert = lowStockItems.filter(item => {
      if (!item.lastAlertSentAt) return true;
      return new Date(item.lastAlertSentAt) < twentyFourHoursAgo;
    });

    if (itemsToAlert.length > 0) {
      console.log(`[CRON] Found ${itemsToAlert.length} low-stock ingredients needing notification.`);
      await sendLowStockAlertEmail(itemsToAlert.map(i => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        threshold: i.lowStockThreshold
      })));

      // Mark lastAlertSentAt timestamp
      for (const item of itemsToAlert) {
        if (item.id || item._id) {
          await IngredientModel.updateById(item.id || item._id!, { lastAlertSentAt: now });
        }
      }
    }

    return {
      checked: lowStockItems.length,
      alertedCount: itemsToAlert.length,
      items: lowStockItems
    };
  } catch (err) {
    console.error('[CRON] Error during low stock check:', err);
    return { checked: 0, alertedCount: 0, items: [] };
  }
}

export function initCronJobs() {
  // Run every hour: '0 * * * *'
  cronTask = cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Executing scheduled hourly inventory low-stock check...');
    await checkAndAlertLowStock();
  });
  console.log('[CRON] Initialized scheduled inventory monitoring (hourly).');
}

export function stopCronJobs() {
  if (cronTask) {
    cronTask.stop();
  }
}
