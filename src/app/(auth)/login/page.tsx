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

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Login jarayonini chaqiramiz
      const success = await loginUser(data.email, data.password);
      if (success) {
        toast.success("✅ Muvaffaqiyatli kirdingiz!");
        router.push("/");
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
      {/* Logotip va sarlavha */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="rounded-full bg-violet-100 dark:bg-violet-900 p-3 flex items-center justify-center"
          style={{ width: 150, height: 150 }}
        >
          <Image
            alt="logo"
            src={icon}
            width={144}
            height={144}
            className="rounded-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold">Welcome 👋</h1>
        <p className="text-muted-foreground text-lg">Please login here</p>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 bg-card shadow-md rounded-xl w-full max-w-md p-6 space-y-6"
      >
        {/* Email */}
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Email
          </label>
          <Input
            type="email"
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

        {/* Password */}
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Password
          </label>
          <Input
            type="password"
            {...register("password")}
            className="w-full h-13 px-4 py-3 border border-violet-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-foreground"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-13 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-semibold transition"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Kiring..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;