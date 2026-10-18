import { defineConfig } from 'vite';
export default defineConfig({ build: { assetsInlineLimit: 0, sourcemap: false, rolldownOptions: { input: ['index.html', 'scripted.html', 'devices.html', 'spoken.html', 'handsfree.html', 'recovery.html', 'notebook.html', 'notes-trial.html', 'notes-live.html', 'connection-probe.html'] } }, server: { host: '127.0.0.1' } });
