import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, AlertCircle } from "lucide-react";
import RideCard from "../components/RideCard";
import RideConversation from "../components/RideConversation";
import { getRideRequests, getRides } from "../services/api";
import "./Home.css";

const DAY_IDS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const Home = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rides, setRides] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHomeData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [rideData, requestData] = await Promise.all([
        getRides({ role: "passenger", userId: user?.id }),
        getRideRequests({ passengerId: user?.id }),
      ]);
      setRides(rideData);
      setRideRequests(requestData);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los viajes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [user?.id]);

  const filteredRoutes = useMemo(
    () => {
      const todayDayId = DAY_IDS[new Date().getDay()];

      return rides.filter((route) => {
        const routeDays = Array.isArray(route.days) ? route.days : [];
        const matchesToday = routeDays.length > 0 && routeDays.includes(todayDayId);
        const matchesSearchTerm =
          route.to.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.from.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesToday && matchesSearchTerm;
      });
    },
    [rides, searchTerm],
  );

  return (
    <div className="home-page animate-fade-in">
      <header className="hero-section text-center mb-lg">
        <h1>Encuentra tu ruta en el Tec</h1>
        <p>Viaja con tus compañeros de forma segura y económica</p>

        <div className="search-bar-wrapper glass-panel mt-md flex items-center">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="¿A dónde vas? (Ej. TecNM, Plaza Fiesta...)"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-secondary filter-btn">
            <Filter size={18} /> Filtros
          </button>
        </div>
      </header>

      <div className="rides-feed">
        {rideRequests.some((r) => r.status === "accepted") && (
          <RideConversation
            requests={rideRequests}
            currentUser={user}
            role="passenger"
            title="Mis viajes aceptados"
            emptyMessage="Cuando un conductor acepte tu solicitud, aquí aparecerán el chat y su teléfono."
            onRefresh={loadHomeData}
          />
        )}

        <div className="feed-header flex items-center justify-between mb-md">
          <h2>Viajes Programados para Hoy</h2>
          <span className="results-count">
            {filteredRoutes.length} encontrados
          </span>
        </div>

        {isLoading ? (
          <div className="empty-state glass-panel text-center">
            <h3>Cargando viajes...</h3>
          </div>
        ) : error ? (
          <div className="empty-state glass-panel text-center" style={{
            borderLeft: "4px solid var(--warning-color)",
            backgroundColor: "rgba(255, 193, 7, 0.08)",
            padding: "32px 24px",
          }}>
            <AlertCircle size={32} className="text-warning" style={{ margin: "0 auto 12px" }} />
            <h3>Oops, algo salió mal</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "8px" }}>{error}</p>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <div className="rides-list">
            {filteredRoutes.map((route) => (
              <RideCard
                key={route.id}
                ride={route}
                user={user}
                onRequestSent={loadHomeData}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-panel text-center">
            <h3>No hay viajes programados para hoy</h3>
            <p>
              Revisa otro día de la semana o publica una ruta recurrente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
