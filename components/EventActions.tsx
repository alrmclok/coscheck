import { markVerified, setEventStatus, toggleCancelled } from "@/app/admin/events/actions";
import { btnDanger, btnGhost } from "@/lib/ui";

type Props = {
  id: string;
  status: "draft" | "published" | "archived";
  isCancelled: boolean;
  next: string;
};

function Hidden({ id, next }: { id: string; next: string }) {
  return (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={next} />
    </>
  );
}

export function EventActions({ id, status, isCancelled, next }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <form action={setEventStatus}>
          <Hidden id={id} next={next} />
          <input type="hidden" name="to" value="published" />
          <button type="submit" className={btnGhost}>Publikasikan</button>
        </form>
      )}

      {status === "published" && (
        <>
          <form action={markVerified}>
            <Hidden id={id} next={next} />
            <button type="submit" className={btnGhost}>Tandai terverifikasi</button>
          </form>
          <form action={setEventStatus}>
            <Hidden id={id} next={next} />
            <input type="hidden" name="to" value="draft" />
            <button type="submit" className={btnGhost}>Jadikan draft</button>
          </form>
        </>
      )}

      {status === "archived" && (
        <form action={setEventStatus}>
          <Hidden id={id} next={next} />
          <input type="hidden" name="to" value="draft" />
          <button type="submit" className={btnGhost}>Pulihkan</button>
        </form>
      )}

      {status !== "archived" && (
        <form action={toggleCancelled}>
          <Hidden id={id} next={next} />
          <button type="submit" className={isCancelled ? btnGhost : btnDanger}>
            {isCancelled ? "Cabut tanda batal" : "Tandai dibatalkan"}
          </button>
        </form>
      )}

      {status !== "archived" && (
        <form action={setEventStatus}>
          <Hidden id={id} next={next} />
          <input type="hidden" name="to" value="archived" />
          <button type="submit" className={btnGhost}>Arsipkan</button>
        </form>
      )}
    </div>
  );
}
