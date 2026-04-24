import React, { useState, useEffect, useRef } from "react";
import {
  Moon,
  Sun,
  Car,
  User,
  MapPin,
  Bell,
  LogOut,
  Shield,
  PanelTop,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  mockPassengerNotifications,
  mockDriverNotifications,
} from "../mockData";
import "./Navbar.css";

const Navbar = ({
  toggleDarkMode,
  isDarkMode,
  user,
  isAdminView,
  effectiveRole,
  isDriverPassengerMode,
  onToggleAdminView,
  onSwitchToUserView,
  onToggleDriverPassengerMode,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // Cerrar el dropdown si el usuario hace clic afuera de la campana
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications =
    effectiveRole === "driver"
      ? mockDriverNotifications
      : mockPassengerNotifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <nav className="navbar glass-panel">
      <div className="container flex items-center justify-between">
        <div className="navbar-brand">
          <Link to="/" className="flex items-center gap-sm">
            <Car size={32} className="brand-logo" />
            <span className="brand-text">SynRoute</span>
          </Link>
        </div>

        <div className="navbar-links flex items-center gap-md">
          {user?.isAdmin && isAdminView ? (
            <Link to="/admin" className="btn btn-primary">
              <PanelTop size={18} /> Panel Admin
            </Link>
          ) : (
            <>
              {effectiveRole === "driver" ? (
                <Link to="/publicar" className="btn btn-primary">
                  <MapPin size={18} /> Programar Ruta
                </Link>
              ) : (
                <Link to="/" className="btn btn-primary">
                  <MapPin size={18} /> Explorar Viajes
                </Link>
              )}
            </>
          )}

          <div className="notification-wrapper" ref={notifRef}>
            <button
              className="icon-btn theme-toggle"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificaciones"
              style={{ position: "relative" }}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge"></span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown glass-panel animate-fade-in">
                <div className="notif-header flex justify-between items-center">
                  <h3>Notificaciones</h3>
                  <span className="text-secondary text-sm">
                    {unreadCount} Nuevas
                  </span>
                </div>
                <div className="notif-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.isRead ? "unread" : ""}`}
                    >
                      <p className="notif-text">{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleDarkMode}
            className="icon-btn theme-toggle"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="user-menu-wrapper" ref={userMenuRef}>
            <button
              type="button"
              title="Abrir menú de usuario"
              className="user-profile flex items-center justify-center"
              onClick={() => setShowUserMenu((prev) => !prev)}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Usuario"}
                  className="user-avatar-img"
                />
              ) : (
                <User size={20} />
              )}
            </button>

            {showUserMenu && (
              <div
                className="user-dropdown glass-panel animate-fade-in"
                role="menu"
                aria-label="Menú de usuario"
              >
                <Link
                  to="/perfil"
                  className="user-dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    if (onSwitchToUserView) onSwitchToUserView();
                    setShowUserMenu(false);
                  }}
                >
                  <User size={16} /> Perfil
                </Link>
                {user?.isAdmin && (
                  <button
                    type="button"
                    className="user-dropdown-item user-dropdown-button"
                    role="menuitem"
                    onClick={() => {
                      onToggleAdminView();
                      setShowUserMenu(false);
                    }}
                  >
                    <Shield size={16} />
                    {isAdminView
                      ? "Cambiar a modo usuario"
                      : "Cambiar a modo admin"}
                  </button>
                )}
                {user?.role === "driver" && (
                  <button
                    type="button"
                    className="user-dropdown-item user-dropdown-button"
                    role="menuitem"
                    onClick={() => {
                      if (onSwitchToUserView) onSwitchToUserView();
                      if (onToggleDriverPassengerMode) {
                        onToggleDriverPassengerMode();
                      }
                      setShowUserMenu(false);
                    }}
                  >
                    {isDriverPassengerMode ? (
                      <>
                        <Car size={16} /> Volver a modo conductor
                      </>
                    ) : (
                      <>
                        <User size={16} /> Cambiar a modo usuario
                      </>
                    )}
                  </button>
                )}
                <Link
                  to="/cerrar-sesion"
                  className="user-dropdown-item logout-item"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                  }}
                >
                  <LogOut size={16} /> Cerrar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
