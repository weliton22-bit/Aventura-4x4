import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registro de Service Worker para PWA e Android TWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    const swPath = (import.meta.env.BASE_URL || './') + 'sw.js';
    navigator.serviceWorker.register(swPath).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
