import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = 'node';

console.log('================================================================================');
console.log('🚀 Starting shoping.com Full-Stack Application on Localhost...');
console.log('================================================================================\n');

// 1. Start Backend Server
const serverDir = path.join(__dirname, 'server');
console.log('📦 Starting Backend Server (Port 5000)...');
const serverProcess = spawn(nodeCmd, ['server.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, FORCE_COLOR: '1' },
});

// 2. Start Frontend Vite Dev Server
const clientDir = path.join(__dirname, 'client');
console.log('💻 Starting Frontend Dev Server (Port 5173)...');
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, FORCE_COLOR: '1' },
});

// Clean shutdown on Ctrl+C or kill
const cleanup = () => {
  console.log('\n🛑 Shutting down servers...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

serverProcess.on('error', (err) => {
  console.error('Backend process error:', err.message);
});

clientProcess.on('error', (err) => {
  console.error('Frontend process error:', err.message);
});
