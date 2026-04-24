import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Car, Mail, Lock, User, Shield, ArrowLeft } from "lucide-react";
import { loginUser, registerUser } from "../services/api";
import "./Auth.css";

const Auth = ({ type, onLogin }) => {
  const isLogin = type === "login";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allowedDomain = "@matamoros.tecnm.mx";
  const roleFromQuery = searchParams.get("role") === "driver" ? "driver" : "passenger";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: roleFromQuery,
  });
  const [emailError, setEmailError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLogin) {
      setFormData((prev) => ({
        ...prev,
        role: roleFromQuery,
      }));
    }
  }, [isLogin, roleFromQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && emailError) {
      setEmailError("");
    }
    if (authError) {
      setAuthError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedEmail.endsWith(allowedDomain)) {
      setEmailError(`Solo se permite correo con terminacion ${allowedDomain}`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (isLogin) {
        const user = await loginUser({
          email: normalizedEmail,
          password: formData.password,
        });
        onLogin({ source: "login", user });
        navigate("/");
        return;
      }

      const user = await registerUser({
        name: formData.name,
        email: normalizedEmail,
        password: formData.password,
        role: formData.role,
      });

      onLogin({ source: "register", user });
      navigate("/completar-perfil");
    } catch (error) {
      setAuthError(error.message || "No se pudo autenticar la cuenta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      {/* Background decoration */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="auth-container">
        <Link to="/" className="back-link flex items-center gap-sm">
          <ArrowLeft size={18} /> Volver
        </Link>

        <div className="auth-card glass-panel text-center">
          <div className="auth-header mb-lg">
            <Car size={40} className="brand-logo mx-auto mb-sm" />
            <h1 className="auth-title">
              {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h1>
            <p>
              {isLogin
                ? "Ingresa tus credenciales del Tec para continuar."
                : "Únete a la red de transporte universitario más segura."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <label className="input-label flex items-center gap-sm">
                  <User size={16} /> Nombre Completo
                </label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  placeholder="Ej. Oscar Ruiz"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <Mail size={16} /> Correo Institucional
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="L00000000@matamoros.tecnm.mx"
                value={formData.email}
                onChange={handleChange}
                pattern="^[^\s@]+@matamoros\.tecnm\.mx$"
                title="Usa tu correo institucional @matamoros.tecnm.mx"
                required
              />
              {emailError && <p className="auth-error-text">{emailError}</p>}
            </div>

            {authError && <p className="auth-error-text">{authError}</p>}

            <div className="input-group">
              <label className="input-label flex items-center gap-sm">
                <Lock size={16} /> Contraseña
              </label>
              <input
                type="password"
                name="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="input-group">
                <label className="input-label flex items-center gap-sm">
                  <Shield size={16} /> Quiero registrarme como:
                </label>
                <div className="role-selector flex gap-sm">
                  <button
                    type="button"
                    className={`role-btn ${formData.role === "passenger" ? "active" : ""}`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "passenger" }))
                    }
                  >
                    Usuario
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${formData.role === "driver" ? "active" : ""}`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "driver" }))
                    }
                  >
                    Conductor
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit btn-lg mt-md"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Validando..."
                : isLogin
                  ? "Iniciar Sesión"
                  : "Registrarse"}
            </button>
          </form>

          <div className="auth-footer mt-md">
            {isLogin ? (
              <p>
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="auth-link">
                  Regístrate gratis
                </Link>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="auth-link">
                  Inicia sesión
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
