export default function CargadorMapa({ text, className = "" }) {
  return (
    <div
      className={`absolute left-1/2 flex h-[52px] max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 overflow-hidden rounded-full border border-uva/20 bg-crema/95 px-4 shadow-lg backdrop-blur-md ${className}`}
    >
      <div className="aspect-square h-6 w-6 shrink-0 animate-spin rounded-full border-4 border-fucsia border-t-transparent" />
      <span className="min-w-0 truncate whitespace-nowrap text-uva font-fredoka text-sm sm:text-base tracking-wide">
        {text}
      </span>
    </div>
  );
}
