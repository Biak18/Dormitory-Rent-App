export type Gender = "Male" | "Female";

export interface Tenant {
  id: string;
  name: string;
  gender: Gender;
  phone?: string;
  image_url?: string;
}

export interface Rental {
  id: string;
  room_id: string;
  tenants: Tenant[];
  start_date: string;
  end_date: string;
  person_count: 2 | 3;
  monthly_price: number;
  total_months: number;
  total_price: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string; // e.g. "A1", "B4"
  base_price: number;
  price_3person: number;
  is_rented: boolean;
  current_rental?: Rental;
}

export const ROOMS: Room[] = [
  { id: "A1", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "A2", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "A3", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "A4", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "A5", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "A6", base_price: 150000, price_3person: 200000, is_rented: false },
  { id: "B1", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "B2", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "B3", base_price: 180000, price_3person: 240000, is_rented: false },
  { id: "B4", base_price: 150000, price_3person: 200000, is_rented: false },
  { id: "B5", base_price: 150000, price_3person: 200000, is_rented: false },
];
