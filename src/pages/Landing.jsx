import React from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Moon, Shield, Sun, Users } from 'lucide-react';
import './Landing.css';

const Landing = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <div className="landing-page animate-fade-in">
      {/* Decorative Background Elements */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <nav className="navbar glass-panel">
        <div className="container flex items-center justify-between">
          <div className="navbar-brand">
            <div className="flex items-center gap-sm">
              <Car size={32} className="brand-logo" />
              <span className="brand-text">SynRoute</span>
            </div>
          </div>
          <div className="navbar-links flex items-center gap-sm">
            <button
              type="button"
              className="landing-theme-toggle"
              aria-label="Cambiar tema"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="btn btn-secondary">Iniciar Sesión</Link>
            <Link to="/register?role=passenger" className="btn btn-primary">Registrarse</Link>
          </div>
        </div>
      </nav>

      <main className="landing-main container text-center">
        <div className="hero-content">
          <div className="glass-badge mb-md inline-block">
            Exclusivo para estudiantes del Tec Matamoros
          </div>
          <h1 className="hero-title">
            Comparte tu viaje,<br/>
            <span>multiplica tus experiencias.</span>
          </h1>
          <p className="hero-subtitle mb-lg">
            La plataforma segura de carpooling diseñada para facilitar tus traslados diarios a la universidad. Ahorra dinero, reduce el tráfico y conoce a otros estudiantes.
          </p>
          
          <div className="hero-cta flex gap-md justify-center">
            <Link to="/register?role=passenger" className="btn btn-primary btn-lg">Comienza a viajar</Link>
            <Link to="/register?role=driver" className="btn btn-secondary btn-lg">Ofrece tu auto</Link>
          </div>
        </div>

        <div className="features-grid mt-lg">
          <div className="feature-card glass-panel flex flex-col items-center">
            <div className="feature-icon mb-sm"><MapPin size={28} /></div>
            <h3>Rutas Personalizadas</h3>
            <p>Encuentra viajes que se ajusten perfectamente a tu horario y destino dentro de la ciudad.</p>
          </div>
          <div className="feature-card glass-panel flex flex-col items-center">
             <div className="feature-icon mb-sm"><Shield size={28} /></div>
            <h3>Comunidad Segura</h3>
            <p>Todos los usuarios están verificados con su correo institucional del TecNM.</p>
          </div>
          <div className="feature-card glass-panel flex flex-col items-center">
             <div className="feature-icon mb-sm"><Users size={28} /></div>
            <h3>Ahorro Compartido</h3>
            <p>Divide los gastos de gasolina y peajes de manera justa entre todos los pasajeros.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
