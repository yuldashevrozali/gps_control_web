// lib/types.ts

export interface LocationData {
  lat: number;
  lon: number;
  timestamp: string; // ISO 8601 string
}

export interface ClientLocation {
  address_type?: string;
  name?: string;
  lat?: number;
  lon?: number;
  photo_url?: string;
}

export interface Client {
  id: number;
  full_name?: string;
  phone_number?: string;
  static_locations?: ClientLocation[];
}

export interface Company {
  id: number;
  name?: string;
}

export interface Contract {
  contract_number?: string;
  status?: boolean;
  client?: Client;
  company?: Company;
  due_date?: string; // Date string
  end_date?: string; // Date string
  debt_1c?: number;
  total_debt_1c?: number;
  mounthly_payment_1c?: number;
  total_due?: number;
  remaining?: number;
}

export interface Agent {
  id: number;
  full_name?: string;
  phone_number?: string;
  is_working_status: boolean;
  current_location?: LocationData;
  contracts?: Contract[];
}

export interface WebSocketMessage {
  type: string;
  agents_data?: Agent[];
  agent_id?: number;
  lat?: number;
  lon?: number;
  timestamp?: string;
  // Boshqa turlarni ham qo'shishingiz mumkin
}