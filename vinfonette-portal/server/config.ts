import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';

// Resolve the private OS-specific application data directory
function resolveDataDir(): string {
  if (process.env.VINFONETTE_DATA_DIR) {
    return path.resolve(process.env.VINFONETTE_DATA_DIR);
  }

  // Windows standard: %LOCALAPPDATA%\VinfoNette\data\
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, 'VinfoNette', 'data');
  }

  // macOS standard: ~/Library/Application Support/VinfoNette/data/
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'VinfoNette', 'data');
  }

  // Linux/Unix standard: ~/.local/share/vinfonette/data/
  return path.join(os.homedir(), '.local', 'share', 'vinfonette', 'data');
}

export const DATA_DIR = resolveDataDir();
export const RESUMES_DIR = path.join(DATA_DIR, 'resumes');
export const DOCUMENTS_DIR = path.join(DATA_DIR, 'documents');
export const BACKUPS_DIR = path.join(path.dirname(DATA_DIR), 'backups');
export const DB_PATH = path.join(DATA_DIR, 'vinfonette.db');
export const PORT = Number(process.env.PORT) || 4000;
// Render requires web services to bind to all interfaces; keep localhost-only in development.
export const HOST = process.env.HOST || (
  process.env.RENDER === 'true' || process.env.CODESPACES === 'true'
    ? '0.0.0.0'
    : '127.0.0.1'
);

// Ensure directories exist immediately on module load
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(RESUMES_DIR)) {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
}
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Generate or retrieve persistent local installation secret
function getOrCreateJwtSecret(): string {
  const secretPath = path.join(DATA_DIR, '.jwt_secret');
  if (fs.existsSync(secretPath)) {
    try {
      const secret = fs.readFileSync(secretPath, 'utf-8').trim();
      if (secret.length >= 32) return secret;
    } catch {
      // Re-create if corrupt
    }
  }

  const newSecret = crypto.randomBytes(64).toString('hex');
  try {
    fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
  } catch {
    // Write best-effort
  }
  return newSecret;
}

export const JWT_SECRET = getOrCreateJwtSecret();
