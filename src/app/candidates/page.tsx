"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Excel eksport qilish uchun
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Typelar
interface Client {
  id: number;
  full_name: string | null;
  first_name: string;
  last_name: string;
}
interface Contract {
  id: number;
  contract_number: string;
  external_id: number;
  client: Client;
}
interface Company {
  id: number;
  name: string;
}
interface Note {
  id: number;
  teg: string | null;
  comment: string;
  promised_time: string | null;
  created_at: string;
  contract: Contract;
  company: Company;
  processed_by_name: string; // API javobidan keladigan maydon
}

const Candidates = () => {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [agentSearch, setAgentSearch] = useState("all"); // 'all' — barcha agentlar
  const [theme, setTheme] = useState("dark");
  const itemsPerPage = 10;

  function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  }

  // Theme o'zgarishini kuzatish
  useEffect(() => {
    const checkThemeChange = () => {
      const updatedTheme = localStorage.getItem("hrms-theme");
      setTheme(updatedTheme === "dark" ? "dark" : "light");
    };
    checkThemeChange();
    const interval = setInterval(checkThemeChange, 100);
    return () => clearInterval(interval);
  }, []);

  // Ma'lumotlarni olish
  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");
    if (isLoggedIn !== "true") {
      router.push("/login");
    } else {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.warn("Access token not found. Redirecting to login.");
        router.push("/login");
        return;
      }
      axios
        .get("https://gps.mxsoft.uz/payments/contracts/notes/agent-or-manager/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setNotes(res.data.results || []);
        })
        .catch((err) => {
          console.error("API error fetching notes:", err);
          if (err.response && err.response.status === 401) {
            localStorage.removeItem("access_token");
            router.push("/login");
          }
        });
    }
  }, [router]);

  // Faqat noyob agentlarni olish
  const uniqueAgents = useMemo(() => {
    const agents = new Set<string>();
    notes.forEach((note) => {
      if (note.agent_name) {
        agents.add(note.agent_name);
      }
    });
    return Array.from(agents).sort();
  }, [notes]);

  // Filtrlangan ma'lumotlar
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const nameMatch = note.contract.client.first_name
        .toLowerCase()
        .includes(searchName.toLowerCase());
      const dateMatch = searchDate
        ? new Date(note.created_at).toISOString().slice(0, 10) === searchDate
        : true;
      const agentMatch =
        agentSearch === "all" ? true : note.agent_name === agentSearch;
      return nameMatch && dateMatch && agentMatch;
    });
  }, [notes, searchName, searchDate, agentSearch]);

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtrlarni tozalash
  const clearFilters = () => {
    setSearchName("");
    setSearchDate("");
    setAgentSearch("all");
    setCurrentPage(1);
  };

  // Excelga eksport qilish
  const handleExportToExcel = () => {
    const exportData = filteredNotes.map((note) => ({
      "Mijoz": `${note.contract.client.first_name} ${note.contract.client.last_name}`,
      "Izoh": note.comment,
      "Vada vaqti": note.promised_time
        ? new Date(note.promised_time).toLocaleDateString("uz-UZ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "-",
      "Shartnoma raqami": note.contract.contract_number,
      "Kompaniya": note.company.name,
      "Yaratilgan sana": new Date(note.created_at).toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      "Agent": note.agent_name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Zametkalar");

    const agentName = agentSearch === "all" ? "barcha_agentlar" : agentSearch.replace(/\s+/g, "_");
    const fileName = `zametkalar_${agentName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">📝 Zametkalar Jadvali</h2>

      {/* Qidiruv va Filtrlar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
        <Input
          type="text"
          placeholder="Ism bo‘yicha qidirish..."
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-1/3"
        />
        <Input
          type="date"
          value={searchDate}
          onChange={(e) => {
            setSearchDate(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-1/3"
        />

        {/* Agent bo'yicha qidirish */}
        <Select value={agentSearch} onValueChange={(value) => {
          setAgentSearch(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-full sm:w-1/3">
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

        <Button
          onClick={clearFilters}
          className={`px-4 py-2 hover:bg-gray-300 rounded w-full sm:w-auto ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
          }`}
        >
          Filtrlarni tozalash
        </Button>

        {/* Excelga saqlash tugmasi */}
        <Button
          onClick={handleExportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 w-full sm:w-auto ml-auto"
        >
          📥 Excelga saqlash
        </Button>
      </div>

      {/* Jadval */}
      {filteredNotes.length === 0 ? (
        <p className="text-center text-gray-500">🔍 Ma'lumot topilmadi</p>
      ) : (
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className={theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}>
              <th className="border px-4 py-2">👤 Mijoz</th>
              <th className="border px-4 py-2">💬 Izoh</th>
              <th className="border px-4 py-2">⏰ Vada vaqti</th>
              <th className="border px-4 py-2">📄 Shartnoma raqami</th>
              <th className="border px-4 py-2">🏢 Kompaniya</th>
              <th className="border px-4 py-2">📅 Yaratilgan sana</th>
              <th className="border px-4 py-2">👤 Agent</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: itemsPerPage }).map((_, index) => {
              const note = paginatedNotes[index];
              return note ? (
                <tr key={note.id} className="text-sm">
                  <td className="border px-4 py-2">{note.contract.client.first_name} {note.contract.client.last_name}</td>
                  <td className="border px-4 py-2">{note.comment}</td>
                  <td className="border px-4 py-2">
                    {note.promised_time
                      ? new Date(note.promised_time).toLocaleDateString("uz-UZ", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="border px-4 py-2">{note.contract.contract_number}</td>
                  <td className="border px-4 py-2">{note.company.name}</td>
                  <td className="border px-4 py-2">
                    {new Date(note.created_at).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="border px-4 py-2">{note.agent_name}</td>
                </tr>
              ) : (
                <tr key={`empty-${index}`}>
                  <td className="border px-4 py-2 h-10" colSpan={7}>&nbsp;</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={currentPage === 1}
          >
            Oldingi
          </Button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <Button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === idx + 1 ? "bg-blue-500 text-white" : ""
              }`}
            >
              {idx + 1}
            </Button>
          ))}
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={currentPage === totalPages}
          >
            Keyingi
          </Button>
        </div>
      )}

      {filteredNotes.length > itemsPerPage && (
        <div className="mt-4 text-center text-gray-600">
          Jami {filteredNotes.length} ta yozuv mavjud. Har sahifada {itemsPerPage} ta ko'rsatilmoqda.
        </div>
      )}
    </div>
  );
};

export default Candidates;