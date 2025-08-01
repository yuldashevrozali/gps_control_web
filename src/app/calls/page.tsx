"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Excel eksport qilish uchun
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


interface Call {
  id: number;
  agent_full_name: string;
  agent_username: string | null;
  username: string;
  time: number;
  phone_number: string;
  call_type: string;
  call_type_display: string;
  call_date: string;
  created_at: string;
}

export default function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [agents, setAgents] = useState<string[]>([]);

  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [dateSearch, setDateSearch] = useState<string>(""); // Faqat bitta sana

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const res = await axios.get("https://gps.mxsoft.uz/account/call-history/list/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allCalls: Call[] = res.data.results || [];
        setCalls(allCalls);

        const uniqueAgents = Array.from(new Set(allCalls.map((c) => c.agent_full_name))).sort();
        setAgents(uniqueAgents);
      } catch (error) {
        console.error("Error fetching call history:", error);
        alert("Ma'lumotlarni olishda xatolik. Iltimos, qayta kirishni tekshiring.");
      }
    };

    fetchData();
  }, []);

  // Filtrlash funksiyasi
  const handleSearch = () => {
    let result = calls;

    if (selectedAgent !== "all") {
      result = result.filter((call) => call.agent_full_name === selectedAgent);
    }

    if (dateSearch) {
      // Sanani solishtirish: faqat kiritilgan sana bilan mos keladiganlar
      result = result.filter((call) => {
        const callDate = new Date(call.call_date).toISOString().slice(0, 10);
        return callDate === dateSearch;
      });
    }

    setFilteredCalls(result);
  };

  // Sahifani ochilganda avtomatik qidirish (masalan, barcha ma'lumotlarni ko'rsatish)
  useEffect(() => {
    if (calls.length > 0 && filteredCalls.length === 0) {
      handleSearch();
    }
  }, [calls]);

  // Excelga eksport qilish
  const handleExportToExcel = () => {
    if (filteredCalls.length === 0) {
      alert("Eksport qilish uchun ma'lumot mavjud emas.");
      return;
    }

    const exportData = filteredCalls.map((call) => ({
      "ID": call.id,
      "Telefon raqam": call.phone_number,
      "Qo'ng'iroq turi": call.call_type_display === "Outgoing"
        ? "Chiquvchi"
        : call.call_type_display === "Incoming"
        ? "Kiruvchi"
        : call.call_type_display === "Missed"
        ? "O‘tkazib yuborilgan"
        : call.call_type_display,
      "Davomiyligi (sek)": call.time,
      "Sana": new Date(call.call_date).toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "Foydalanuvchi": call.username,
      "Agent": call.agent_full_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    // Fayl nomini dinamik qilish
    const agentName = selectedAgent === "all" ? "barcha_agentlar" : selectedAgent.replace(/\s+/g, "_");
    const date = dateSearch || "barcha_sanalar";
    const fileName = `qongiroq_tarixi_${agentName}_${date}.xlsx`;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Qo'ng'iroqlar");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  return (
    <Card className="p-4 mt-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">📞 Qongiroq Tarixi</h2>

        {/* Filtrlar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Agent tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="date"
            className="border rounded px-3 py-2"
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            placeholder="Sana"
          />

          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
            Qidirish
          </Button>

          <Button
            onClick={handleExportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white ml-auto"
          >
            📥 Excelga saqlash
          </Button>
        </div>

        {/* Jadval */}
        {filteredCalls.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-center py-6">
            🔍 Hech qanday malumot topilmadi. Iltimos, filtrlarni ozgartiring.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Telefon raqam</TableHead>
                  <TableHead>Qongiroq turi</TableHead>
                  <TableHead>Davomiyligi (sek)</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.id}</TableCell>
                    <TableCell>{call.phone_number}</TableCell>
                    <TableCell>
                      {call.call_type_display === "Outgoing"
                        ? "Chiquvchi"
                        : call.call_type_display === "Incoming"
                        ? "Kiruvchi"
                        : call.call_type_display === "Missed"
                        ? "O‘tkazib yuborilgan"
                        : call.call_type_display}
                    </TableCell>
                    <TableCell>{call.time}</TableCell>
                    <TableCell>
                      {new Date(call.call_date).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{call.username}</TableCell>
                    <TableCell>{call.agent_full_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}