import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload } from "lucide-react";
import Alert from "./Alertas.jsx";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImageUploader({
  tipo = "punto",
  label = "Subir imagen",
  value = "",
  showPreview = true,
  idPunto,
  onUploadSuccess,
}) {
  const inputId = useId();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  async function getErrorMessage(res) {
    try {
      const data = await res.json();
      if (Array.isArray(data?.message)) return data.message.join(" ");
      return data?.message || "No se pudo subir la imagen";
    } catch {
      return "No se pudo subir la imagen";
    }
  }

  async function uploadImage(file) {
    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Necesitas iniciar sesion para subir imagenes.");
        return;
      }

      const formData = new FormData();
      formData.append("imagen", file);
      if (idPunto) {
        formData.append("idPunto", idPunto);
      }

      const res = await fetch(`${API}/api/upload/${tipo}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          setError("Tu sesion expiro. Inicia sesion nuevamente para subir imagenes.");
          setTimeout(() => navigate("/login", { replace: true }), 1800);
          return;
        }

        setError(await getErrorMessage(res));
        return;
      }

      const data = await res.json();
      setPreview(data.url);

      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch {
      setError("No se pudo conectar con la API para subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("La imagen no debe superar los 5MB.");
      return;
    }

    setError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    uploadImage(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <label
        htmlFor={inputId}
        className={`
          inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2.5
          font-semibold shadow-sm transition
          ${
            uploading
              ? "bg-gris/30 text-gris cursor-wait"
              : "bg-morado text-crema hover:bg-uva cursor-pointer"
          }
        `}
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Upload size={18} />
        )}
        {uploading ? "Subiendo..." : label}
      </label>

      {showPreview && preview && (
        <img
          src={preview}
          alt="Vista previa"
          className="w-32 h-32 rounded-2xl object-cover border-4 border-crema shadow-md"
        />
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
