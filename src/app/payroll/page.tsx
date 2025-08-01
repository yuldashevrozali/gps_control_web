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
} from "@/components/ui/select";

// Excel yaratish uchun kutubxonalar
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [agentSearch, setAgentSearch] = useState("all"); // 'all' hamma agentlar uchun
  const router = useRouter();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");
    if (isLoggedIn !== "true") {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const checkThemeChange = () => {
      const updatedTheme = localStorage.getItem("hrms-theme");
      setTheme(updatedTheme === "dark" ? "dark" : "light");
    };
    checkThemeChange();
    const interval = setInterval(checkThemeChange, 10);
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

  // Faqat noyob agentlar
  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    data.forEach((item) => {
      if (item.processed_by_name) {
        agents.add(item.processed_by_name);
      }
    });
    return Array.from(agents).sort();
  }, [data]);

  // Filtrlangan ma'lumotlar
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchName = item.client_first_name
        .toLowerCase()
        .includes(firstNameSearch.toLowerCase());
      const matchDate = dateSearch
        ? new Date(item.paid_at).toISOString().slice(0, 10) === dateSearch
        : true;
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

  // Excelga eksport qilish funksiyasi
  const handleExportToExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Xaridor": `${item.client_first_name} ${item.client_last_name}`,
      "Contract raqami": item.contract_number,
      "Summa (UZS)": Number(item.amount).toLocaleString("en-US").replace(/,/g, " "),
      "To'lov sanasi": new Date(item.paid_at).toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "To'lov turi": item.method === "CLICK" ? "Click" : item.method === "CASH" ? "Naqd" : item.method === "CARD" ? "Karta" : item.method,
      "Holati": item.is_successful ? "Muvaffaqiyatli" : "Bekor qilingan",
      "Client ID": item.client_id,
      "Agent": item.processed_by_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "To'lovlar");

    // Agar biron agent tanlangan bo'lsa, fayl nomi unga mos bo'ladi
    const agentName = agentSearch === "all" ? "barcha" : agentSearch.replace(/\s+/g, "_");
    const fileName = `tolovlar_${agentName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Faylni yaratish va yuklab olish
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🧾 Tolovlar Jadvali</h2>

      {/* Qidiruv va filtrlar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Input
          placeholder="👤 Ism bo‘yicha qidirish"
          value={firstNameSearch}
          onChange={(e) => {
            setFirstNameSearch(e.target.value);
            setPage(1);
          }}
          className="w-64"
        />
        <Input
          type="date"
          value={dateSearch}
          onChange={(e) => {
            setDateSearch(e.target.value);
            setPage(1);
          }}
          className="w-48"
        />
        <Select value={agentSearch} onValueChange={setAgentSearch}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="👤 Agent bo‘yicha qidirish" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {uniqueAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Excelga eksport qilish tugmasi */}
        <Button
          onClick={handleExportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white ml-auto"
        >
          📥 Excelga saqlash
        </Button>
      </div>

      {/* Jadval */}
      {loading ? (
        <p className="text-center text-lg text-gray-500">⏳ Yuklanmoqda…</p>
      ) : filteredData.length === 0 ? (
        <p className="text-center text-lg text-red-500">🚫 Malumot topilmadi</p>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <Table className="w-full text-sm border-collapse border border-gray-300">
              <TableHeader>
                <TableRow
                  className={theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100"}
                >
                  <TableHead className="border border-gray-300 px-4 py-2">👤 Xaridor</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">📄 Contract raqami</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">💰 Summa</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">📅 Tolov sanasi</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">💳 Tolov turi</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">✅ Holati</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">🧾 Client ID</TableHead>
                  <TableHead className="border border-gray-300 px-4 py-2">👤 Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="border border-gray-300 px-4 py-2">
                      {item.client_first_name} {item.client_last_name}
                    </TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">
                      {item.contract_number}
                    </TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">
                      {Number(item.amount).toLocaleString("en-US").replace(/,/g, " ")} UZS
                    </TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">
                      {new Date(item.paid_at).toLocaleString("uz-UZ", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">
                      {item.method === "CLICK" ? "Click" : item.method === "CASH" ? "Naqd" : item.method === "CARD" ? "Karta" : item.method}
                    </TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">
                      {item.is_successful ? "✅ Muvaffaqiyatli" : "❌ Bekor"}
                    </TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">{item.client_id}</TableCell>
                    <TableCell className="border border-gray-300 px-4 py-2">{item.processed_by_name}</TableCell>
                  </TableRow>
                ))}

                {/* Bo'sh qatorlar (sahifani to'ldirish uchun) */}
                {Array.from({ length: ITEMS_PER_PAGE - currentPageData.length }).map((_, idx) => (
                  <TableRow key={`empty-${idx}`}>
                    {Array.from({ length: 8 }).map((_, colIdx) => (
                      <TableCell
                        key={colIdx}
                        className="border border-gray-300 h-10 text-transparent select-none"
                      >
                        -
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sahifalash */}
          <div className="mt-6 flex justify-center items-center gap-6">
            <Button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2"
            >
              ⬅️ Oldingi
            </Button>
            <span className="text-lg font-medium">
              {page} / {totalPages || 1}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages || 1))}
              disabled={page === totalPages}
              className="px-4 py-2"
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