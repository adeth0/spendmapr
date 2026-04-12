export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="empty-state" role="status">
      <div className="max-w-sm space-y-4">
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-copy">{copy}</p>
      </div>
    </section>
  );
}
