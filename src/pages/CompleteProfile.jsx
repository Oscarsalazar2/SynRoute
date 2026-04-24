import React, { useMemo, useRef, useState } from "react";
import {
  CarFront,
  GraduationCap,
  Hash,
  ImagePlus,
  LoaderCircle,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { getCloudinarySignature } from "../services/api";
import "./CompleteProfile.css";

const MAX_VEHICLE_PHOTOS = 4;

const CAREER_OPTIONS = [
  "Ingeniería Ambiental",
  "Ingeniería Civil",
  "Ingeniería Electromecánica",
  "Ingeniería Electrónica",
  "Ingeniería Gestión Empresarial",
  "Ingeniería Industrial",
  "Ingeniería Mecatrónica",
  "Ingeniería Química",
  "Ingeniería en Sistemas Computacionales",
  "Licenciatura en Administración",
  "Contador Público",
  "Maestría en Administración Industrial",
];

const uploadFolder =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || "synroute/vehiculos";

const CompleteProfile = ({ user, onComplete }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    controlNumber: user?.controlNumber || "",
    career: user?.career || "",
    carModel: user?.car?.model || "",
    carColor: user?.car?.color || "",
    carPlate: user?.car?.plate || "",
    carCapacity: user?.car?.capacity ? String(user.car.capacity) : "4",
  });
  const [vehiclePhotos, setVehiclePhotos] = useState(user?.vehiclePhotos || []);
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDriver = user?.role === "driver";

  const canUploadMore = useMemo(
    () => vehiclePhotos.length < MAX_VEHICLE_PHOTOS,
    [vehiclePhotos.length],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadVehicleImage = async (file) => {
    const signData = await getCloudinarySignature(uploadFolder);

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
      throw new Error("No se pudo subir la foto del vehículo a Cloudinary.");
    }

    const result = await response.json();
    return result.secure_url;
  };

  const handleChooseImages = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleVehiclePhotosChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    const availableSlots = MAX_VEHICLE_PHOTOS - vehiclePhotos.length;
    const filesToUpload = selectedFiles.slice(0, availableSlots);

    if (!filesToUpload.every((file) => file.type.startsWith("image/"))) {
      setStatusMessage("Solo puedes subir archivos de imagen.");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Subiendo fotos del vehículo...");

    try {
      const urls = [];
      for (const file of filesToUpload) {
        const secureUrl = await uploadVehicleImage(file);
        urls.push(secureUrl);
      }

      setVehiclePhotos((prev) => [...prev, ...urls]);
      setStatusMessage("Fotos del vehículo guardadas en Cloudinary.");
    } catch {
      setStatusMessage(
        "Error al subir fotos. Verifica la configuración Cloudinary en backend.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeVehiclePhoto = (photoUrl) => {
    setVehiclePhotos((prev) => prev.filter((url) => url !== photoUrl));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.controlNumber.trim() || !formData.career.trim()) {
      setStatusMessage("Completa número de control y carrera.");
      return;
    }

    if (isDriver) {
      if (
        !formData.carModel.trim() ||
        !formData.carColor.trim() ||
        !formData.carPlate.trim() ||
        Number(formData.carCapacity) < 1
      ) {
        setStatusMessage("Completa todos los datos del auto.");
        return;
      }

      if (!vehiclePhotos.length) {
        setStatusMessage("Sube al menos una foto del vehículo en Cloudinary.");
        return;
      }
    }

    setIsSaving(true);
    setStatusMessage("Guardando información...");

    setTimeout(() => {
      const nextUser = {
        controlNumber: formData.controlNumber.trim(),
        career: formData.career,
        onboardingComplete: true,
      };

      if (isDriver) {
        nextUser.car = {
          model: formData.carModel.trim(),
          color: formData.carColor.trim(),
          plate: formData.carPlate.trim().toUpperCase(),
          capacity: Number(formData.carCapacity),
        };
        nextUser.vehiclePhotos = vehiclePhotos;
      }

      onComplete(nextUser);
      setIsSaving(false);
    }, 500);
  };

  return (
    <section className="complete-profile-page animate-fade-in">
      <div className="complete-profile-card glass-panel">
        <header className="complete-profile-header">
          <h1>Completa tu perfil</h1>
          <p>
            Después de registrarte, necesitamos tus datos académicos. Si eres
            conductor, también registraremos tu auto y sus fotos.
          </p>
        </header>

        <form className="complete-profile-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">
              <Hash size={16} /> Número de control
            </label>
            <input
              className="input-field"
              name="controlNumber"
              value={formData.controlNumber}
              onChange={handleChange}
              placeholder="Ej. 20230000"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="career-select">
              <GraduationCap size={16} /> Carrera
            </label>
            <select
              id="career-select"
              className="input-field"
              name="career"
              value={formData.career}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Selecciona tu carrera
              </option>
              {CAREER_OPTIONS.map((career) => (
                <option key={career} value={career}>
                  {career}
                </option>
              ))}
            </select>
          </div>

          {isDriver && (
            <>
              <div className="driver-section-title">
                <CarFront size={18} /> Datos del vehículo
              </div>

              <div className="driver-grid">
                <div className="input-group">
                  <label className="input-label">Modelo del auto</label>
                  <input
                    className="input-field"
                    name="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    placeholder="Ej. Nissan Versa"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Color</label>
                  <input
                    className="input-field"
                    name="carColor"
                    value={formData.carColor}
                    onChange={handleChange}
                    placeholder="Ej. Blanco"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Placas</label>
                  <input
                    className="input-field"
                    name="carPlate"
                    value={formData.carPlate}
                    onChange={handleChange}
                    placeholder="Ej. ABC-123-A"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Capacidad de asientos</label>
                  <input
                    className="input-field"
                    type="number"
                    name="carCapacity"
                    min="1"
                    max="8"
                    value={formData.carCapacity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="photo-upload-block">
                <div className="photo-upload-header">
                  <h3>Fotos del vehículo</h3>
                  <span>
                    {vehiclePhotos.length}/{MAX_VEHICLE_PHOTOS}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleChooseImages}
                  disabled={isUploading || !canUploadMore}
                >
                  {isUploading ? (
                    <>
                      <LoaderCircle size={16} className="spin" /> Subiendo...
                    </>
                  ) : (
                    <>
                      <ImagePlus size={16} /> Agregar fotos
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleVehiclePhotosChange}
                  className="hidden-file-input"
                />

                <div className="vehicle-photo-grid">
                  {vehiclePhotos.map((url) => (
                    <article className="vehicle-photo-card" key={url}>
                      <img src={url} alt="Vehículo" />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        title="Quitar foto"
                        onClick={() => removeVehiclePhoto(url)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </>
          )}

          {statusMessage && (
            <p className="complete-profile-status">{statusMessage}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary complete-profile-submit"
            disabled={isSaving || isUploading}
          >
            {isSaving ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Guardando..." : "Guardar y continuar"}
          </button>

          <p className="complete-profile-note">
            <ShieldCheck size={15} /> Tus datos se usan para verificar cuentas y
            mantener segura la comunidad.
          </p>
        </form>
      </div>
    </section>
  );
};

export default CompleteProfile;
