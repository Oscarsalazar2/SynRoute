import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import RideCard from "../components/RideCard";
import { getRides } from "../services/api";
import "./Home.css";

const Home = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRides = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getRides({ role: "passenger", userId: user?.id });
      setRides(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los viajes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, [user?.id]);

  const filteredRoutes = useMemo(
    () =>
      rides.filter(
        (route) =>
          route.to.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.from.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
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
        <div className="feed-header flex items-center justify-between mb-md">
          <h2>Viajes Disponibles Hoy</h2>
          <span className="results-count">
            {filteredRoutes.length} encontrados
          </span>
        </div>

        {isLoading ? (
          <div className="empty-state glass-panel text-center">
            <h3>Cargando viajes...</h3>
          </div>
        ) : error ? (
          <div className="empty-state glass-panel text-center">
            <h3>No se pudieron cargar rutas</h3>
            <p>{error}</p>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <div className="rides-list">
            {filteredRoutes.map((route) => (
              <RideCard
                key={route.id}
                ride={route}
                user={user}
                onRequestSent={loadRides}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-panel text-center">
            <h3>No se encontraron rutas</h3>
            <p>
              Intenta buscar otro destino o sé el primero en publicar una ruta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
