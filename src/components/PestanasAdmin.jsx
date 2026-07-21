export default function PestanasAdmin({ tabs = [] }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-uva/10 bg-white p-1 shadow-sm">
      {tabs.map(({ key, active, icon: Icon, label, count, onClick }) => (
        <button
          key={key || label}
          type="button"
          onClick={onClick}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            active
              ? "bg-uva text-crema shadow"
              : "bg-crema/70 text-uva/65 hover:bg-crema hover:text-uva"
          }`}
        >
          {Icon && <Icon size={17} />}
          {label}
          {count !== undefined && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                active ? "bg-crema/20 text-crema" : "bg-white text-uva"
              }`}
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
