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
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [agents, setAgents] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const res = await axios.get("https://gps.mxsoft.uz/account/call-history/list/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allCalls: Call[] = res.data.results;
        setCalls(allCalls);

        // Agentlarni faqat noyob holda olish
        const uniqueAgents = Array.from(new Set(allCalls.map(c => c.agent_full_name)));
        setAgents(uniqueAgents);
      } catch (error) {
        console.error("Error fetching call history:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      const filtered = calls.filter(call => call.agent_full_name === selectedAgent);
      setFilteredCalls(filtered);
    } else {
      setFilteredCalls([]);
    }
  }, [selectedAgent, calls]);

  return (
    <Card className="p-4 mt-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Agent Call History</h2>

        <Select onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-[300px] mb-4">
            <SelectValue placeholder="Select agent..." />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent, idx) => (
              <SelectItem key={idx} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filteredCalls.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time (sec)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Username</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map(call => (
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
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}
</TableCell>

                  <TableCell>{call.username}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : selectedAgent ? (
          <p className="mt-4 text-muted-foreground">No calls found for this agent.</p>
        ) : (
          <p className="mt-4 text-muted-foreground">Please select an agent to view call history.</p>
        )}
      </CardContent>
    </Card>
  );
}
