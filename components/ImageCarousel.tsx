"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { THUMB, cldUrl } from "@/lib/cloudinary-url";
import type { ImageEntry, SavedImage } from "@/lib/events";

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const PARALLEL_UPLOADS = 3;

/**
 * saved     : sudah tersimpan di acara ini (ada di database)
 * local     : dipilih dari perangkat, masih di browser (belum dikirim ke mana pun)
 * uploading : sedang dikirim ke Cloudinary saat Simpan ditekan
 * ready     : sudah terkirim ke Cloudinary tapi acara belum tersimpan (mis. simpan gagal di tengah jalan)
 * error     : gagal dikirim, file masih ada di browser dan akan dicoba lagi saat Simpan
 * remote    : gambar dari Instagram (hanya URL, tampil sebagai preview). Server yang mengambilnya saat Simpan
 */
type Item = {
  key: string;
  status: "saved" | "local" | "uploading" | "ready" | "error" | "remote";
  file?: File;
  preview?: string;
  name?: string;
  message?: string;
  cloudinaryId?: string;
  url?: string;
  width?: number | null;
  height?: number | null;
};

export type ImageCarouselHandle = {
  /** Kirim semua gambar lokal ke Cloudinary, lalu kembalikan daftar berurutan untuk disimpan. */
  uploadAll: () => Promise<ImageEntry[]>;
  /** Tambahkan gambar hasil impor Instagram. Hasil impor sebelumnya (yang belum disimpan) diganti. */
  addRemote: (urls: string[]) => { added: number; skipped: number };
};

/** Upload langsung dari browser ke Cloudinary memakai tanda tangan dari server. */
async function uploadToCloudinary(file: File): Promise<SavedImage> {
  const signRes = await fetch("/api/admin/upload-sign", { method: "POST" });
  if (!signRes.ok)
    throw new Error("Sesi habis. Muat ulang halaman lalu coba lagi.");
  const sign = await signRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("signature", sign.signature);
  fd.append("folder", sign.folder);
  fd.append("tags", sign.tags);
  fd.append("allowed_formats", sign.allowedFormats);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    {
      method: "POST",
      body: fd,
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.public_id) {
    throw new Error(data?.error?.message ?? "Upload gagal.");
  }
  return {
    cloudinaryId: data.public_id,
    url: data.secure_url,
    width: data.width,
    height: data.height,
  };
}

async function runPool<T>(
  list: T[],
  size: number,
  fn: (x: T) => Promise<void>,
) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, list.length) }, async () => {
      while (next < list.length) await fn(list[next++]);
    }),
  );
}

