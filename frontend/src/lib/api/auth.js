const API_URL = import.meta.env.VITE_API_URL;

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/api/usuarios/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer fakeTokenTemporal"
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");
  return data;
}

export async function googleLogin(credential) {
  const res = await fetch(`${API_URL}/api/usuarios/login/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer fakeTokenTemporal"
    },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error al iniciar sesión con Google");
  return data;
}
