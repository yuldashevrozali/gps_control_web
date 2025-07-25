'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";



export default function StatCards() {
  const [agentCount, setAgentCount] = useState<number>(0);
  const [totalContracts, setTotalContracts] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  // Yangi qo'shilgan: mounthly_payment_1c qiymatini saqlash uchun
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState<number>(0);

  useEffect(() => {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) return;

  // Agentlar ro‘yxatini olish
  axios
    .get("https://gps.mxsoft.uz/account/agent-list/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      const agents = res.data.results;
      setAgentCount(agents.length);
    })
    .catch((err) => {
      console.error("❌ Agent listni olishda xatolik:", err);
      toast.error("Agentlarni olishda xatolik yuz berdi.");
    });

  // Contractlar bo‘yicha umumiy ma’lumot olish
  axios
    .get("https://gps.mxsoft.uz/payments/contracts/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      const data = res.data.results;
      const data2 = res.data;

      const contractCount = res.data.count;
      const totalDebt = parseFloat(data2.total_debt || "0");
      const currentDebt = parseFloat(data.current_debt || "0");


      setTotalContracts(contractCount);
      setTotalDebt(totalDebt);
      setTotalMonthlyPayment(currentDebt);
    })
    .catch((err) => {
      console.error("❌ Contracts API xatoligi:", err);
      toast.error("Shartnomalarni olishda xatolik yuz berdi.");
    });
}, []);




  // Stats massivini yangilash
  const stats = [
    {
      title: "Agentlar soni",
      value: agentCount,
      percent: 12,
      icon: ArrowUp,
      color: "text-green-600 dark:text-green-400",
      date: "Iyul 16, 2023",
    },
    {
      title: "Xaridorlar soni",
      value: totalContracts,
      percent: 5,
      icon: ArrowUp,
      color: "text-green-600 dark:text-green-400",
      date: "Iyul 14, 2023",
    },
    {
      title: "Joriy qarzlar", // Yoki "Umumiy Oylik To'lov" deb o'zgartirishingiz mumkin
      // Yangi qo'shilgan: value o'rniga totalMonthlyPayment
      value: totalMonthlyPayment.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }),
      percent: 12, // Bu qiymatni ham dinamik qilishingiz mumkin
      icon: ArrowUp, // Bu ham dinamik bo'lishi mumkin
      color: "text-green-600 dark:text-green-400",
      date: "Iyul 14, 2023", // Bu qiymatni ham yangilashingiz mumkin
    },
    {
      title: "Jami Qarzlar",
      value: totalDebt.toLocaleString('uz-UZ', { style: 'currency', currency: 'UZS' }),
      percent: 12,
      icon: ArrowUp,
      color: "text-green-600 dark:text-green-400",
      date: "Iyul 10, 2023",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((item, i) => {
        const bgColor = item.percent < 0 ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20";
        return (
          <Card
            key={i}
            className="bg-card text-card-foreground border-border shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-4 space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                {item.title}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-foreground">
                  {item.value}
                </div>
                <div
                  className={`text-xs flex items-center ${item.color} ${bgColor} px-2 py-1 rounded-full`}
                >
                  <item.icon className="w-3 h-3 mr-1" />
                  {Math.abs(item.percent)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Yangilanish: {item.date}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}