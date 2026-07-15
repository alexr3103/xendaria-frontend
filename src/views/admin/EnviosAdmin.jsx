import { useEffect, useState } from "react";
import AdminStyle from "../../layouts/AdminStyle.jsx";

export default function EnviosAdmin() {
    const API = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const [form, setForm] = useState({
        envioGratisDesde: "",
        capital_federal: "",
        conurbano_buenos_aires: "",
        buenos_aires: "",
        resto_pais: "",
    });

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargarConfig() {
        try {
            setCargando(true);
            setError("");
            setMensaje("");

            const res = await fetch(`${API}/api/envios`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });

            if (!res.ok) {
            throw new Error("No se pudo cargar la configuración de envíos");
            }

            const data = await res.json();

            setForm({
            envioGratisDesde: data.envioGratisDesde ?? "",
            capital_federal: data.costos?.capital_federal ?? "",
            conurbano_buenos_aires: data.costos?.conurbano_buenos_aires ?? "",
            buenos_aires: data.costos?.buenos_aires ?? "",
            resto_pais: data.costos?.resto_pais ?? "",
            });
        } catch (err) {
            setError(err.message || "No se pudo cargar la configuración");
        } finally {
            setCargando(false);
        }
        }

        cargarConfig();
    }, [API, token]);

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
        ...prev,
        [name]: value,
        }));
    }

    async function guardarConfiguracion(e) {
        e.preventDefault();

        try {
        setGuardando(true);
        setMensaje("");
        setError("");

        const body = {
            envioGratisDesde: Number(form.envioGratisDesde),
            costos: {
            capital_federal: Number(form.capital_federal),
            conurbano_buenos_aires: Number(form.conurbano_buenos_aires),
            buenos_aires: Number(form.buenos_aires),
            resto_pais: Number(form.resto_pais),
            },
        };

        const res = await fetch(`${API}/api/envios`, {
            method: "PATCH",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "No se pudo guardar la configuración");
        }

        setMensaje("Configuración de envíos actualizada correctamente");
        } catch (err) {
        setError(err.message || "No se pudo guardar la configuración");
        } finally {
        setGuardando(false);
        }
    }

    return (
        <AdminStyle title="Configuración de envíos">
        <div className="max-w-3xl">
            {cargando && (
            <p className="text-morado text-lg">Cargando configuración...</p>
            )}

            {!cargando && error && (
            <div className="bg-white border border-fucsia/30 text-uva rounded-2xl p-4 shadow-sm mb-6">
                {error}
            </div>
            )}

            {!cargando && !error && (
            <form
                onSubmit={guardarConfiguracion}
                className="bg-white rounded-3xl shadow-xl border border-uva/10 p-6 flex flex-col gap-6"
            >
                {mensaje && (
                <div className="bg-menta/40 border border-menta text-uva rounded-2xl px-4 py-3 text-sm font-medium">
                    {mensaje}
                </div>
                )}

                <div>
                <h2 className="text-2xl font-fredoka text-uva mb-2">
                    Costos actuales
                </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-uva">
                        Capital Federal
                        </label>
                        <input
                        type="number"
                        name="capital_federal"
                        value={form.capital_federal}
                        onChange={handleChange}
                        step="100"
                        className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-uva">
                        GCBA
                        </label>
                        <input
                        type="number"
                        name="conurbano_buenos_aires"
                        value={form.conurbano_buenos_aires}
                        onChange={handleChange}
                        step="100"
                        className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-uva">
                        Buenos Aires
                        </label>
                        <input
                        type="number"
                        name="buenos_aires"
                        value={form.buenos_aires}
                        onChange={handleChange}
                        step="100"
                        className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-uva">
                        Resto del país
                        </label>
                        <input
                        type="number"
                        name="resto_pais"
                        value={form.resto_pais}
                        onChange={handleChange}
                        step="100"
                        className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-sm font-semibold text-uva">
                        Envío gratis desde
                        </label>
                        <input
                        type="number"
                        name="envioGratisDesde"
                        value={form.envioGratisDesde}
                        onChange={handleChange}
                        step="10000"
                        className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={guardando}
                    className="bg-morado text-crema px-5 py-3 rounded-2xl font-bold hover:bg-morado/85 transition disabled:opacity-50"
                >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
                </div>
            </form>
            )}
        </div>
        </AdminStyle>
    );
}