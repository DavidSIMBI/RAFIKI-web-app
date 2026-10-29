export function getHealthStatus() {
  return {
    status: 'ok',
    message: 'L’API RAFIKI fonctionne.',
    timestamp: new Date().toISOString(),
  };
}
