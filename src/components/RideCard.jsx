import React, { useState } from 'react';
import { Clock, Users, ChevronRight, X, Send, CheckCircle2 } from 'lucide-react';
import './RideCard.css';

const RideCard = ({ ride }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const handleJoinClick = () => {
    setShowModal(true);
    setIsSubmitted(false);
    setMessage('');
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    // Simulamos envío al conductor
    setTimeout(() => {
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <>
      <div className="ride-card glass-panel flex justify-between items-center">
        <div className="driver-info flex items-center gap-md">
          <img src={ride.driverAvatar} alt={ride.driverName} className="driver-avatar" />
          <div>
            <h3 className="driver-name">{ride.driverName}</h3>
            <p className="car-details">{ride.carModel} • {ride.plate}</p>
            <div className="ride-stats flex items-center gap-sm mt-sm">
               <span className="badge flex items-center gap-xs">
                  <Users size={14} /> {ride.availableSeats}/{ride.totalSeats}
               </span>
               <span className="badge flex items-center gap-xs">
                  <Clock size={14} /> {ride.time}
               </span>
            </div>
          </div>
        </div>
        
        <div className="route-info flex items-center gap-md">
          <div className="route-points">
            <div className="point from">
              <span className="dot dot-blue"></span>
              {ride.from.name}
            </div>
            <div className="point-divider"></div>
            <div className="point to">
               <span className="dot dot-accent"></span>
               {ride.to.name}
            </div>
          </div>
          
          <div className="price-tag">
            <h3>${ride.price}</h3>
          </div>

          <button 
            className="btn btn-primary join-btn" 
            disabled={ride.availableSeats === 0}
            onClick={handleJoinClick}
          >
            {ride.availableSeats > 0 ? "Unirse" : "Lleno"} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* MODAL DE SOLICITUD */}
      {showModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
            
            {!isSubmitted ? (
              <div className="modal-form">
                <h2 className="mb-sm">Unirse al viaje</h2>
                <p className="text-secondary mb-md">Viajas con <strong>{ride.driverName}</strong> hacia <strong>{ride.to.name}</strong> a las <strong>{ride.time}</strong>.</p>
                
                <form onSubmit={handleSubmitRequest}>
                  <div className="input-group">
                    <label className="input-label">Mensaje para el conductor (opcional)</label>
                    <textarea 
                      className="input-field message-area" 
                      placeholder="Ej. Hola, llevo una mochila pequeña..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="modal-actions flex justify-between items-center mt-md">
                    <div className="price-tag-modal">
                      <span className="text-secondary" style={{fontSize:'0.9rem'}}>Costo total:</span>
                      <h3>${ride.price}</h3>
                    </div>
                    <button type="submit" className="btn btn-primary">
                      <Send size={16} /> Confirmar Solicitud
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="modal-success text-center">
                <CheckCircle2 size={56} className="text-success mx-auto mb-md" />
                <h2 className="mb-sm">¡Solicitud Enviada!</h2>
                <p className="text-secondary">
                  <strong>{ride.driverName}</strong> ha recibido tu petición. Te notificaremos cuando sea aprobada para compartir los datos del auto.
                </p>
                <button 
                  className="btn btn-secondary mt-lg w-full"
                  onClick={() => setShowModal(false)}
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RideCard;
