"use client";

import { useEffect, useMemo, useState } from "react"; // useMemo ni qo'shdik
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Select komponentlarini import qildik
import { Input } from "@/components/ui/input"; // Input komponentini import qildik (style mos kelishi uchun)
import { Button } from "@/components/ui/button"; // Button komponentini import qildik (style mos kelishi uchun)

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
}

const Candidates = () => {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  // 'all' qiymati teg filtri bo'lmaganda ishlatiladi
  const [searchTeg, setSearchTeg] = useState("all"); // Yangi state teg bo'yicha qidirish uchun
  const [theme, setTheme] = useState("dark"); // Default dark theme

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

    checkThemeChange(); // Dastlabki yuklanishda tekshiradi
    const interval = setInterval(checkThemeChange, 100); // Har 100msda tekshiradi

    return () => clearInterval(interval);
  }, []);

  // Ma'lumotlarni API dan olish
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setNotes(res.data.results || []);
        })
        .catch((err) => {
          console.error("API error fetching notes:", err);
          // Token eskirgan bo'lsa yoki xato bo'lsa, foydalanuvchini login sahifasiga qaytarish
          if (err.response && err.response.status === 401) {
            localStorage.removeItem("access_token");
            router.push("/login");
          }
        });
    }
  }, [router]); // router ni dependency array ga qo'shdik

  // Noyob "teg" qiymatlarini olish va ularni o'zbekcha tarjimalari bilan birga saqlash
  const uniqueTegs = useMemo(() => {
    const tegs = new Set<string>();
    notes.forEach((note) => {
      if (note.teg) {
        tegs.add(note.teg);
      }
    });
    // Teglar va ularning tarjimalari
    const tegMap: { [key: string]: string } = {
      PROMISED: "Vada berdi",
      UNREACHABLE: "Boglanib bolmadi",
      NOANSWER: "Javob bermadi",
    };
    // Tartiblash va tarjima qilish
    return Array.from(tegs)
      .sort() // Alifbo bo'yicha tartiblash
      .map((teg) => ({
        value: teg,
        label: tegMap[teg] || teg, // Agar tarjimasi bo'lmasa, asl tegni ishlatish
      }));
  }, [notes]);

  // 🔍 Filterlangan natijalar (useMemo bilan optimallashtirilgan)
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const nameMatch = note.contract.client.first_name
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const dateMatch = searchDate
        ? new Date(note.created_at).toISOString().slice(0, 10) === searchDate
        : true;

      // Teg filtrlash sharti
      const tegMatch =
        searchTeg === "all" ? true : note.teg === searchTeg;

      return nameMatch && dateMatch && tegMatch;
    });
  }, [notes, searchName, searchDate, searchTeg]); // Dependencylar

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔁 Filtrlarni tozalash funksiyasi
  const clearFilters = () => {
    setSearchName("");
    setSearchDate("");
    setSearchTeg("all"); // Teg filtrini ham tozalash
    setCurrentPage(1); // Sahifani boshiga qaytarish
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Zametkalar Jadvali</h2>

      {/* 🔍 Qidiruv va Filtrlar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
        <Input
          type="text"
          placeholder="Ism bo‘yicha qidirish..."
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setCurrentPage(1); // Filtr o'zgarganda sahifani 1-ga qaytarish
          }}
          className="w-full sm:w-1/3"
        />
        <Input
          type="date"
          value={searchDate}
          onChange={(e) => {
            setSearchDate(e.target.value);
            setCurrentPage(1); // Filtr o'zgarganda sahifani 1-ga qaytarish
          }}
          className="w-full sm:w-1/3"
        />

        {/* Teg Select (Dropdown) */}
        <Select
          value={searchTeg}
          onValueChange={(value) => {
            setSearchTeg(value);
            setCurrentPage(1); // Filtr o'zgarganda sahifani 1-ga qaytarish
          }}
        >
          <SelectTrigger className="w-full sm:w-1/3">
            <SelectValue placeholder="📝 Teg bo‘yicha qidirish" />
          </SelectTrigger>
          <SelectContent>
            {/* "Barchasi" opsiyasi uchun qiymatni "all" qilib o'zgartirdik */}
            <SelectItem value="all">Barchasi</SelectItem>{" "}
            {uniqueTegs.map((teg) => (
              <SelectItem key={teg.value} value={teg.value}>
                {teg.label}
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
      </div>

      {filteredNotes.length === 0 && !axios.isCancel(null) ? ( // Ma'lumot yuklanmagan va xato bo'lmagan holat
        <p>Malumotlar yuklanmoqda yoki mavjud emas...</p>
      ) : (
        <table className="w-full table-auto border border-gray-300">
          <thead>
            <tr className={theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}>
              <th className="border px-4 py-2">Mijoz</th>
              <th className="border px-4 py-2">Teg</th>
              <th className="border px-4 py-2">Izoh</th>
              <th className="border px-4 py-2">Vada vaqti</th>
              <th className="border px-4 py-2">Shartnoma raqami</th>
              <th className="border px-4 py-2">Kompaniya</th>
              <th className="border px-4 py-2">Yaratilgan sana</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: itemsPerPage }).map((_, index) => {
              const note = paginatedNotes[index];
              return note ? (
                <tr key={note.id} className="text-sm">
                  <td className="border px-4 py-2">
                    {note.contract.client.first_name}{" "}
                    {note.contract.client.last_name}
                  </td>
                  <td className="border px-4 py-2">
                    {/* Teg tarjimalarini ishlatish */}
                    {note.teg === "PROMISED"
                      ? "Vada berdi"
                      : note.teg === "UNREACHABLE"
                      ? "Erishib bo'lmaydi"
                      : note.teg === "NOANSWER"
                      ? "Javob bermadi"
                      : note.teg || "-"}
                  </td>
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
                  <td className="border px-4 py-2">
                    {note.contract.contract_number}
                  </td>
                  <td className="border px-4 py-2">{note.company.name}</td>
                  <td className="border px-4 py-2">
                    {new Date(note.created_at).toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                </tr>
              ) : (
                // Bo'sh qatorlar
                <tr key={`empty-${index}`}>
                  <td className="border px-4 py-2" colSpan={7}>
                    &nbsp;
                  </td>
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={currentPage === totalPages}
          >
            Keyingi
          </Button>
        </div>
      )}

      {/* Agar jami ma'lumotlar 10 dan ko'p bo'lsa, pagination haqida xabar */}
      {filteredNotes.length > itemsPerPage && (
        <div className="mt-4 text-center text-gray-600">
          Jami {filteredNotes.length} ta yozuv mavjud. Har sahifada{" "}
          {itemsPerPage} ta korsatilmoqda.
        </div>
      )}
    </div>
  );
};

export default Candidates;