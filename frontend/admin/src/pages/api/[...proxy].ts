// frontend/admin/src/pages/api/[...proxy].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';

// Initialize proxy server
const proxy = httpProxy.createProxyServer();

// Disable body parsing for proxy
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    // Remove `/api` from the path when forwarding
    req.url = req.url?.replace(/^\/api/, '');

    // Forward request to backend
    proxy.web(req, res, {
      target: process.env.NEXT_PUBLIC_API_URL,
      changeOrigin: true,
      proxyTimeout: 30000,
    }, (err) => {
      if (err) {
        console.error('Proxy error:', err);
        reject(err);
      }
      resolve(undefined);
    });
  });
}