/// <reference types="node" />
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localAppPath = path.join(__dirname, '../lib/app.js');
const coreAppPath = path.join(__dirname, '../../node_modules/@programisto/endurance/dist/internal/app.js');

if (fs.existsSync(localAppPath)) {
  await import(localAppPath);
} else {
  await import(coreAppPath);
}
