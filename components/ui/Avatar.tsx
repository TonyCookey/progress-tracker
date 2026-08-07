import clsx from "clsx";

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-xl",
};

function initialsOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function Avatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={clsx("rounded-full object-cover flex-shrink-0", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        "rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-bold flex-shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  );
}
