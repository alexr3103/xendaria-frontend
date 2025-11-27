import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Texto({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  error,
  ...props
}) {
  const [show, setShow] = useState(false);
  const describedBy = error ? `${name}-error` : undefined;
  const isPassword = type === "password";

  return (
    <label className="flex flex-col text-sm font-semibold text-uva relative">
      {label}
      <div className="relative">
        <input
          name={name}
          id={name}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`w-full p-3 mt-1 rounded-xl border focus:outline-none pr-10
            transition ${
              error
                ? "border-fucsia focus:ring-2 focus:ring-fucsia/60"
                : "border-gray-300 focus:ring-2 focus:ring-morado/60"
            }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-morado/70 hover:text-morado focus:outline-none"
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span id={`${name}-error`} className="mt-1 text-xs text-fucsia">
          {error}
        </span>
      )}
    </label>
  );
}
