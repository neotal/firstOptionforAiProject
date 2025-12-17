import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // טעינת משתני הסביבה לפי המצב (development/production)
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // מומלץ להסיר את ה-define הידני אם את משתמשת ב-import.meta.env
      // אבל אם הקוד שלך מסתמך על process.env, השאירי רק את זה:
      define: {
        'process.env': env
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // בדרך כלל ה-alias מכוון לתיקיית src
        }
      }
    };
});