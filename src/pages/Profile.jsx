import React, { useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  Mail,
  User,
  GraduationCap,
  Hash,
  CarFront,
} from "lucide-react";
import { getCloudinarySignature } from "../services/api";
import "./Profile.css";

const profileFolder =
  import.meta.env.VITE_CLOUDINARY_PROFILE_FOLDER || "synroute/perfiles";

const Profile = ({ user, onUpdateUser }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const fallbackAvatar = useMemo(
    () =>
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "SynRoute")}`,
    [user?.name],
  );

  const profileAvatar = user?.avatar || fallbackAvatar;

  const handleChooseImage = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const uploadProfileImage = async (file) => {
    const signData = await getCloudinarySignature(profileFolder);

    const payload = new FormData();
    payload.append("file", file);
    payload.append("api_key", signData.apiKey);
    payload.append("timestamp", String(signData.timestamp));
    payload.append("signature", signData.signature);
    payload.append("folder", signData.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
      {
        method: "POST",
        body: payload,
      },
    );

    if (!response.ok) {
      throw new Error("No se pudo subir la foto de perfil a Cloudinary.");
    }

    const result = await response.json();
    return result.secure_url;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadMessage("Selecciona un archivo de imagen valido.");
      return;
    }

    setIsUploading(true);

    try {
      setUploadMessage("Subiendo foto...");
      const avatarUrl = await uploadProfileImage(file);
      await onUpdateUser({ avatar: avatarUrl });
      setUploadMessage("Foto actualizada con exito.");
    } catch {
      setIsUploading(false);
      setUploadMessage("No se pudo subir la imagen. Intenta de nuevo.");
      return;
    }

    setIsUploading(false);
  };

  return (
    <section className="profile-page animate-fade-in">
      <div className="profile-card glass-panel">
        <header className="profile-header">
          <h1>Mi Perfil</h1>
          <p>Consulta tus datos y personaliza tu foto de cuenta.</p>
        </header>

        <div className="profile-avatar-section">
          <div className="profile-avatar-shell">
            <img
              src={profileAvatar}
              alt={user?.name || "Usuario"}
              className="profile-avatar"
            />
            {isUploading && (
              <div className="avatar-loading-layer">
                <LoaderCircle size={22} className="spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleChooseImage}
            disabled={isUploading}
          >
            <Camera size={18} /> {isUploading ? "Subiendo..." : "Subir Foto"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden-file-input"
          />

          {uploadMessage && (
            <p className="upload-feedback" role="status">
              {!isUploading && uploadMessage.includes("exito") ? (
                <CheckCircle2 size={16} />
              ) : null}
              {uploadMessage}
            </p>
          )}
        </div>

        <div className="profile-grid">
          <article className="profile-item">
            <span className="profile-item-label">
              <User size={16} /> Nombre completo
            </span>
            <p>{user?.name || "Sin nombre"}</p>
          </article>

          <article className="profile-item">
            <span className="profile-item-label">
              <Mail size={16} /> Correo institucional
            </span>
            <p>{user?.email || "Sin correo"}</p>
          </article>

          <article className="profile-item">
            <span className="profile-item-label">
              <Hash size={16} /> Numero de control
            </span>
            <p>{user?.controlNumber || "No asignado"}</p>
          </article>

          <article className="profile-item">
            <span className="profile-item-label">
              <GraduationCap size={16} /> Carrera
            </span>
            <p>{user?.career || "No asignada"}</p>
          </article>

          {user?.role === "driver" && (
            <article className="profile-item profile-item-wide">
              <span className="profile-item-label">
                <CarFront size={16} /> Datos del vehiculo
              </span>
              <p>
                {user?.car
                  ? `${user.car.model} • ${user.car.color} • ${user.car.plate} • ${user.car.capacity} asientos`
                  : "Vehiculo no registrado"}
              </p>
              {Array.isArray(user?.vehiclePhotos) &&
                user.vehiclePhotos.length > 0 && (
                  <div className="profile-vehicle-gallery">
                    {user.vehiclePhotos.map((photo) => (
                      <img
                        key={photo}
                        src={photo}
                        alt="Vehiculo del conductor"
                      />
                    ))}
                  </div>
                )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;
