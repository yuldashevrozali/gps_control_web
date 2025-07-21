"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Payment type
interface Payment {
  id: number;
  processed_by_name: string;
  contract_number: string;
  amount: string;
  paid_at: string;
  method: string;
  is_successful: boolean;
  company_id: number;
  client_id: number;
  note: number | null;
}

const Payroll = () => {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("https://gps.mxsoft.uz/payments/lists/?page=1", {
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧾 Tolovlar Jadvali</h2>

      {loading ? (
        <p>⏳ Yuklanmoqda&hellip;</p>
      ) : data.length === 0 ? (
        <p>🚫 Ma&#39;lumot topilmadi</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table className="w-full text-sm border-collapse border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="border border-gray-300">👤 Processed By</TableHead>
                <TableHead className="border border-gray-300">📄 Contract No</TableHead>
                <TableHead className="border border-gray-300">💰 Amount</TableHead>
                <TableHead className="border border-gray-300">📅 Paid At</TableHead>
                <TableHead className="border border-gray-300">💳 Method</TableHead>
                <TableHead className="border border-gray-300">✅ Successful</TableHead>
                <TableHead className="border border-gray-300">🏢 Company ID</TableHead>
                <TableHead className="border border-gray-300">👤 Client ID</TableHead>
                <TableHead className="border border-gray-300">🧾 Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="border border-gray-300">{item.processed_by_name}</TableCell>
                  <TableCell className="border border-gray-300">{item.contract_number}</TableCell>
                  <TableCell className="border border-gray-300">{item.amount} som</TableCell>
                  <TableCell className="border border-gray-300">
                    {new Date(item.paid_at).toLocaleString("uz-UZ", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="border border-gray-300">{item.method}</TableCell>
                  <TableCell className="border border-gray-300">{item.is_successful ? "Ha" : "Yo&#39;q"}</TableCell>
                  <TableCell className="border border-gray-300">{item.company_id}</TableCell>
                  <TableCell className="border border-gray-300">{item.client_id}</TableCell>
                  <TableCell className="border border-gray-300">{item.note ?? "Yo&#39;q"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Payroll;
