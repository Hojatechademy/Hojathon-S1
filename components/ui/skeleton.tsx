import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-md bg-slate-200/90 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

export { Skeleton };
