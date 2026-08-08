import { supabase } from "./supabaseClient";

export async function getAllUsers() {
  const { data, error } = await supabase.from("users").select("*").order("id", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getUser(id) {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function emailExists(email, excludeId = null) {
  let query = supabase.from("users").select("id", { count: "exact", head: true }).eq("email", email);
  if (excludeId !== null && excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }
  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function addUser({ fullName, email, phone, age, department, role, status = "Active" }) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      full_name: fullName,
      email,
      phone,
      age,
      department,
      role,
      status,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUser(id, { fullName, email, phone, age, department, role, status }) {
  const { data, error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      email,
      phone,
      age,
      department,
      role,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkInsertUsers(rows) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("users")
    .insert(
      rows.map((r) => ({
        full_name: r.fullName,
        email: r.email,
        phone: r.phone,
        age: r.age,
        department: r.department,
        role: r.role,
        status: r.status || "Active",
      }))
    )
    .select();
  if (error) throw error;
  return data;
}
