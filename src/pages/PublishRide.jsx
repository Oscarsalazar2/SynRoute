import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { default as L } from "leaflet";
import { popularLocations } from "../mockData";
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createRide, getRides, updateRide } from "../services/api";
import "leaflet/dist/leaflet.css";
import "./PublishRide.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const WEEK_DAYS = [
  { id: "Lu", label: "Lunes" },
  { id: "Ma", label: "Martes" },
  { id: "Mi", label: "Miércoles" },
  { id: "Ju", label: "Jueves" },
  { id: "Vi", label: "Viernes" },
];

const PublishRide = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    days: [],
    time: "",
    seats: 3,
    price: 35,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapCenter] = useState([25.8451, -97.5251]);

  useEffect(() => {
    const loadRideToEdit = async () => {
      if (!editId || !user?.id) return;

      try {
        setIsLoading(true);
        const myRides = await getRides({ role: "driver", userId: user.id });
        const routeToEdit = myRides.find((r) => r.id === editId);

        if (!routeToEdit) {
          setError("No se encontró el viaje a editar.");
          return;
        }

        const normalizedTime = String(routeToEdit.time || "").split(" ")[0];
        setFormData({
          origin: routeToEdit.from.name,
          destination: routeToEdit.to.name,
          days: routeToEdit.days || [],
          time: normalizedTime,
          seats: routeToEdit.totalSeats,
          price: routeToEdit.price,
        });
      } catch (err) {
        setError(err.message || "No se pudo cargar el viaje a editar.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRideToEdit();
  }, [editId, user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (dayId) => {
    setFormData((prev) => {
      if (prev.days.includes(dayId)) {
        return { ...prev, days: prev.days.filter((d) => d !== dayId) };
      } else {
        return { ...prev, days: [...prev.days, dayId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.days.length === 0) {
      alert("Por favor selecciona al menos un día");
      return;
    }

    if (!user?.id) {
      setError("No hay usuario autenticado para publicar el viaje.");
      return;
    }

    const originLoc = popularLocations.find((l) => l.name === formData.origin);
    const destinationLoc = popularLocations.find(
      (l) => l.name === formData.destination,
    );

    if (!originLoc || !destinationLoc) {
      setError("Selecciona origen y destino válidos.");
      return;
    }

    const payload = {
      driverId: user.id,
      origin: originLoc,
      destination: destinationLoc,
      days: formData.days,
      time: formData.time,
      seats: Number(formData.seats),
      price: Number(formData.price),
    };

    try {
      setIsLoading(true);
      if (editId) {
        await updateRide(editId, payload);
      } else {
        await createRide(payload);
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "No se pudo guardar el viaje.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="publish-page animate-fade-in">
      <div className="page-header text-center mb-lg">
        <h2>{editId ? "Modificar Ruta" : "Programar Nueva Ruta"}</h2>
        <p>
          {editId
            ? "Actualiza los datos de tu viaje publicado."
            : "Automatiza tus viajes frecuentes escogiendo qué días viajas."}
        </p>
      </div>

      <div className="publish-layout">
        <div className="glass-panel form-container">
          <form onSubmit={handleSubmit}>
            {error && <p className="auth-error-text mb-md">{error}</p>}
            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <MapPin size={16} /> Punto de Origen
              </label>
              <select
                className="input-field"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona tu origen...</option>
                {popularLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
                <option value="other">Otro (usar mapa)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <MapPin size={16} /> Destino
              </label>
              <select
                className="input-field"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona tu destino...</option>
                {popularLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <CalendarDays size={16} /> Días de la semana
              </label>
              <div className="days-selector">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    className={`day-pill ${formData.days.includes(day.id) ? "active" : ""}`}
                    onClick={() => toggleDay(day.id)}
                  >
                    {day.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="input-group flex-1">
                <label className="input-label flex items-center gap-sm">
                  <Clock size={16} /> Hora
                </label>
                <input
                  type="time"
                  className="input-field"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group flex-1">
                <label className="input-label flex items-center gap-sm">
                  <Users size={16} /> Asientos Disp.
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  className="input-field"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <DollarSign size={16} /> Precio (MXN)
              </label>
              <input
                type="number"
                min="0"
                className="input-field"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : editId ? (
                "Guardar Cambios"
              ) : (
                "Automatizar Ruta"
              )}
            </button>
          </form>
        </div>

        <div className="glass-panel map-container">
          <h3 className="map-title">Mapa de referencias</h3>
          <p className="map-subtitle">
            Revisa visualmente las distancias de tu viaje en la ciudad.
          </p>
          <div className="map-wrapper">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              {popularLocations.map((loc) => (
                <Marker position={[loc.lat, loc.lng]} key={loc.id}>
                  <Popup>{loc.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishRide;
