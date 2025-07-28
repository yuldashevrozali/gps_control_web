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
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");
    if (isLoggedIn !== "true") {
      router.push("/login");
    }
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

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchName = item.client_first_name
        .toLowerCase()
        .includes(firstNameSearch.toLowerCase());

      const matchDate = dateSearch
        ? new Date(item.paid_at).toISOString().slice(0, 10) === dateSearch
        : true;

      return matchName && matchDate;
    });
  }, [data, firstNameSearch, dateSearch]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentPageData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧾 Tolovlar Jadvali</h2>

      {/* 🔍 Search filters */}
      <div className="flex flex-wrap gap-4 mb-4">
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
                <TableRow className="bg-gray-100">
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

                {/* Jadvalni 10 qatordan to‘ldirish */}
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

          {/* Pagination */}
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
