import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { btn, eyebrow, shell } from "@/lib/ui";

export const metadata = { title: "Masuk | coscheck" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const { error } = await searchParams;

  return (
    <main className={shell}>
      <div className="mx-auto my-16 max-w-[440px] border border-ink bg-card p-7 shadow-[4px_4px_0_var(--color-ink)]">
        <p className={eyebrow}>Panel admin</p>
        <h1 className="font-display text-[34px] font-bold leading-none tracking-[-1.6px]">
          MASUK.
        </h1>
        <p className="mt-3 text-[13px] leading-[1.7] text-muted">
          Halaman ini khusus admin dan owner coscheck. Masuk pakai akun Google
          yang sudah didaftarkan owner.
        </p>

        {error && (
          <div
            role="alert"
            className="my-4 border border-accent px-3 py-2.5 text-xs font-semibold text-accent"
          >
            {error === "AccessDenied"
              ? "Akun Google ini belum terdaftar atau sudah dinonaktifkan. Minta owner untuk menambahkan emailmu."
              : "Gagal masuk. Coba lagi sebentar lagi."}
          </div>
        )}

        <form
          className="mt-5"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button type="submit" className={btn}>
            Masuk dengan Google
          </button>
        </form>
      </div>
    </main>
  );
}
