export const MESSAGE_KINDS = ["suggestion", "bug", "request"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const KIND_LABEL: Record<MessageKind, string> = {
  suggestion: "Saran",
  bug: "Bug",
  request: "Permintaan",
};

export const BODY_MIN = 5;
export const BODY_MAX = 1000;

// Sudut pandang owner (kotak masuk)
export const INBOX_STATUS_LABEL = { unread: "Baru", read: "Dibaca", done: "Selesai" } as const;
// Sudut pandang pengirim (admin)
export const SENT_STATUS_LABEL = { unread: "Terkirim", read: "Dibaca", done: "Selesai" } as const;