function Thumb({
  item,
  index,
  total,
  locked,
  onMove,
  onRemove,
}: {
  item: Item;
  index: number;
  total: number;
  locked: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (key: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.key,
    disabled: locked,
  });
  const src =
    item.preview ??
    (item.status === "remote"
      ? item.url
      : item.url
        ? cldUrl(item.url, THUMB)
        : undefined);

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`border border-ink bg-card ${isDragging ? "opacity-70 shadow-[3px_3px_0_var(--color-ink)]" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden bg-line">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            referrerPolicy={
              item.status === "remote" ? "no-referrer" : undefined
            }
            className={`h-full w-full object-cover ${item.status === "uploading" ? "opacity-50" : ""}`}
          />
        )}
        {index === 0 && (
          <span className="absolute left-1.5 top-1.5 bg-accent px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[.6px] text-on-accent">
            Cover
          </span>
        )}
        {item.status === "remote" && (
          <span className="absolute right-1.5 top-1.5 bg-ink px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[.6px] text-paper">
            Instagram
          </span>
        )}
        {item.status === "uploading" && (
          <span className="absolute inset-0 grid place-items-center text-ink">
            <Loader2
              size={22}
              className="animate-spin"
              aria-label="Mengupload"
            />
          </span>
        )}
        {item.status === "error" && (
          <span className="absolute inset-x-0 bottom-0 bg-card/95 p-1.5 text-center text-[10px] font-semibold leading-snug text-accent">
            {item.message ?? "Upload gagal."}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 p-1.5">
        <button
          type="button"
          aria-label="Geser untuk mengurutkan"
          disabled={locked}
          className="cursor-grab touch-none p-1 text-muted active:cursor-grabbing disabled:opacity-25 cursor-move"
          {...attributes}
          {...listeners}
        >
          <span className="cursor-move touch-none" /* + your drag listeners */>
            <GripVertical size={15} aria-hidden="true" />
          </span>
        </button>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={locked || index === 0}
            aria-label="Geser ke kiri"
            className="p-1 disabled:opacity-25"
          >
            <ArrowLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={locked || index === total - 1}
            aria-label="Geser ke kanan"
            className="p-1 disabled:opacity-25"
          >
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            disabled={locked}
            aria-label="Hapus gambar"
            className="p-1 text-accent disabled:opacity-25"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ImageCarousel({
  initial,
  locked,
  ref,
}: {
  initial: SavedImage[];
  /** true saat tombol Simpan sedang berjalan: kunci semua kontrol. */
  locked: boolean;
  ref?: Ref<ImageCarouselHandle>;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((i) => ({
      key: i.cloudinaryId,
      status: "saved" as const,
      ...i,
    })),
  );
  const [problems, setProblems] = useState<string[]>([]);

  // Salinan terbaru untuk dibaca di dalam uploadAll (state React baru berlaku di render berikutnya)
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Lepas preview lokal saat komponen ditutup
  useEffect(() => {
    return () => {
      itemsRef.current.forEach(
        (i) => i.preview && URL.revokeObjectURL(i.preview),
      );
    };
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useImperativeHandle(ref, () => ({
    async uploadAll() {
      const snapshot = itemsRef.current;
      const toUpload = snapshot.filter(
        (i) => (i.status === "local" || i.status === "error") && i.file,
      );
      const results = new Map<string, SavedImage>();
      let failed = 0;

      if (toUpload.length) {
        const keys = new Set(toUpload.map((i) => i.key));
        setItems((prev) =>
          prev.map((i) =>
            keys.has(i.key)
              ? { ...i, status: "uploading", message: undefined }
              : i,
          ),
        );

        await runPool(toUpload, PARALLEL_UPLOADS, async (it) => {
          try {
            const r = await uploadToCloudinary(it.file!);
            results.set(it.key, r);
            setItems((prev) =>
              prev.map((p) =>
                p.key === it.key
                  ? { ...p, ...r, status: "ready", file: undefined }
                  : p,
              ),
            );
            if (it.preview) URL.revokeObjectURL(it.preview);
          } catch (e) {
            failed++;
            setItems((prev) =>
              prev.map((p) =>
                p.key === it.key
                  ? { ...p, status: "error", message: (e as Error).message }
                  : p,
              ),
            );
          }
        });
      }

      if (failed) {
        throw new Error(
          `${failed} gambar gagal diupload. Acara belum disimpan. Tekan Simpan lagi untuk mencoba ulang gambar yang gagal.`,
        );
      }

      return snapshot.map((i): ImageEntry => {
        if (i.status === "remote") return { type: "url", url: i.url! };
        const r = results.get(i.key);
        return {
          cloudinaryId: r?.cloudinaryId ?? i.cloudinaryId!,
          url: r?.url ?? i.url!,
          width: r?.width ?? i.width ?? null,
          height: r?.height ?? i.height ?? null,
        };
      });
    },

    addRemote(urls: string[]) {
      const unique = Array.from(new Set(urls));
      const kept = itemsRef.current.filter((i) => i.status !== "remote");
      const room = Math.max(0, MAX_IMAGES - kept.length);
      const fresh = unique.slice(0, room);
      setItems([
        ...kept,
        ...fresh.map(
          (url): Item => ({ key: crypto.randomUUID(), status: "remote", url }),
        ),
      ]);
      return { added: fresh.length, skipped: unique.length - fresh.length };
    },
  }));

  const addFiles = (files: File[]) => {
    const issues: string[] = [];
    const accepted: File[] = [];
    let room = MAX_IMAGES - items.length;
    let tooMany = false;

    for (const f of files) {
      if (!ACCEPTED.includes(f.type))
        issues.push(`${f.name}: hanya JPG, PNG, atau WebP.`);
      else if (f.size > MAX_BYTES)
        issues.push(`${f.name}: ukuran lebih dari 5 MB.`);
      else if (room <= 0) tooMany = true;
      else {
        accepted.push(f);
        room--;
      }
    }
    if (tooMany) issues.push(`Maksimal ${MAX_IMAGES} gambar per acara.`);
    setProblems(issues);

    if (accepted.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...accepted.map(
        (file): Item => ({
          key: crypto.randomUUID(),
          status: "local",
          file,
          name: file.name,
          preview: URL.createObjectURL(file),
        }),
      ),
    ]);
  };

  const remove = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    // Gambar yang sudah terlanjur terkirim (simpan gagal di tengah jalan) langsung dibuang dari Cloudinary.
    // Gambar yang sudah tersimpan di acara baru dihapus saat acara disimpan.
    if (item?.status === "ready" && item.cloudinaryId) {
      fetch("/api/admin/upload-discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudinaryId: item.cloudinaryId }),
      }).catch(() => {});
    }
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const move = (index: number, dir: -1 | 1) =>
    setItems((prev) => {
      const to = index + dir;
      return to < 0 || to >= prev.length ? prev : arrayMove(prev, index, to);
    });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((i) => i.key === active.id);
      const to = prev.findIndex((i) => i.key === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
  };

  return (
    <div>
      {items.length > 0 && (
        <DndContext
          id="image-carousel"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.key)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
              {items.map((item, index) => (
                <Thumb
                  key={item.key}
                  item={item}
                  index={index}
                  total={items.length}
                  locked={locked}
                  onMove={move}
                  onRemove={remove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {items.length < MAX_IMAGES && !locked && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 border border-dashed border-ink bg-card px-4 py-3 text-xs font-bold hover:bg-trust">
          <ImagePlus size={16} aria-hidden="true" />
          Tambah gambar dari perangkat
          <input
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
      )}

      {problems.length > 0 && (
        <ul
          role="alert"
          className="mt-2 grid gap-1 text-[11px] font-semibold text-accent"
        >
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] leading-normal text-muted">
        JPG, PNG, atau WebP, maksimal 5 MB per file dan {MAX_IMAGES} gambar.
        Gambar pertama jadi cover; geser untuk mengurutkan. Gambar baru baru
        diupload saat kamu menekan Simpan, dan gambar yang dihapus baru hilang
        setelah disimpan. Gambar berlabel Instagram baru diambil server saat
        Simpan; kalau Simpan gagal karena linknya kedaluwarsa, ambil ulang dari
        Instagram.
      </p>
    </div>
  );
}
