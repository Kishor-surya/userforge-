const ADMIN_TOKEN_KEY = "userforge_admin_token";

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": getAdminToken() || "",
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) clearAdminToken();
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export async function adminLogin(username, password) {
  const res = await fetch("/api/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Login failed");
  setAdminToken(body.token);
  return body.token;
}

export async function adminLogout() {
  await fetch("/api/record-login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() || "" },
    body: JSON.stringify({ event: "logout" }),
  }).catch(() => {});
  clearAdminToken();
}

export async function adminRecordLogin() {
  await fetch("/api/record-login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() || "" },
    body: JSON.stringify({ event: "login" }),
  }).catch(() => {});
}

export async function adminGetAllUsers() {
  const body = await adminFetch("/api/admin-users");
  return body.users;
}

export async function adminCreateUser(payload) {
  return adminFetch("/api/create-user", { method: "POST", body: JSON.stringify(payload) });
}

export async function adminBulkCreateUsers(rows) {
  return adminFetch("/api/bulk-create-users", { method: "POST", body: JSON.stringify({ rows }) });
}

export async function adminUpdateUser(id, payload) {
  return adminFetch("/api/update-user", { method: "POST", body: JSON.stringify({ id, ...payload }) });
}

export async function adminDeleteUser(id) {
  return adminFetch("/api/delete-user", { method: "POST", body: JSON.stringify({ id }) });
}

export async function adminGetAuditLog() {
  const body = await adminFetch("/api/admin-audit-log");
  return body.events;
}

export async function adminGetLeaveRequests() {
  const body = await adminFetch("/api/admin-leave-requests");
  return body.requests;
}

export async function adminDecideLeave(id, decision, reason) {
  return adminFetch("/api/admin-decide-leave", { method: "POST", body: JSON.stringify({ id, decision, reason }) });
}

export async function adminGetProvisioningRequests() {
  const body = await adminFetch("/api/admin-provisioning-requests");
  return body.requests;
}

export async function adminDecideProvisioning(id, decision, { approvedAmount, rejectedAmount, reason }) {
  return adminFetch("/api/admin-decide-provisioning", {
    method: "POST",
    body: JSON.stringify({ id, decision, approvedAmount, rejectedAmount, reason }),
  });
}

export async function adminGetAttachmentUrl(requestId) {
  return adminFetch(`/api/attachment-url?id=${encodeURIComponent(requestId)}`, { method: "GET" });
}
