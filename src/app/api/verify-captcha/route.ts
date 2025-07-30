// app/api/verify-captcha/route.ts
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export async function POST(request: NextRequest) {
  const { captchaValue } = await request.json();

  if (!captchaValue) {
    return NextResponse.json(
      { success: false, message: "reCAPTCHA kerak" },
      { status: 400 }
    );
  }

  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${captchaValue}`;
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.success) {
    return NextResponse.json({ success: true });
  } else {
    console.log("reCAPTCHA xato:", data["error-codes"]);
    return NextResponse.json(
      { success: false, message: "reCAPTCHA tekshiruvi muvaffaqiyatsiz" },
      { status: 400 }
    );
  }
}