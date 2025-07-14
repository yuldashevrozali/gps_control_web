"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import api from "../../../utils/api";
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
import toast from "react-hot-toast";

// Token orqali oddiy WebSocket ulanishi (Bearer bilan)
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
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    if (wsRef.current) wsRef.current.close();

    const socket = new WebSocket(
      "wss://gps.mxsoft.uz/ws/location/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1Mjg5OTA2NiwiaWF0IjoxNzUyNDY3MDY2LCJqdGkiOiJjZWVkNGZjZGU2Y2I0MTZiYTgyNjgxM2ViNzRjN2I4OCIsInVzZXJfaWQiOjF9.w26E7DbV9F9RxUZKRYPYNWnF65fsd6xtvChIa0Hq4oE"
    );

    wsRef.current = socket;

    socket.onopen = () => console.log("✅ WebSocket ochildi");
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.agents_data) {
          setAgents(data.agents_data);
          setFilteredAgents(data.agents_data);
        }
      } catch (error) {
        console.error("❌ JSON parsing xatoligi:", error);
      }
    };

    socket.onerror = (error) => console.error("❌ WebSocket xatoligi:", error);
    socket.onclose = () => console.log("🔌 WebSocket yopildi");
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, []);

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

    // 1. Refresh tokenni olamiz
    const refreshToken = localStorage.getItem("refresh_token");
    let accessToken: string | null = localStorage.getItem("access_token");

    // 2. Agar access_token yo‘q bo‘lsa, refresh_token orqali yangisini olamiz
    if (!accessToken && refreshToken) {
      const res = await fetch("https://gps.mxsoft.uz/account/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) {
        toast.error("❌ Refresh token yaroqsiz");
        return;
      }

      const data = await res.json();
      accessToken = data.access;

      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
      } else {
        toast.error("❌ Yangi tokenni olishda xatolik");
        return;
      }
    }

    // 3. accessToken hali ham yo‘q bo‘lsa — demak tizimdan chiqaramiz
    if (!accessToken) {
      toast.error("❌ Avtorizatsiya token topilmadi");
      return;
    }

    // 4. Parolni o‘zgartirish so‘rovini yuboramiz
    await api.post(
      `/account/agent/${selectedAgent.id}/change-password/`,
      {
        new_password: newPassword,
        new_password_confirm: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    toast.success("✅ Parol o‘zgartirildi");
    setIsModalOpen(false);
  } catch (error) {
    console.error("❌ Parolni almashtirishda xatolik:", error);
    toast.error("❌ Parolni o‘zgartirishda muammo yuz berdi");
  } finally {
    setLoading(false);
  }
};





  return (
    <div className="border rounded-lg p-4 mt-4 overflow-x-auto">
      {/* 🔎 Qidiruv va filter */}
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

      {/* 🧾 Jadval */}
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
                    style={{ width: "auto", height: "auto" }}
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

      {/* 🔑 Modal */}
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
