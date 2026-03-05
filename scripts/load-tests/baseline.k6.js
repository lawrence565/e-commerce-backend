import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';

// Configuration: Setup our baseline constraints
export const options: Options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    // 95% of requests must complete below 200ms
    http_req_duration: ['p(95)<200'], 
    // Error rate must be less than 1%
    http_req_failed: ['rate<0.01'],   
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api';

export default function () {
  // 1. Test the cached Products endpoint (Should be very fast)
  const productsRes = http.get(`\${BASE_URL}/products?page=1&limit=20`);
  
  check(productsRes, {
    'products endpoint status is 200': (r) => r.status === 200,
    'products returned fast': (r) => r.timings.duration < 100,
  });

  sleep(1); // Simulate real user think-time

  // 2. Test the Health endpoint
  const healthRes = http.get(`http://localhost:8080/health`);
  
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'database is healthy': (r) => r.json('checks.database') === true,
    'redis is healthy': (r) => r.json('checks.redis') === true,
  });

  sleep(1);
}
