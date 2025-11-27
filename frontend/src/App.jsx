import React, { useEffect, useState, useRef } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./views/users/Login.jsx";
import Register from "./views/users/Registro.jsx";
import Home from "./views/users/Home.jsx";
import Carga from "./components/PantallaCarga.jsx";
import Splash from "./components/Splash.jsx";
import Proximamente from "./layouts/Proximamente.jsx";
import NotFound from "./layouts/404.jsx";
import PuntoDetalle from "./components/DetalleCompleto.jsx";
import PuntosAdmin from "./views/admin/PuntosAdmin.jsx";
import UsuariosAdmin from "./views/admin/UsuariosAdmin.jsx";
import VistaMapa from "./views/admin/VistaMapa.jsx";
import CrearPunto from "./views/admin/CrearPunto.jsx";
import EditarPunto from "./views/admin/EditarPunto.jsx";
import Perfil from "./views/users/Perfil.jsx";

export default function App() {
  const [step, setStep] = useState("loading");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setTimeout(() => {
      setStep("splash");
    }, 1000);
  }, []);

  if (step === "loading") return <Carga />;

  if (step === "splash")
    return <Splash onContinue={() => setStep("app")} />;

  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/punto/:id" element={<PuntoDetalle />} />
        <Route path="/proximamente" element={<Proximamente />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/admin/puntos" element={<PuntosAdmin />} />
        <Route path="/admin/usuarios" element={<UsuariosAdmin />} />
        <Route path="/admin/mapa" element={<VistaMapa />} />
        <Route path="/admin/puntos/nuevopunto" element={<CrearPunto/>} />
        <Route path="/admin/puntos/:id" element={<EditarPunto />} />
        <Route path="/perfil" element={<Perfil />} />
        

      </Routes>
  );
}
