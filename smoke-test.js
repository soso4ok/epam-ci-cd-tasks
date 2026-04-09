'use strict';

const { spawn } = require('child_process');
const http = require('http');

let finished = false;
const server = spawn(process.execPath, ['server.js'], {
  stdio: ['ignore', 'ignore', 'inherit']
});

const finish = (ok, message) => {
  if (finished) {
    return;
  }
  finished = true;

  if (!server.killed) {
    server.kill('SIGTERM');
  }

  if (!ok) {
    console.error(message);
    process.exit(1);
  }

  console.log(message);
  process.exit(0);
};

const timeout = setTimeout(() => {
  finish(false, 'Smoke test timed out waiting for server response.');
}, 10000);

server.on('exit', (code, signal) => {
  if (!finished && code !== 0) {
    clearTimeout(timeout);
    finish(false, `Server exited before test completed (code=${code}, signal=${signal}).`);
  }
});

setTimeout(() => {
  const request = http.get('http://127.0.0.1:3000/', (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    response.on('end', () => {
      clearTimeout(timeout);
      if (response.statusCode !== 200) {
        finish(false, `Expected status 200 but got ${response.statusCode}.`);
        return;
      }
      if (data.trim() !== 'Hello World') {
        finish(false, `Unexpected response body: "${data.trim()}".`);
        return;
      }
      finish(true, 'Smoke test passed.');
    });
  });

  request.on('error', (error) => {
    clearTimeout(timeout);
    finish(false, `HTTP request failed: ${error.message}`);
  });
}, 1200);
