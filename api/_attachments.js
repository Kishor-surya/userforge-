export const PROVISIONING_CATEGORIES = [
  { key: "stationary", label: "Stationary" },
  { key: "access", label: "Access" },
  { key: "transportation", label: "Transportation Charges" },
  { key: "medical", label: "Medical Bills" },
  { key: "food", label: "Food Allowances" },
  { key: "accommodation", label: "Accommodation Cost" },
  { key: "gift_card", label: "Gift Card Request" },
];

export const PROVISIONING_CATEGORY_KEYS = PROVISIONING_CATEGORIES.map((c) => c.key);

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB

export const ATTACHMENT_BUCKET = "provisioning-attachments";

export function isValidProvisioningCategory(category) {
  return PROVISIONING_CATEGORY_KEYS.includes(category);
}

export function isAllowedAttachmentType(mimeType) {
  return ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType);
}

export function sanitizeFilename(name) {
  return String(name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
}
