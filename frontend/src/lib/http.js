export async function apiGet(path) {
  const base = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
