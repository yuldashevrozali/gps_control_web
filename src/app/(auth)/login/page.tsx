/** @format */
"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginFormValues } from "../schemas/loginSchema";
import { Checkbox } from "@/components/ui/checkbox";
import icon from "../../../../public/img/logo.svg";

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
    const correctEmail = "yuldashevrozali08@gmail.com";
    const correctPassword = "salom123";

    if (data.email === correctEmail && data.password === correctPassword) {
      // ✅ Cookie saqlash (1 kun = 86400 soniya)
      // Ensure this cookie is set correctly
      document.cookie = "loggedIn=true; path=/; max-age=86400; SameSite=Lax; Secure"; // Added SameSite and Secure for better practice

      toast.success("✅ Muvaffaqiyatli kirdingiz!");
      router.push("/dashboard");
    } else {
      toast.error("❌ Email yoki parol noto‘g‘ri!");
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background text-foreground'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='rounded-full bg-violet-100 dark:bg-violet-900 p-3'>
          <Image alt='icon' src={icon} width={300} height={300} />
        </div>
        <h1 className='text-4xl font-bold'>Welcome 👋</h1>
        <p className='text-muted-foreground text-lg'>Please login here</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='mt-8 bg-card shadow-md rounded-xl w-full max-w-md p-6 space-y-6'
      >
        <div>
          <label className='block text-sm text-muted-foreground mb-1'>
            Email Address
          </label>
          <Input
            type='email'
            required
            {...register("email")}
            className='w-full h-13 px-4 py-3 border border-violet-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-foreground'
          />
          {errors.email && (
            <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className='block text-sm text-muted-foreground mb-1'>
            Password
          </label>
          <Input
            type='password'
            required
            {...register("password")}
            className='w-full h-13 px-4 py-3 border border-violet-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-foreground'
          />
          {errors.password && (
            <p className='text-red-500 text-sm mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-2'>
            <Checkbox id='terms' />
            <label
              htmlFor='terms'
              className='text-sm leading-none peer-disabled:cursor-not-allowed '
            >
              Remember Me
            </label>
          </div>

        </div>

        <button
          type='submit'
          className='w-full h-13 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-semibold transition'
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
