export function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return error ? (
    <div
      role="alert"
      className="my-4 border border-accent px-3 py-2.5 text-xs font-semibold text-accent"
    >
      {error}
    </div>
  ) : (
    <div
      role="status"
      className="my-4 border border-ok px-3 py-2.5 text-xs font-semibold text-ok"
    >
      {ok}
    </div>
  );
}
