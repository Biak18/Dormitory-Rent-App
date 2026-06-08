import { File } from "expo-file-system";
import { Rental, Tenant } from "../types";
import { supabase } from "./supabase";

// ─── Fetch all active rentals ───────────────────────────────────────────────
export async function fetchActiveRentals(): Promise<
  { rental: Rental; tenants: Tenant[] }[]
> {
  const { data: rentals, error } = await supabase
    .from("rentals")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rentals?.length) return [];

  const rentalIds = rentals.map((r) => r.id);
  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("*")
    .in("rental_id", rentalIds);

  if (tErr) throw tErr;

  return rentals.map((rental) => ({
    rental: rental as Rental,
    tenants: (tenants || []).filter(
      (t) => t.rental_id === rental.id,
    ) as Tenant[],
  }));
}

// ─── Fetch all rentals (history) ────────────────────────────────────────────
export async function fetchAllRentals(): Promise<
  { rental: Rental; tenants: Tenant[] }[]
> {
  const { data: rentals, error } = await supabase
    .from("rentals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rentals?.length) return [];

  const rentalIds = rentals.map((r) => r.id);
  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("*")
    .in("rental_id", rentalIds);

  if (tErr) throw tErr;

  return rentals.map((rental) => ({
    rental: rental as Rental,
    tenants: (tenants || []).filter(
      (t) => t.rental_id === rental.id,
    ) as Tenant[],
  }));
}

// ─── Save a new rental with tenants ─────────────────────────────────────────
export async function saveRental(
  rental: Omit<Rental, "id" | "created_at" | "updated_at">,
  tenants: Omit<Tenant, "id">[],
): Promise<string> {
  const { tenants: _, ...rentalDbData } = rental;

  const { data, error } = await supabase
    .from("rentals")
    .insert([rentalDbData])
    .select()
    .single();

  if (error) {
    throw error;
  }
  const rentalId = data.id;

  const tenantRows = tenants.map((t) => ({ ...t, rental_id: rentalId }));
  const { error: tErr } = await supabase.from("tenants").insert(tenantRows);
  if (tErr) {
    throw tErr;
  }

  return rentalId;
}

// ─── Update payment status ───────────────────────────────────────────────────
export async function updatePaymentStatus(
  rentalId: string,
  isPaid: boolean,
): Promise<void> {
  console.log(rentalId, isPaid);
  const { error } = await supabase
    .from("rentals")
    .update({ is_paid: isPaid })
    .eq("id", rentalId);
  console.log("updated");
  if (error) throw error;
}

// ─── Deactivate a rental (move out) ─────────────────────────────────────────
export async function deactivateRental(rentalId: string): Promise<void> {
  const { error } = await supabase
    .from("rentals")
    .update({ is_active: false })
    .eq("id", rentalId);
  if (error) throw error;
}

// ─── Upload tenant photo ─────────────────────────────────────────────────────
export async function uploadTenantPhoto(
  localUri: string,
  fileName: string,
): Promise<string> {
  const fileReference = new File(localUri);
  const base64 = await fileReference.base64();

  const { error } = await supabase.storage
    .from("tenant-photos")
    .upload(fileName, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("tenant-photos")
    .getPublicUrl(fileName);
  return data.publicUrl;
}

// base64 decode helper
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
