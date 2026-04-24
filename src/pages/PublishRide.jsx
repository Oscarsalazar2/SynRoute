import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { default as L } from 'leaflet';
import { popularLocations, mockRoutes, currentDriver } from '../mockData';
import { MapPin, Clock, DollarSign, Users, CalendarDays, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './PublishRide.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const WEEK_DAYS = [
  { id: 'Lu', label: 'Lunes' },
  { id: 'Ma', label: 'Martes' },
  { id: 'Mi', label: 'Miércoles' },
  { id: 'Ju', label: 'Jueves' },
  { id: 'Vi', label: 'Viernes' },
];

const PublishRide = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    days: [],
    time: '',
    seats: 3,
    price: 35
  });

  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter] = useState([25.8451, -97.5251]);

  useEffect(() => {
    if (editId) {
      const routeToEdit = mockRoutes.find(r => r.id === editId);
      if (routeToEdit) {
        setFormData({
          origin: routeToEdit.from.name,
          destination: routeToEdit.to.name,
          days: routeToEdit.days || ['Lu', 'Mi', 'Vi'], // Compatibilidad con mockData
          time: routeToEdit.time.split(' ')[0], 
          seats: routeToEdit.totalSeats,
          price: routeToEdit.price
        });
      }
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDay = (dayId) => {
    setFormData(prev => {
      if (prev.days.includes(dayId)) {
        return { ...prev, days: prev.days.filter(d => d !== dayId) };
      } else {
        return { ...prev, days: [...prev.days, dayId] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (formData.days.length === 0) {
      alert("Por favor selecciona al menos un día");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      if (editId) {
        // Encontrar y modificar en la memoria viva simulada
        const routeIndex = mockRoutes.findIndex(r => r.id === editId);
        if (routeIndex !== -1) {
          mockRoutes[routeIndex] = {
            ...mockRoutes[routeIndex],
            from: popularLocations.find(l => l.name === formData.origin) || mockRoutes[routeIndex].from,
            to: popularLocations.find(l => l.name === formData.destination) || mockRoutes[routeIndex].to,
            time: formData.time + ' AM', // Simplificación
            totalSeats: parseInt(formData.seats),
            price: parseInt(formData.price),
            days: formData.days
          };
        }
      } else {
        // Crear nueva ruta
        const newRoute = {
          id: 'r' + Math.floor(Math.random() * 1000),
          driverId: currentDriver.id,
          driverName: currentDriver.name,
          driverAvatar: currentDriver.avatar,
          carModel: currentDriver.car.model,
          plate: currentDriver.car.plate,
          from: popularLocations.find(l => l.name === formData.origin) || popularLocations[0],
          to: popularLocations.find(l => l.name === formData.destination) || popularLocations[1],
          time: formData.time + ' AM',
          days: formData.days,
          availableSeats: parseInt(formData.seats),
          totalSeats: parseInt(formData.seats),
          price: parseInt(formData.price),
          status: 'active'
        };
        mockRoutes.unshift(newRoute);
      }

      setIsLoading(false);
      // Redirigir al dashboard (home para conductor)
      navigate('/');
    }, 600);
  };

  return (
    <div className="publish-page animate-fade-in">
      <div className="page-header text-center mb-lg">
        <h2>{editId ? 'Modificar Ruta' : 'Programar Nueva Ruta'}</h2>
        <p>{editId ? 'Actualiza los datos de tu viaje publicado.' : 'Automatiza tus viajes frecuentes escogiendo qué días viajas.'}</p>
      </div>

      <div className="publish-layout">
        <div className="glass-panel form-container">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <MapPin size={16} /> Punto de Origen
              </label>
              <select className="input-field" name="origin" value={formData.origin} onChange={handleChange} required>
                <option value="">Selecciona tu origen...</option>
                {popularLocations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                <option value="other">Otro (usar mapa)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <MapPin size={16} /> Destino
              </label>
              <select className="input-field" name="destination" value={formData.destination} onChange={handleChange} required>
                <option value="">Selecciona tu destino...</option>
                {popularLocations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <CalendarDays size={16} /> Días de la semana
              </label>
              <div className="days-selector">
                {WEEK_DAYS.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    className={`day-pill ${formData.days.includes(day.id) ? 'active' : ''}`}
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
                <input type="time" className="input-field" name="time" value={formData.time} onChange={handleChange} required/>
              </div>

              <div className="input-group flex-1">
                <label className="input-label flex items-center gap-sm">
                  <Users size={16} /> Asientos Disp.
                </label>
                <input type="number" min="1" max="6" className="input-field" name="seats" value={formData.seats} onChange={handleChange} required/>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <DollarSign size={16} /> Precio (MXN)
              </label>
              <input type="number" min="0" className="input-field" name="price" value={formData.price} onChange={handleChange} required/>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-md" disabled={isLoading}>
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (editId ? 'Guardar Cambios' : 'Automatizar Ruta')}
            </button>
          </form>
        </div>

        <div className="glass-panel map-container">
          <h3 className="map-title">Mapa de referencias</h3>
          <p className="map-subtitle">Revisa visualmente las distancias de tu viaje en la ciudad.</p>
          <div className="map-wrapper">
             <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
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
