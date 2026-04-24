import React, { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  CircleCheckBig,
  Clock3,
  Pencil,
  Route,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { mockRequests, mockRoutes } from "../mockData";
import { deleteUser, getUsers, updateUser } from "../services/api";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "passenger",
    isAdmin: false,
    controlNumber: "",
    career: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        setUsersError("");
        const dbUsers = await getUsers();
        setUsers(dbUsers);
      } catch (error) {
        setUsersError(error.message || "No se pudieron cargar los usuarios.");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const totalUsers = users.length;
  const totalDrivers = users.filter(
    (account) => account.role === "driver",
  ).length;
  const totalRoutes = mockRoutes.length;
  const pendingRequests = mockRequests.filter(
    (request) => request.status === "pending",
  ).length;

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((account) =>
      [account.name, account.email, account.controlNumber, account.career]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [userSearch, users]);

  const filteredRoutes = useMemo(() => {
    const query = routeSearch.trim().toLowerCase();
    if (!query) return mockRoutes;
    return mockRoutes.filter((routeItem) =>
      [
        routeItem.driverName,
        routeItem.from.name,
        routeItem.to.name,
        routeItem.time,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [routeSearch]);

  const filteredRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();
    if (!query) return mockRequests;
    return mockRequests.filter((request) =>
      [request.passenger.name, request.message, request.status]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [requestSearch]);

  const resetForm = () => {
    setEditingId(null);
    setUserForm({
      name: "",
      email: "",
      role: "passenger",
      isAdmin: false,
      controlNumber: "",
      career: "",
    });
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitUser = async (event) => {
    event.preventDefault();

    if (!editingId) return;

    const normalizedEmail = userForm.email.trim().toLowerCase();
    const payload = {
      name: userForm.name.trim(),
      email: normalizedEmail,
      role: userForm.role,
      isAdmin: Boolean(userForm.isAdmin),
      controlNumber: userForm.controlNumber.trim(),
      career: userForm.career.trim(),
    };

    try {
      const updatedUser = await updateUser(editingId, payload);
      setUsers((prev) =>
        prev.map((account) =>
          account.id === editingId
            ? {
                ...account,
                ...updatedUser,
              }
            : account,
        ),
      );
      resetForm();
      setUsersError("");
    } catch (error) {
      setUsersError(error.message || "No se pudo guardar el usuario.");
    }
  };

  const handleEditUser = (account) => {
    setEditingId(account.id);
    setUserForm({
      name: account.name || "",
      email: account.email || "",
      role: account.role || "passenger",
      isAdmin: Boolean(account.isAdmin),
      controlNumber: account.controlNumber || "",
      career: account.career || "",
    });
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((account) => account.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setUsersError("");
    } catch (error) {
      setUsersError(error.message || "No se pudo eliminar el usuario.");
    }
  };

  return (
    <section className="admin-page animate-fade-in">
      <header className="admin-header glass-panel">
        <h1>Panel de Administración</h1>
        <p>
          Vista global del sistema para monitorear usuarios, rutas activas y
          solicitudes de viaje.
        </p>
      </header>

      <div className="admin-stats-grid">
        <article className="admin-stat-card glass-panel">
          <span className="admin-stat-label">
            <Users size={18} /> Usuarios
          </span>
          <h2>{totalUsers}</h2>
        </article>

        <article className="admin-stat-card glass-panel">
          <span className="admin-stat-label">
            <CarFront size={18} /> Conductores
          </span>
          <h2>{totalDrivers}</h2>
        </article>

        <article className="admin-stat-card glass-panel">
          <span className="admin-stat-label">
            <Route size={18} /> Rutas publicadas
          </span>
          <h2>{totalRoutes}</h2>
        </article>

        <article className="admin-stat-card glass-panel">
          <span className="admin-stat-label">
            <Clock3 size={18} /> Solicitudes pendientes
          </span>
          <h2>{pendingRequests}</h2>
        </article>
      </div>

      <div className="admin-grid">
        <article className="admin-panel-card glass-panel">
          <div className="admin-panel-tools">
            <h3>Usuarios registrados</h3>
            <input
              type="search"
              className="input-field admin-search"
              placeholder="Buscar usuario..."
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
          </div>
          {usersError && <p className="admin-error-text">{usersError}</p>}
          {editingId && (
            <form className="admin-user-form" onSubmit={handleSubmitUser}>
              <div className="admin-user-form-grid">
                <input
                  className="input-field"
                  name="name"
                  value={userForm.name}
                  onChange={handleFormChange}
                  placeholder="Nombre"
                  required
                />
                <input
                  className="input-field"
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleFormChange}
                  placeholder="Correo"
                  required
                />
                <select
                  className="input-field"
                  name="role"
                  value={userForm.role}
                  onChange={handleFormChange}
                >
                  <option value="passenger">Pasajero</option>
                  <option value="driver">Conductor</option>
                </select>
                <label className="admin-checkbox-field">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={userForm.isAdmin}
                    onChange={handleFormChange}
                  />
                  <span>Permisos de administrador</span>
                </label>
                <input
                  className="input-field"
                  name="controlNumber"
                  value={userForm.controlNumber}
                  onChange={handleFormChange}
                  placeholder="Numero de control"
                />
                <input
                  className="input-field admin-user-career"
                  name="career"
                  value={userForm.career}
                  onChange={handleFormChange}
                  placeholder="Carrera"
                />
              </div>

              <div className="admin-user-form-actions">
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Guardar cambios
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  <X size={16} /> Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="admin-list admin-list-scroll">
            {isLoadingUsers && (
              <p className="admin-empty-state">Cargando usuarios...</p>
            )}
            {!isLoadingUsers &&
              filteredUsers.map((account) => (
                <div key={account.id} className="admin-list-item">
                  <div className="admin-user-summary">
                    <p className="admin-list-title">{account.name}</p>
                    <p className="admin-list-subtitle">
                      {account.email}
                      {account.controlNumber
                        ? ` • ${account.controlNumber}`
                        : ""}
                    </p>
                    {account.role === "driver" &&
                      Array.isArray(account.vehiclePhotos) &&
                      account.vehiclePhotos.length > 0 && (
                        <div className="admin-vehicle-photos">
                          <span className="admin-vehicle-photos-label">
                            Fotos del auto
                          </span>
                          <div className="admin-vehicle-photos-grid">
                            {account.vehiclePhotos.map((photo) => (
                              <img
                                key={photo}
                                src={photo}
                                alt={`Foto del auto de ${account.name}`}
                                className="admin-vehicle-photo-thumb"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="admin-user-actions">
                    <span className="admin-pill">
                      {account.role === "driver" ? "Conductor" : "Pasajero"}
                    </span>
                    {account.isAdmin && (
                      <span className="admin-pill ok">Admin</span>
                    )}
                    <button
                      type="button"
                      className="admin-icon-btn"
                      title="Editar usuario"
                      onClick={() => handleEditUser(account)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn danger"
                      title="Eliminar usuario"
                      onClick={() => handleDeleteUser(account.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            {!isLoadingUsers && !filteredUsers.length && (
              <p className="admin-empty-state">No se encontraron usuarios.</p>
            )}
          </div>
        </article>

        <article className="admin-panel-card glass-panel">
          <div className="admin-panel-tools">
            <h3>Rutas del día</h3>
            <input
              type="search"
              className="input-field admin-search"
              placeholder="Buscar ruta..."
              value={routeSearch}
              onChange={(event) => setRouteSearch(event.target.value)}
            />
          </div>
          <div className="admin-list admin-list-scroll">
            {filteredRoutes.map((routeItem) => (
              <div key={routeItem.id} className="admin-list-item">
                <div>
                  <p className="admin-list-title">
                    {routeItem.from.name} {"->"} {routeItem.to.name}
                  </p>
                  <p className="admin-list-subtitle">
                    {routeItem.driverName} • {routeItem.time}
                  </p>
                </div>
                <span
                  className={`admin-pill ${routeItem.status === "active" ? "ok" : "warn"}`}
                >
                  {routeItem.status === "active" ? "Activa" : "Llena"}
                </span>
              </div>
            ))}
            {!filteredRoutes.length && (
              <p className="admin-empty-state">No se encontraron rutas.</p>
            )}
          </div>
        </article>

        <article className="admin-panel-card glass-panel admin-panel-wide">
          <div className="admin-panel-tools">
            <h3>Solicitudes recientes</h3>
            <input
              type="search"
              className="input-field admin-search"
              placeholder="Buscar solicitud..."
              value={requestSearch}
              onChange={(event) => setRequestSearch(event.target.value)}
            />
          </div>
          <div className="admin-list admin-list-scroll">
            {filteredRequests.map((request) => (
              <div key={request.id} className="admin-list-item">
                <div>
                  <p className="admin-list-title">{request.passenger.name}</p>
                  <p className="admin-list-subtitle">{request.message}</p>
                </div>
                <span className="admin-pill ok">
                  <CircleCheckBig size={14} /> {request.status}
                </span>
              </div>
            ))}
            {!filteredRequests.length && (
              <p className="admin-empty-state">
                No se encontraron solicitudes.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default AdminPanel;
