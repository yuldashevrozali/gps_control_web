// pages/api/ws-proxy.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createProxyServer } from "http-proxy";

const proxy = createProxyServer({
  target: "wss://gps.mxsoft.uz", // maqsadli WebSocket server
  changeOrigin: true,
  ws: true,
  secure: false,
});

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Xatoliklarni tutib olish
  proxy.on("error", (err) => {
    console.error("❌ Proxy xatolik:", err);
  });

  // Har bir requestga Authorization header qo‘shamiz
  req.headers["authorization"] = `Bearer ${req.headers.token || ""}`;

  proxy.web(req, res);
}
