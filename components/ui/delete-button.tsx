export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      className="apple-button-secondary px-3 py-2 text-xs"
    >
      Delete
    </button>
  );
}
