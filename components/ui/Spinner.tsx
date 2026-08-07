import clsx from "clsx";

export default function Spinner({ size = 48, fullScreen = true, className }: { size?: number; fullScreen?: boolean; className?: string }) {
  const spinner = (
    <div
      className={clsx("border-4 border-accent-500 border-t-transparent border-solid rounded-full animate-spin", className)}
      style={{ width: size, height: size }}
    />
  );

  if (!fullScreen) return spinner;

  return <div className="flex items-center justify-center min-h-screen">{spinner}</div>;
}
