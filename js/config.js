// 執行環境設定：本機開發連本機房間伺服器，上線連 Cloudflare
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
export const RELAY = local ? 'ws://127.0.0.1:8787' : 'wss://vehicle-isles-relay.3a01chatgpt.workers.dev';
export const API = '/api';
export const LOCAL = local;
