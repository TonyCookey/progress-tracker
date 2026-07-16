import Button from "./Button";

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-col sm:flex-row justify-end items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => onChange(Math.max(page - 1, 1))} disabled={page === 1}>
        Previous
      </Button>
      <span className="px-2 py-1 text-sm font-medium text-neutral-600">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" size="sm" onClick={() => onChange(Math.min(page + 1, totalPages))} disabled={page === totalPages}>
        Next
      </Button>
    </div>
  );
}
