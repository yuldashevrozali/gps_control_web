"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

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
  const itemsPerPage = 10;

  useEffect(() => {
    const isLoggedIn = getCookie("loggedIn");

    if (isLoggedIn !== "true") {
      router.push("/login");
    } else {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      axios
        .get("https://gps.mxsoft.uz/payments/contracts/notes/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setNotes(res.data.results || []);
        })
        .catch((err) => {
          console.error("API error:", err);
        });
    }
  }, []);

  const totalPages = Math.ceil(notes.length / itemsPerPage);
  const paginatedNotes = notes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Zametkalar Jadvali</h2>

      <table className="w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
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
                <td className="border px-4 py-2">{note.teg || "-"}</td>
                <td className="border px-4 py-2">{note.comment}</td>
                <td className="border px-4 py-2">
                  {note.promised_time
                    ? new Date(note.promised_time).toLocaleDateString()
                    : "-"}
                </td>
                <td className="border px-4 py-2">
                  {note.contract.contract_number}
                </td>
                <td className="border px-4 py-2">{note.company.name}</td>
                <td className="border px-4 py-2">
                  {new Date(note.created_at).toLocaleDateString()}
                </td>
              </tr>
            ) : (
              <tr key={`empty-${index}`}>
                <td className="border px-4 py-2" colSpan={7}>&nbsp;</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={currentPage === 1}
          >
            Oldingi
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === idx + 1 ? "bg-blue-500 text-white" : ""
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="px-3 py-1 border rounded hover:bg-gray-100"
            disabled={currentPage === totalPages}
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
};

export default Candidates;
