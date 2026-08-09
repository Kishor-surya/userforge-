export function statusBadgeClass(status) {
  if (status === "approved") return "valid";
  if (status === "rejected") return "invalid";
  return "pending";
}
