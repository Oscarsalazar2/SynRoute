import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Star,
  MapPin,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  Flag,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteRide,
  finishRide,
  getRideRequests,
  getRides,
  updateRideRequest,
} from "../services/api";
import "./DriverDashboard.css";

const DriverDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [totalRides, setTotalRides] = useState(0);
  const [myRoutesState, setMyRoutesState] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de ventanas (Modales)
  const [routeToRate, setRouteToRate] = useState(null);
  const [ratings, setRatings] = useState({});
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [successModal, setSuccessModal] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [toast, setToast] = useState(null);

  const weeklyEarnings = useMemo(
    () =>
      myRoutesState.reduce((sum, route) => sum + Number(route.price || 0), 0),
    [myRoutesState],
  );

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError("");

      const [rides, rideRequests] = await Promise.all([
        getRides({ role: "driver", userId: user.id }),
        getRideRequests(user.id),
      ]);

      setMyRoutesState(
        rides.filter((r) => r.status === "active" || r.status === "full"),
      );
      setRequests(rideRequests);
    } catch (err) {
      setError(err.message || "No se pudo cargar el panel del conductor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const handleRequestAction = async (reqId, action) => {
    try {
      await updateRideRequest(reqId, {
        driverId: user.id,
        status: action,
      });
      await loadDashboardData();

      setToast(
        action === "accepted"
          ? "Pasajero aceptado exitosamente"
          : "Pasajero rechazado",
      );
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err.message || "No se pudo procesar la solicitud");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRide(routeToDelete, user.id);
      await loadDashboardData();
      setRouteToDelete(null);
    } catch (err) {
      setToast(err.message || "No se pudo eliminar la ruta");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleFinishRide = async (route) => {
    const acceptedCount = requests.filter(
      (req) => req.routeId === route.id && req.status === "accepted",
    ).length;

    if (acceptedCount === 0) {
      await finishRide(route.id, user.id);
      await loadDashboardData();
      setTotalRides((prev) => prev + 1);
      setSuccessModal({
        open: true,
        title: "Viaje Finalizado",
        message:
          "Has concluido la ruta marcada. No se requirió cobrar ni calificar ya que no subiste pasajeros.",
      });
    } else {
      setRouteToRate(route);
    }
  };

  const submitRatings = async () => {
    await finishRide(routeToRate.id, user.id);
    await loadDashboardData();
    setTotalRides((prev) => prev + 1);
    setRouteToRate(null);
    setSuccessModal({
      open: true,
      title: "¡Viaje Completado!",
      message:
        "Cobro procesado y las calificaciones de los pasajeros han sido guardadas. ¡Gran trabajo!",
    });
  };

  const passengersToRate = routeToRate
    ? requests
        .filter(
          (req) => req.routeId === routeToRate.id && req.status === "accepted",
        )
        .map((r) => r.passenger)
    : [];

  return (
    <div className="driver-dashboard animate-fade-in">
      <header className="dashboard-header mb-lg">
        <h1>Hola de nuevo, {(user?.name || "Conductor").split(" ")[0]}</h1>
        <p>Panel de Conductor Activo</p>
      </header>

      {error && (
        <div
          className="glass-panel text-center mb-lg"
          style={{ padding: "16px" }}
        >
          <p>{error}</p>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="stats-section flex flex-col gap-md">
          <div className="stat-card glass-panel flex items-center justify-between">
            <div>
              <p className="stat-label">Ganancias Estimadas (Semana)</p>
              <h2 className="stat-value text-success">${weeklyEarnings} MXN</h2>
            </div>
            <div className="stat-icon-wrapper bg-success-light">
              <Wallet size={28} className="text-success" />
            </div>
          </div>
          <div className="stat-card glass-panel flex items-center justify-between">
            <div>
              <p className="stat-label">Viajes Completados</p>
              <h2 className="stat-value">{totalRides}</h2>
            </div>
            <div className="stat-icon-wrapper bg-blue-light">
              <Star size={28} className="text-blue" />
            </div>
          </div>

          <Link
            to="/publicar"
            className="btn btn-primary btn-lg w-full publish-btn-cta mt-sm"
          >
            <MapPin size={20} /> Programar Nueva Ruta
          </Link>
        </section>

        <section className="management-section">
          <h2 className="section-title">Panel de Rutas Publicadas</h2>

          {isLoading && (
            <div
              className="glass-panel text-center p-xl mb-lg"
              style={{ padding: "40px 20px" }}
            >
              <h3>Cargando rutas...</h3>
            </div>
          )}

          {!isLoading && myRoutesState.length === 0 ? (
            <div
              className="glass-panel text-center p-xl mb-lg"
              style={{ padding: "40px 20px" }}
            >
              <h3>No tienes viajes activos</h3>
              <p className="text-secondary">
                Tus rutas automatizadas aparecerán aquí.
              </p>
            </div>
          ) : (
            myRoutesState.map((route) => (
              <div
                key={route.id}
                className="active-route-card glass-panel mb-lg"
              >
                <div className="route-header flex justify-between items-start mb-md">
                  <div>
                    <h3>
                      {route.from.name} a {route.to.name}
                    </h3>
                    <div className="recurring-days mt-sm flex gap-xs">
                      {route.days ? (
                        route.days.map((d) => (
                          <span key={d} className="day-badge">
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="day-badge">Hoy</span>
                      )}
                    </div>
                  </div>
                  <span className="badge-timing flex items-center gap-xs">
                    <Clock size={14} /> {route.time}
                  </span>
                </div>

                <div className="route-details flex justify-between mb-sm text-secondary">
                  <span>
                    Asientos: {route.availableSeats}/{route.totalSeats}
                  </span>
                  <span>Tarifa sugerida: ${route.price}</span>
                </div>

                <div
                  className="route-controls flex justify-between gap-sm border-t mt-md"
                  style={{
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  <div className="flex gap-sm">
                    <button
                      onClick={() => navigate(`/publicar?id=${route.id}`)}
                      className="btn btn-secondary btn-sm"
                      title="Editar Ruta"
                    >
                      <Pencil size={16} /> Editar
                    </button>
                    <button
                      onClick={() => setRouteToDelete(route.id)}
                      className="btn btn-danger-outline btn-sm"
                      title="Eliminar Ruta"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                  <button
                    onClick={() => handleFinishRide(route)}
                    className="btn btn-primary btn-sm finish-btn"
                  >
                    <Flag size={16} /> Finalizar Viaje
                  </button>
                </div>
              </div>
            ))
          )}

          <h2 className="section-title flex justify-between items-center mt-xl">
            Buzón de Solicitudes
            {requests.filter((r) => r.status === "pending").length > 0 && (
              <span className="notification-dot"></span>
            )}
          </h2>

          <div className="requests-feed">
            {requests.map((req) => {
              const belongsToMe = myRoutesState.some(
                (r) => r.id === req.routeId,
              );
              if (!belongsToMe) return null; // No mostrar peticiones de rutas que eliminaste

              return (
                <div
                  key={req.id}
                  className={`request-card glass-panel flex justify-between items-center mb-md ${req.status !== "pending" ? "resolved" : ""}`}
                >
                  <div className="passenger-info flex items-center gap-md">
                    <img
                      src={req.passenger.avatar}
                      alt={req.passenger.name}
                      className="req-avatar"
                    />
                    <div>
                      <h4 className="flex items-center gap-sm">
                        {req.passenger.name}
                        {req.passenger.isVerified && (
                          <CheckCircle size={16} className="text-blue" />
                        )}
                      </h4>
                      <span className="req-rating flex items-center gap-xs text-warning">
                        <Star size={12} fill="currentColor" />{" "}
                        {req.passenger.rating}
                      </span>
                      <p className="req-msg mt-sm">"{req.message}"</p>
                    </div>
                  </div>

                  <div className="req-actions flex flex-col gap-sm">
                    {req.status === "pending" ? (
                      <>
                        <button
                          onClick={() =>
                            handleRequestAction(req.id, "accepted")
                          }
                          className="btn btn-primary btn-sm accept-btn"
                        >
                          <CheckCircle size={16} /> Aceptar
                        </button>
                        <button
                          onClick={() =>
                            handleRequestAction(req.id, "rejected")
                          }
                          className="btn btn-secondary btn-sm reject-btn"
                        >
                          <XCircle size={16} /> Rechazar
                        </button>
                      </>
                    ) : (
                      <span className={`status-badge ${req.status}`}>
                        {req.status === "accepted" ? "Aceptada" : "Rechazada"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {!isLoading && requests.length === 0 && (
              <p className="text-center text-secondary">
                Aún no hay solicitudes para tus viajes.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {routeToDelete && (
        <div className="modal-overlay animate-fade-in">
          <div
            className="modal-content glass-panel text-center"
            style={{ maxWidth: "400px" }}
          >
            <button
              className="modal-close"
              onClick={() => setRouteToDelete(null)}
            >
              <X size={20} />
            </button>
            <AlertCircle
              size={56}
              className="text-danger mx-auto mb-md mt-sm"
            />
            <h2 className="mb-sm">¿Eliminar Ruta?</h2>
            <p className="text-secondary mb-lg">
              Estás a punto de cancelar y borrar esta ruta planificada. Esta
              acción no se puede deshacer.
            </p>
            <div className="flex gap-sm">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setRouteToDelete(null)}
              >
                Atrás
              </button>
              <button
                className="btn btn-primary flex-1"
                style={{
                  background: "var(--danger)",
                  borderColor: "var(--danger)",
                }}
                onClick={confirmDelete}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURE SUCCESS MODAL */}
      {successModal.open && (
        <div className="modal-overlay animate-fade-in">
          <div
            className="modal-content glass-panel text-center"
            style={{ maxWidth: "430px" }}
          >
            <button
              className="modal-close"
              onClick={() =>
                setSuccessModal({ open: false, title: "", message: "" })
              }
            >
              <X size={20} />
            </button>
            <CheckCircle2
              size={56}
              className="text-success mx-auto mb-md mt-sm"
            />
            <h2 className="mb-sm">{successModal.title}</h2>
            <p className="text-secondary mb-lg">{successModal.message}</p>
            <button
              className="btn btn-primary w-full"
              onClick={() =>
                setSuccessModal({ open: false, title: "", message: "" })
              }
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* RATING PASSENGERS MODAL */}
      {routeToRate && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-panel text-center">
            <h2 className="mb-sm">Califica a tus pasajeros</h2>
            <p className="text-secondary mb-md">
              Viaje completado. ¿Cómo fue tu experiencia con ellos?
            </p>

            <div className="rating-list mb-lg">
              {passengersToRate.map((p) => (
                <div
                  key={p.id}
                  className="rating-row flex items-center justify-between mb-sm"
                >
                  <div className="flex items-center gap-sm">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="rating-avatar"
                    />
                    <span>{p.name.split(" ")[0]}</span>
                  </div>
                  <div className="stars-selector flex gap-xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className="cursor-pointer"
                        fill={
                          (ratings[p.id] || 0) >= star
                            ? "#ffc107"
                            : "transparent"
                        }
                        color={
                          (ratings[p.id] || 0) >= star ? "#ffc107" : "#E0E0E0"
                        }
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [p.id]: star }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-sm">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setRouteToRate(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={submitRatings}
                disabled={passengersToRate.some((p) => !ratings[p.id])} // Desactiva si alguno falta
              >
                Cerrar Viaje Total
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-notification animate-fade-in glass-panel">
          {toast}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
