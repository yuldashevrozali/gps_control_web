'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp } from "lucide-react";
import { toast } from "react-toastify";

// Agent va uning kontraktlari uchun interfeyslarni aniqlash
interface Contract {
  id: number;
  total_debt_1c: number | string;
  // Yangi qo'shilgan
  mounthly_payment_1c?: number | string | null; // API dan null yoki undefined ham kelishi mumkin
  // Boshqa kerakli maydonlar...
}

interface Agent {
  id: number;
  contracts?: Contract[];
  // Boshqa kerakli maydonlar...
}

interface WebSocketData {
  type: string;
  agents_data?: Agent[];
  // Boshqa kerakli maydonlar...
}

export default function StatCards() {
  const [agentCount, setAgentCount] = useState<number>(0);
  const [totalContracts, setTotalContracts] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  // Yangi qo'shilgan: mounthly_payment_1c qiymatini saqlash uchun
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState<number>(0);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    console.log("Token:", accessToken, 127);

    if (!accessToken) {
      toast.error('❌ Token topilmadi. Iltimos, qayta login qiling.');
      return;
    }

    const socket = new WebSocket(`wss://gps.mxsoft.uz/ws/location/?token=${accessToken}`);

    socket.onopen = () => {
      console.log("✅ WebSocket ulanish ochildi");
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketData = JSON.parse(event.data);
        console.log("📩 WebSocket JSON xabari:", data);

        if (data.type === "connection_status" && Array.isArray(data.agents_data)) {
          const agents: Agent[] = data.agents_data;
          setAgentCount(agents.length);

          // Contract soni
          const contractCount = agents.reduce((acc: number, agent: Agent) => {
            const contracts = Array.isArray(agent.contracts) ? agent.contracts : [];
            return acc + contracts.length;
          }, 0);
          setTotalContracts(contractCount);

          // Umumiy qarzdorlikni yig‘ish (total_debt_1c)
          const totalDebtSum = agents.reduce((accDebt: number, agent: Agent) => {
            const contracts = Array.isArray(agent.contracts) ? agent.contracts : [];
            const agentDebt = contracts.reduce((contractAcc: number, contract: Contract) => {
              const debt = typeof contract.total_debt_1c === 'number' ? contract.total_debt_1c : parseFloat(String(contract.total_debt_1c)) || 0;
              return contractAcc + debt;
            }, 0);
            return accDebt + agentDebt;
          }, 0);
          setTotalDebt(totalDebtSum);

          // Yangi qo'shilgan: Umumiy oylik to'lovni hisoblash (mounthly_payment_1c)
          const totalMonthlyPaymentSum = agents.reduce((accPayment: number, agent: Agent) => {
            const contracts = Array.isArray(agent.contracts) ? agent.contracts : [];
            const agentPayment = contracts.reduce((contractAccPayment: number, contract: Contract) => {
              // Xavfsiz konversiya va null/undefined tekshiruvi
              let paymentValue = 0;
              if (contract.mounthly_payment_1c != null) { // null yoki undefined emasligini tekshirish
                 paymentValue = typeof contract.mounthly_payment_1c === 'number' ? contract.mounthly_payment_1c : parseFloat(String(contract.mounthly_payment_1c)) || 0;
              }
              return contractAccPayment + paymentValue;
            }, 0);
            return accPayment + agentPayment;
          }, 0);
          // Yangi qiymatni saqlash
          setTotalMonthlyPayment(totalMonthlyPaymentSum);

        }
      } catch (err) {
        console.error("❌ JSON.parse xatolik:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket xatosi:", error);
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`⚠️ WebSocket ulanish tozalandi: ${event.code} ${event.reason}`);
      } else {
        console.warn("⚠️ WebSocket ulanish kutilmaganda uzildi");
      }
    };

    return () => {
      console.log("🧹 WebSocket tozalanmoqda...");
      socket.close(1000, "Component unmounted");
    };
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
      title: "Davomat", // Yoki "Umumiy Oylik To'lov" deb o'zgartirishingiz mumkin
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