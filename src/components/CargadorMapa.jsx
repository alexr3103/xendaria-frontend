export default function CargadorMapa({ text, className = "" }) {
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 bg-crema/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 border border-uva/20 ${className}`}
    >
      <div className="animate-spin w-6 h-6 border-4 border-fucsia border-t-transparent rounded-full" />
      <span className="text-uva font-fredoka text-base sm:text-lg tracking-wide">
        {text}
      </span>
    </div>
  );
}
