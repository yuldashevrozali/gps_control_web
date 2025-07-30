/** @format */
"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginFormValues } from "../schemas/loginSchema";
import icon from "../../../../public/img/logotip.jpg";
import { loginUser } from "../../../../utils/auth";
import Recaptcha from "../../components/recaptcha"; // to'g'ri import
import { useState } from "react";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    console.log("🚀 Login onSubmit ishga tushdi");
    console.log("📧 Email:", data.email);
    console.log("🔐 Parol:", data.password ? "[yashirilgan]" : "yo'q");
    console.log("🧩 CAPTCHA qiymati:", captchaValue);

    if (!captchaValue) {
      toast.error("Iltimos, reCAPTCHA ni to'ldiring!");
      return;
    }

    try {
      // CAPTCHA ni tekshirish
      const captchaRes = await fetch("/api/verify-captcha", {
        method: "POST",
        body: JSON.stringify({ captchaValue }),
        headers: { "Content-Type": "application/json" },
      });

      const captchaResult = await captchaRes.json();
      if (!captchaResult.success) {
        toast.error("Robot emasligingizni tekshiring!");
        console.log("reCAPTCHA xato:", captchaResult);
        return;
      }

      // Asosiy login
      const success = await loginUser(data.email, data.password);
      if (success) {
        toast.success("✅ Muvaffaqiyatli kirdingiz!");
        router.push("/dashboard");
      } else {
        toast.error("❌ Email yoki parol noto‘g‘ri!");
      }
    } catch (error) {
      toast.error("❌ Login jarayonida xatolik yuz berdi.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background text-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="rounded-full bg-violet-100 dark:bg-violet-900 p-3 flex items-center justify-center"
          style={{ width: 150, height: 150 }}
        >
          <Image
            alt="icon"
            src={icon}
            width={144}
            height={144}
            className="rounded-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold">Welcome 👋</h1>
        <p className="text-muted-foreground text-lg">Please login here</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 bg-card shadow-md rounded-xl w-full max-w-md p-6 space-y-6"
      >
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Email
          </label>
          <Input
            type="email"
            required
            placeholder="you@example.com"
            {...register("email")}
            className="w-full h-13 px-4 py-3 border border-violet-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-foreground"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Password
          </label>
          <Input
            type="password"
            required
            {...register("password")}
            className="w-full h-13 px-4 py-3 border border-violet-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-foreground"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* reCAPTCHA */}
        <div>
          <Recaptcha onChange={setCaptchaValue} />
        </div>


        <button
          type="submit"
          className="w-full h-13 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-semibold transition"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;