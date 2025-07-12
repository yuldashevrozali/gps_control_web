// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, password } = req.body;

    const correctEmail = "yuldashevrozali08@gmail.com";
    const correctPassword = "salom123";

    if (email === correctEmail && password === correctPassword) {
      res.setHeader("Set-Cookie", `loggedIn=true; Path=/; Max-Age=86400; HttpOnly`);
      return res.status(200).json({ message: "Success" });
    } else {
      return res.status(401).json({ message: "Email or password incorrect" });
    }
  }

  // ❌ Boshqa methodlar uchun 405 qaytaradi:
  return res.status(405).json({ message: "Method Not Allowed" });
}
