import http from 'k6/http';
import { sleep, check } from 'k6';
export let options = {
  vus: 100, // Simulate 100 concurrent users
  duration: '1m', // Run test for 1 minute
  thresholds: {
    http_req_duration: ['p(95)<500'], 
    // 95% of requests must complete under 500ms
  },
};
export default function () {
  const url = 'https://api.switchmap-ng.com/graphql'; 
  // // Replace with your GraphQL API URL
  const query = `
    query {
      allDevices {
        id
        name
      }
    }`;
  let res = http.post(url, JSON.stringify({ query }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'Response time < 500ms': (r) => r.timings.duration < 500,
    'Status is 200': (r) => r.status === 200,
  });
  sleep(1); // Simulate user wait time before next request
}
