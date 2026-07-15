import React, { useEffect, useState, useRef } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./views/users/Login.jsx";
import Register from "./views/users/Registro.jsx";
import Home from "./views/users/Home.jsx";
import Carga from "./components/PantallaCarga.jsx";
import Splash from "./components/Splash.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import Proximamente from "./layouts/Proximamente.jsx";
import NotFound from "./layouts/404.jsx";
import ErrorPage from "./layouts/Error.jsx";
import PuntoDetalle from "./components/DetalleCompleto.jsx";
import PuntosAdmin from "./views/admin/PuntosAdmin.jsx";
import UsuariosAdmin from "./views/admin/UsuariosAdmin.jsx";
import VistaMapa from "./views/admin/VistaMapa.jsx";
import CrearPunto from "./views/admin/CrearPunto.jsx";
import EditarPunto from "./views/admin/EditarPunto.jsx";
import RutasAdmin from "./views/admin/RutasAdmin.jsx";
import Perfil from "./views/users/Perfil.jsx";
import EditarPerfil from "./views/users/EditarPerfil.jsx";
import Ranking from "./views/users/Ranking.jsx";
import Rutas from "./views/users/Rutas.jsx";
import Merch from "./views/users/Merch.jsx";
import DetalleMerch from "./views/users/DetalleMerch.jsx";
import Carrito from "./views/users/Carrito.jsx";
import Checkout from "./views/users/Checkout.jsx";
import PagoExitoso from "./views/users/PagoExitoso.jsx";
import PagoPendiente from "./views/users/PagoPendiente.jsx";
import PagoFallido from "./views/users/PagoFallido.jsx";
import MerchAdmin from "./views/admin/MerchAdmin.jsx";
import CrearMerch from "./views/admin/CrearMerch.jsx";
import EditarMerch from "./views/admin/EditarMerch.jsx";
import DashboardAdmin from "./views/admin/DashboardAdmin.jsx";

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
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/merch" element={<Merch />} />
        <Route path="/merch/:id" element={<DetalleMerch />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/exito" element={<PagoExitoso />} />
        <Route path="/checkout/pendiente" element={<PagoPendiente />} />
        <Route path="/checkout/error" element={<PagoFallido />} />
        <Route path="/punto/:id" element={<PuntoDetalle />} />
        <Route path="/proximamente" element={<Proximamente />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="/error/:code" element={<ErrorPage />} />
        <Route path="*" element={<NotFound />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/puntos" element={<PuntosAdmin />} />
          <Route path="/admin/usuarios" element={<UsuariosAdmin />} />
          <Route path="/admin/rutas" element={<RutasAdmin />} />
          <Route path="/admin/merch" element={<MerchAdmin />} />
          <Route path="/admin/merch/nuevo" element={<CrearMerch />} />
          <Route path="/admin/merch/editar/:id" element={<EditarMerch />} />
          <Route path="/admin/envios" element={<MerchAdmin initialTab="envios" />} />
          <Route path="/admin/mapa" element={<VistaMapa />} />
          <Route path="/admin/puntos/nuevopunto" element={<CrearPunto/>} />
          <Route path="/admin/puntos/editar/:slug/:id" element={<EditarPunto />} />
          <Route path="/admin/puntos/:id" element={<EditarPunto />} />
        </Route>
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil/editar" element={<EditarPerfil />} />
        

      </Routes>
  );
}
