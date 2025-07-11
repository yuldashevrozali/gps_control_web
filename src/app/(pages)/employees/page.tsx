"use client";

import Image from "next/image";
import api from "../../../../utils/api";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Pencil, Filter, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Agent = {
  full_name: string;
  phone_number: string;
  id: number;
  is_working_status: boolean;
  user_type_display: string;
  type?: string;
};

const AllEmployees = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // 1️⃣ Faqat bir marta tokenni localStorage'ga saqlaymiz
  useEffect(() => {
    localStorage.setItem("refresh_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1MjY0NDIzOCwiaWF0IjoxNzUyMjEyMjM4LCJqdGkiOiI3NGU1MzVmZmJiZDA0NWMyODIxMGM5ZDE5Nzk1OGFlMSIsInVzZXJfaWQiOjF9.4qE57fX2knUhKk-54sHa7IjFOdeE2pOTt5-C5btQ12I");
  }, []);

  // 2️⃣ WebSocket orqali agentlar ro‘yxatini olish
 useEffect(() => {
  const connectWebSocket = (token: string) => {
    const socket = new WebSocket(`ws://83.149.105.190:8000/ws/location/?token=${token}`);

    socket.onopen = () => console.log("✅ WebSocket ulanish ochildi");
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.agents_data) {
          setAgents(data.agents_data);
          setFilteredAgents(data.agents_data);
        }
      } catch (error) {
        console.error("❌ JSON parsing xatoligi:", error);
      }
    };

    socket.onerror = (error) => console.error("❌ WebSocket xato:", error);
    socket.onclose = () => console.log("🔌 WebSocket yopildi");
  };

  const token = localStorage.getItem("access_token");

  if (token) {
    connectWebSocket(token);
  } else {
    console.warn("❗ access_token topilmadi, refresh_token orqali olishga urinyapmiz...");

    const refresh = localStorage.getItem("refresh_token");

    if (refresh) {
      // Refresh orqali yangi access token olish
      fetch("http://83.149.105.190:8000/account/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access) {
            localStorage.setItem("access_token", data.access);
            connectWebSocket(data.access);
          } else {
            console.error("❌ Access token olishda xatolik:", data);
          }
        })
        .catch((err) => {
          console.error("❌ Access tokenni refresh qilishda xatolik:", err);
        });
    } else {
      console.warn("❗ refresh_token ham topilmadi.");
    }
  }
}, []);



  // 3️⃣ Qidiruv
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = agents.filter(
      (a) =>
        a.full_name.toLowerCase().includes(term) ||
        a.phone_number.includes(term)
    );
    setFilteredAgents(filtered);
    setCurrentPage(1);
  }, [searchTerm, agents]);

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
    setNewPassword("");
  };

  const handlePasswordChange = async () => {
    if (!selectedAgent) return;
    try {
      setLoading(true);
      await api.post(`/account/agent/${selectedAgent.id}/change-password/`, {
        new_password: newPassword,
        new_password_confirm: newPassword,
      });
      toast.success("✅ Parol muvaffaqiyatli o‘zgartirildi");
      setIsModalOpen(false);
    } catch (error) {
      console.error("❌ Parol o‘zgartirishda xatolik:", error);
      toast.error("❌ Parolni o‘zgartrishda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mt-4 overflow-x-auto">
      {/* Search va Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between mb-6">
        <div className="w-full md:w-72 relative">
          <Input
            placeholder="Search..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-500">
            <Search className="w-4 h-4" />
          </span>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm flex gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-4 text-sm">
              <p>Filter options go here...</p>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Jadval */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedAgents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            paginatedAgents.map((agent, idx) => (
              <TableRow key={idx}>
                <TableCell className="flex items-center gap-2">
                  <Image
                    src="/img/user.png"
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  {agent.full_name}
                </TableCell>
                <TableCell>{agent.id}</TableCell>
                <TableCell>+{agent.phone_number}</TableCell>
                <TableCell>{agent.user_type_display}</TableCell>
                <TableCell>{agent.type || "Office"}</TableCell>
                <TableCell>
                  {agent.is_working_status ? (
                    <span className="badge badge-sm bg-gradient-success text-white">
                      Online
                    </span>
                  ) : (
                    <span className="badge badge-sm bg-gradient-secondary text-white">
                      Offline
                    </span>
                  )}
                </TableCell>
                <TableCell>
  <div className="flex items-center gap-2 h-full">
    <Eye className="w-4 h-4 cursor-pointer hover:text-purple-600" />
    <Pencil
      className="w-4 h-4 cursor-pointer hover:text-yellow-500"
      onClick={() => openEditModal(agent)}
    />
  </div>
</TableCell>

              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm">Page</p>
                  <Select
                    defaultValue={String(currentPage)}
                    onValueChange={(val) => handlePageChange(Number(val))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {[...Array(totalPages)].map((_, idx) => (
                          <SelectItem key={idx} value={String(idx + 1)}>
                            {idx + 1}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, idx) => (
                      <PaginationItem key={idx}>
                        <PaginationLink
                          isActive={currentPage === idx + 1}
                          onClick={() => handlePageChange(idx + 1)}
                        >
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Parol o‘zgartirish Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <Button onClick={handlePasswordChange} disabled={loading}>
              {loading ? "Saving..." : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllEmployees;
