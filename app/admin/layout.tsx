import { signOut } from "@/auth";
import { AdminNav } from "@/components/AdminNav";
import { requireRole } from "@/lib/guard";
import { getNavCounts } from "@/lib/nav-counts";
import { badge, btnGhost, shell } from "@/lib/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole();
  const counts = await getNavCounts(user.role === "owner");

  return (
    <>
      <div
        className={`${shell} flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5 text-xs`}
      >
        <div className="text-muted">
          Masuk sebagai{" "}
          <strong className="text-ink">{user.name ?? user.email}</strong>
          <span className={`${badge} ml-1.5`}>{user.role}</span>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className={btnGhost}>
            Keluar
          </button>
        </form>
      </div>
      <div className={`${shell} border-b border-line py-3`}>
        <AdminNav isOwner={user.role === "owner"} counts={counts} />
      </div>
      <div className={`${shell} pb-14 pt-8`}>{children}</div>
    </>
  );
}
