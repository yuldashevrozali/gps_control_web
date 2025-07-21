'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "react-toastify";

export default function StatCards() {
  const [agentCount, setAgentCount] = useState<number>(0);
  const [totalContracts, setTotalContracts] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    console.log("Token:", accessToken, 127);

    if (!accessToken) {
      toast.error('❌ Token topilmadi. Iltimos, qayta login qiling.');
      return;
    }

    const socket = new WebSocket(`wss://gps.mxsoft.uz/ws/location/?token=${accessToken}`);

    socket.onopen = () => {
      console.log("✅ WebSocket ulanish ochidi");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 WebSocket JSON xabari:", data);

        if (data.type === "connection_status" && Array.isArray(data.agents_data)) {
          const agents = data.agents_data;
          setAgentCount(agents.length);

          // Contract soni
          const contractCount = agents.reduce((acc, agent) => {
            const contracts = Array.isArray(agent.contracts) ? agent.contracts : [];
            return acc + contracts.length;
          }, 0);
          setTotalContracts(contractCount);

          // Umumiy qarzdorlikni yig‘ish (total_debt_1c)
          const totalDebtSum = agents.reduce((acc, agent) => {
            const contracts = Array.isArray(agent.contracts) ? agent.contracts : [];
            const agentDebt = contracts.reduce((cAcc, contract) => {
              const debt = Number(contract.total_debt_1c) || 0;
              return cAcc + debt;
            }, 0);
            return acc + agentDebt;
          }, 0);
          setTotalDebt(totalDebtSum);
        }
      } catch (err) {
        console.error("❌ JSON.parse xatolik:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket xatosi:", error);
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket ulanish yopildi");
    };

    return () => {
      socket.close();
    };
  }, []);

  const stats = [
    {
      title: "Total Employee",
      value: agentCount,
      percent: 12,
      icon: ArrowUp,
      color: "text-green-600 dark:text-green-400",
      date: "July 16, 2023",
    },
    {
      title: "Total Applicant",
      value: totalContracts,
      percent: 5,
      icon: ArrowUp,
      color: "text-green-600 dark:text-green-400",
      date: "July 14, 2023",
    },
    {
      title: "Today Attendance",
      value: 470,
      percent: -8,
      icon: ArrowDown,
      color: "text-red-600 dark:text-red-400",
      date: "July 14, 2023",
    },
    {
      title: "Total Projects",
      value: totalDebt.toFixed(2), // yoki Math.round(totalDebt) agar butun son bo‘lsa
      percent: 12,
      icon: ArrowUp,
      color: "text-green-600 dark:text-green-400",
      date: "July 10, 2023",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((item, i) => {
        const bgColor = item.percent < 0 ? "bg-red-100" : "bg-green-100";
        return (
          <Card
            key={i}
            className="bg-card text-card-foreground border-border shadow-sm p-4"
          >
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                {item.title}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-foreground">
                  {item.value}
                </div>
                <div
                  className={`text-sm flex items-center ${item.color} ${bgColor} px-2 py-1 rounded`}
                >
                  <item.icon className="w-4 h-4 mr-1" />
                  {Math.abs(item.percent)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Update: {item.date}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
