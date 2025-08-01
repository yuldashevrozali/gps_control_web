"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Select komponentlarini import qildik

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

interface Payment {
  id: number;
  processed_by_name: string;
  contract_number: string;
  client_first_name: string;
  client_last_name: string;
  amount: string;
  paid_at: string;
  method: string;
  is_successful: boolean;
  company_id: number;
  client_id: number;
  note: number | null;
}

const ITEMS_PER_PAGE = 10;

const Payroll = () => {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [firstNameSearch, setFirstNameSearch] = useState("");
  const [dateSearch, setDateSearch] = useState("");
  // 'all' qiymati agent filtri bo'lmaganda ishlatiladi
  const [agentSearch, setAgentSearch] = useState("all");
  const router = useRouter();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");
    if (isLoggedIn !== "true") {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    const checkThemeChange = () => {
      const updatedTheme = localStorage.getItem("hrms-theme");
      setTheme(updatedTheme === "dark" ? "dark" : "light");
    };

    checkThemeChange(); // Dastlabki yuklanishda tekshiradi
    const interval = setInterval(checkThemeChange, 10); // Har 10msda tekshiradi

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("https://gps.mxsoft.uz/payments/manager/payments-lists", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        setData(json.results || []);
      })
      .catch((err) => {
        console.error("❌ Fetch xato:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Ma'lumotlardagi noyob agent nomlarini olamiz
  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    data.forEach((item) => {
      if (item.processed_by_name) {
        agents.add(item.processed_by_name);
      }
    });
    return Array.from(agents).sort();
  }, [data]);

  // Filtrlangaan ma'lumotlar
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchName = item.client_first_name
        .toLowerCase()
        .includes(firstNameSearch.toLowerCase());

      const matchDate = dateSearch
        ? new Date(item.paid_at).toISOString().slice(0, 10) === dateSearch
        : true;

      // Agent filtrlash shartini yangiladik
      const matchAgent =
        agentSearch === "all" ? true : item.processed_by_name === agentSearch;

      return matchName && matchDate && matchAgent;
    });
  }, [data, firstNameSearch, dateSearch, agentSearch]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentPageData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧾 Tolovlar Jadvali</h2>

      {/* 🔍 Qidiruv filtrlari */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="👤 Ism bo‘yicha qidirish"
          value={firstNameSearch}
          onChange={(e) => {
            setFirstNameSearch(e.target.value);
            setPage(1); // Filtr o'zgarganda sahifani 1-ga qaytarish
          }}
          className="w-64"
        />
        <Input
          type="date"
          value={dateSearch}
          onChange={(e) => {
            setDateSearch(e.target.value);
            setPage(1); // Filtr o'zgarganda sahifani 1-ga qaytarish
          }}
          className="w-48"
        />

        {/* Agent Select (Dropdown) */}
        <Select
          value={agentSearch} // Agent qidiruv qiymati bilan bog'laymiz
          onValueChange={(value) => {
            setAgentSearch(value);
            setPage(1); // Filtr o'zgarganda sahifani 1-ga qaytarish
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="👤 Agent bo‘yicha qidirish" />
          </SelectTrigger>
          <SelectContent>
            {/* "Barchasi" opsiyasi uchun qiymatni "all" qilib o'zgartirdik */}
            <SelectItem value="all">Barchasi</SelectItem>{" "}
            {uniqueAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p>⏳ Yuklanmoqda…</p>
      ) : filteredData.length === 0 ? (
        <p>🚫 Malumot topilmadi</p>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <Table className="w-full text-sm border-collapse border border-gray-300">
              <TableHeader>
                <TableRow
                  className={theme === "dark" ? "bg-gray-800" : "bg-gray-100"}
                >
                  <TableHead className="border border-gray-300">
                    👤 Xaridorlar
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    📄 Contract raqami
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    💰 Summa
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    📅 Tolov sanasi
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    💳 Tolov turi
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    ✅ Holati
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    🧾 Client ID
                  </TableHead>
                  <TableHead className="border border-gray-300">
                    👤 Agent
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="border border-gray-300">
                      {item.client_first_name} {item.client_last_name}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {item.contract_number}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {Number(item.amount)
                        .toLocaleString("en-US")
                        .replace(/,/g, " ")}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {new Date(item.paid_at).toLocaleString("uz-UZ", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {item.method === "CLICK"
                        ? "Click"
                        : item.method === "CASH"
                        ? "Naqd"
                        : item.method === "CARD"
                        ? "Karta"
                        : item.method}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {item.is_successful ? "✅" : "❌"}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {item.client_id}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {item.processed_by_name}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Jadvalni 10 qatordan to‘ldirish uchun bo‘sh qatorlar */}
                {Array.from({
                  length: ITEMS_PER_PAGE - currentPageData.length,
                }).map((_, idx) => (
                  <TableRow key={`empty-${idx}`}>
                    {Array.from({ length: 8 }).map((_, colIdx) => (
                      <TableCell
                        key={colIdx}
                        className="border border-gray-300 text-transparent select-none"
                      >
                        -
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sahifalashtirish (Pagination) */}
          <div className="mt-4 flex justify-center gap-4">
            <Button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              ⬅️ Oldingi
            </Button>
            <span className="text-lg font-semibold">
              {page} / {totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Keyingi ➡️
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Payroll;