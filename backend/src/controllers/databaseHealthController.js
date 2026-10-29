import { getDatabaseHealth } from '../services/databaseHealthService.js';

export async function getDatabaseHealthStatus(_request, response) {
  try {
    const health = await getDatabaseHealth();
    response.json(health);
  } catch {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
}
