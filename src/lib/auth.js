import { supabase } from "./supabaseClient";

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Returns an unsubscribe function. */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

async function recordLoginEvent(event, accessToken) {
  await fetch("/api/record-login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await recordLoginEvent("login", data.session.access_token);
  return data.session;
}

/** Called right after landing from an invite/recovery link, before the user has a real password yet. */
export async function setPasswordAfterInvite(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  const session = await getSession();
  if (session) await recordLoginEvent("login", session.access_token);
}

export async function signOut() {
  const session = await getSession();
  if (session) await recordLoginEvent("logout", session.access_token);
  await supabase.auth.signOut();
}

/** RLS on the `users` table restricts this to rows in the caller's own department. */
export async function getMyDepartmentUsers() {
  const { data, error } = await supabase.from("users").select("*").order("id", { ascending: false });
  if (error) throw error;
  return data;
}

async function authedFetch(path, options = {}) {
  const session = await getSession();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export async function submitLeaveRequest({ startDate, endDate, reason }) {
  return authedFetch("/api/submit-leave-request", {
    method: "POST",
    body: JSON.stringify({ startDate, endDate, reason }),
  });
}

/** RLS on leave_requests restricts this to the caller's own rows. */
export async function getMyLeaveRequests() {
  const { data, error } = await supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitProvisioningRequest(payload) {
  return authedFetch("/api/submit-provisioning-request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** RLS on provisioning_requests restricts this to the caller's own rows. */
export async function getMyProvisioningRequests() {
  const { data, error } = await supabase
    .from("provisioning_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMyAttachmentUrl(requestId) {
  const body = await authedFetch(`/api/attachment-url?id=${encodeURIComponent(requestId)}`, { method: "GET" });
  return body;
}
