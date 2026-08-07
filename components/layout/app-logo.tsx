import { cn } from "@/lib/utils";

const SIZE = {
  sm: "size-8 rounded-lg text-base",
  md: "size-9 rounded-xl text-lg",
  lg: "size-11 rounded-2xl text-2xl",
} as const;

/**
 * The app mark: the same runner badge as `app/icon.svg`, rendered as an emoji
 * so it picks up the platform's own glyph. Shared so the three places that show
 * it can't drift apart on radius or colour, as they had.
 */
export function AppLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-primary text-primary-foreground",
        SIZE[size],
        className,
      )}
    >
      🏃
    </span>
  );
}
