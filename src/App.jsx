import React, { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Routes, Route } from "react-router-dom";

import Login from "./views/users/Login.jsx";
import Register from "./views/users/Registro.jsx";
import Home from "./views/users/Home.jsx";
import Carga from "./components/PantallaCarga.jsx";
import Splash from "./components/Splash.jsx";
import ProteccionAdmin from "./components/ProteccionAdmin.jsx";
import ProteccionUsuario from "./components/ProteccionUsuario.jsx";
import Proximamente from "./layouts/Proximamente.jsx";
import NotFound from "./layouts/404.jsx";
import ErrorPage from "./layouts/Error.jsx";
import PuntoDetalle from "./components/DetalleCompleto.jsx";
import Comunidad from "./views/users/Comunidad.jsx";
import Ranking from "./views/users/Ranking.jsx";
import ActualizacionPWA from "./components/ActualizacionPWA.jsx";
import InstalacionPWA from "./components/InstalacionPWA.jsx";
import ActivacionNotificacionesPWA from "./components/ActivacionNotificacionesPWA.jsx";
import {
  completarBienvenidaPostLogin,
  hayBienvenidaPostLogin,
  obtenerDestinoSesion,
} from "./lib/sesion.js";

const Rutas = lazy(() => import("./views/users/Rutas.jsx"));
const Merch = lazy(() => import("./views/users/Merch.jsx"));
const DetalleMerch = lazy(() => import("./views/users/DetalleMerch.jsx"));
const Carrito = lazy(() => import("./views/users/Carrito.jsx"));
const Checkout = lazy(() => import("./views/users/Checkout.jsx"));
const PagoExitoso = lazy(() => import("./views/users/PagoExitoso.jsx"));
const PagoPendiente = lazy(() => import("./views/users/PagoPendiente.jsx"));
const PagoFallido = lazy(() => import("./views/users/PagoFallido.jsx"));
const Perfil = lazy(() => import("./views/users/Perfil.jsx"));
const EditarPerfil = lazy(() => import("./views/users/EditarPerfil.jsx"));
const Configuraciones = lazy(
  () => import("./views/users/Configuraciones.jsx")
);
const PerfilPublico = lazy(() => import("./views/users/PerfilPublico.jsx"));
const AlbumInsignias = lazy(() => import("./views/users/AlbumInsignias.jsx"));

const PuntosAdmin = lazy(() => import("./views/admin/PuntosAdmin.jsx"));
const UsuariosAdmin = lazy(() => import("./views/admin/UsuariosAdmin.jsx"));
const VistaMapa = lazy(() => import("./views/admin/VistaMapa.jsx"));
const CrearPunto = lazy(() => import("./views/admin/CrearPunto.jsx"));
const EditarPunto = lazy(() => import("./views/admin/EditarPunto.jsx"));
const RutasAdmin = lazy(() => import("./views/admin/RutasAdmin.jsx"));
const MerchAdmin = lazy(() => import("./views/admin/MerchAdmin.jsx"));
const CrearMerch = lazy(() => import("./views/admin/CrearMerch.jsx"));
const EditarMerch = lazy(() => import("./views/admin/EditarMerch.jsx"));
const DashboardAdmin = lazy(() => import("./views/admin/DashboardAdmin.jsx"));
const ComerciosAdmin = lazy(() => import("./views/admin/ComerciosAdmin.jsx"));

function CargaRuta() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-crema/40"
      role="status"
      aria-label="Cargando pantalla"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-morado/25 border-t-morado" />
    </div>
  );
}

function RutaInicial() {
  const destino = obtenerDestinoSesion();
  return destino ? <Navigate to={destino} replace /> : <Login />;
}

export default function App() {
  const [step, setStep] = useState(() =>
    hayBienvenidaPostLogin() ? "loading" : "app"
  );

  useEffect(() => {
    if (step !== "loading") return undefined;

    const timer = setTimeout(() => {
      setStep("splash");
    }, 1000);

    return () => clearTimeout(timer);
  }, [step]);

  function completarBienvenida() {
    completarBienvenidaPostLogin();
    setStep("app");
  }

  let contenido;

  if (step === "loading") {
    contenido = <Carga />;
  } else if (step === "splash") {
    contenido = <Splash onContinue={completarBienvenida} />;
  } else {
    contenido = (
      <Suspense fallback={<CargaRuta />}>
        <Routes>
        <Route path="/" element={<RutaInicial />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProteccionUsuario />}>
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merch/:id" element={<DetalleMerch />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/exito" element={<PagoExitoso />} />
          <Route path="/checkout/success" element={<PagoExitoso />} />
          <Route path="/checkout/aprobado" element={<PagoExitoso />} />
          <Route path="/checkout/pendiente" element={<PagoPendiente />} />
          <Route path="/checkout/pending" element={<PagoPendiente />} />
          <Route path="/checkout/error" element={<PagoFallido />} />
          <Route path="/checkout/failure" element={<PagoFallido />} />
          <Route path="/checkout/fallo" element={<PagoFallido />} />
          <Route path="/checkout/fallido" element={<PagoFallido />} />
          <Route path="/home" element={<Home />} />
          <Route path="/rutas" element={<Rutas />} />
          <Route path="/punto/:id" element={<PuntoDetalle />} />
          <Route path="/proximamente" element={<Proximamente />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/insignias" element={<AlbumInsignias />} />
          <Route path="/perfil/:id/insignias" element={<AlbumInsignias />} />
          <Route path="/perfil/:id" element={<PerfilPublico />} />
          <Route path="/perfil/editar" element={<EditarPerfil />} />
          <Route path="/perfil/configuracion" element={<Configuraciones />} />
        </Route>
        <Route path="/404" element={<NotFound />} />
        <Route path="/error/:code" element={<ErrorPage />} />
        <Route element={<ProteccionAdmin />}>
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/puntos" element={<PuntosAdmin />} />
          <Route path="/admin/usuarios" element={<UsuariosAdmin />} />
          <Route path="/admin/rutas" element={<RutasAdmin />} />
          <Route path="/admin/merch" element={<MerchAdmin />} />
          <Route path="/admin/comercios" element={<ComerciosAdmin />} />
          <Route path="/admin/merch/nuevo" element={<CrearMerch />} />
          <Route path="/admin/merch/editar/:id" element={<EditarMerch />} />
          <Route path="/admin/envios" element={<MerchAdmin initialTab="envios" />} />
          <Route path="/admin/mapa" element={<VistaMapa />} />
          <Route path="/admin/puntos/nuevopunto" element={<CrearPunto />} />
          <Route path="/admin/puntos/editar/:slug/:id" element={<EditarPunto />} />
          <Route path="/admin/puntos/:id" element={<EditarPunto />} />
        </Route>
        <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      {contenido}
      <ActualizacionPWA />
      <InstalacionPWA habilitada={step === "app"} />
      <ActivacionNotificacionesPWA habilitada={step === "app"} />
    </>
  );
}
