#!/usr/bin/env node

import http from 'http';

const PORT = process.env.PORT || 10000;
const HOST = 'localhost';

const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/health',
  method: 'GET',
  timeout: 5000, // 5 second timeout
  headers: {
    'User-Agent': 'Docker-Healthcheck/1.0'
  }
};

const request = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        if (response.status === 'ok') {
          console.log('✅ Health check passed');
          process.exit(0);
        } else {
          console.log('❌ Health check failed: invalid response');
          process.exit(1);
        }
      } else {
        console.log(`❌ Health check failed: HTTP ${res.statusCode}`);
        process.exit(1);
      }
    } catch (e) {
      console.log('❌ Health check failed: invalid JSON response');
      process.exit(1);
    }
  });
});

request.on('error', (err) => {
  console.log(`❌ Health check failed: ${err.message}`);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('❌ Health check failed: timeout');
  request.destroy();
  process.exit(1);
});

request.end();
