import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import RideCard from '../components/RideCard';
import { mockRoutes } from '../mockData';
import './Home.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = mockRoutes.filter(route => 
    route.to.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    route.from.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <span className="results-count">{filteredRoutes.length} encontrados</span>
        </div>

        {filteredRoutes.length > 0 ? (
          <div className="rides-list">
            {filteredRoutes.map(route => (
              <RideCard key={route.id} ride={route} />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-panel text-center">
            <h3>No se encontraron rutas</h3>
            <p>Intenta buscar otro destino o sé el primero en publicar una ruta.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
