import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import PublishRide from "./pages/PublishRide";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import DriverDashboard from "./pages/DriverDashboard";
import Profile from "./pages/Profile";
import CompleteProfile from "./pages/CompleteProfile";
import AdminPanel from "./pages/AdminPanel";
import { updateOnboardingProfile, updateUser } from "./services/api";
import { currentUser, currentDriver } from "./mockData";

const ADMIN_EMAILS = ["admin@matamoros.tecnm.mx"];

const LogoutRoute = ({ onLogout }) => {
  useEffect(() => {
    onLogout();
  }, [onLogout]);

  return <Navigate to="/login" replace />;
};

function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Auth state (Simulation) - null if not logged in, object {role: '...'} if logged in
  const [user, setUser] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    // Check initial system preference or localStorage
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      return !prev;
    });
  };

  const handleLogin = (payload = "passenger") => {
    if (typeof payload === "string") {
      const baseUser = payload === "driver" ? currentDriver : currentUser;
      const isAdmin = ADMIN_EMAILS.includes(
        (baseUser.email || "").toLowerCase(),
      );
      setUser({ ...baseUser, isAdmin, onboardingComplete: true });
      setIsAdminView(false);
      return;
    }

    if (payload?.user) {
      const normalizedEmail = (payload.user.email || "").toLowerCase();
      const isAdmin =
        payload.user.isAdmin || ADMIN_EMAILS.includes(normalizedEmail);

      setUser({
        ...payload.user,
        email: normalizedEmail,
        isAdmin,
        onboardingComplete:
          payload.source === "register"
            ? false
            : Boolean(payload.user.onboardingComplete),
      });
      setIsAdminView(false);
      return;
    }

    const role = payload.role || "passenger";
    const baseProfile = role === "driver" ? currentDriver : currentUser;
    const isRegisterFlow = payload.source === "register";
    const normalizedEmail = (
      payload.email ||
      baseProfile.email ||
      ""
    ).toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);

    setUser({
      ...baseProfile,
      name: payload.name || baseProfile.name,
      email: normalizedEmail || baseProfile.email,
      role,
      isAdmin,
      onboardingComplete: !isRegisterFlow,
    });
    setIsAdminView(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdminView(false);
  };

  const handleProfileUpdate = async (updatedUser) => {
    let nextLocalUser = null;

    setUser((prev) => {
      nextLocalUser = { ...prev, ...updatedUser };
      return nextLocalUser;
    });

    if (!nextLocalUser?.id) return;

    try {
      const persistedUser = await updateUser(nextLocalUser.id, {
        name: nextLocalUser.name,
        email: nextLocalUser.email,
        role: nextLocalUser.role,
        avatar: nextLocalUser.avatar,
        controlNumber: nextLocalUser.controlNumber,
        career: nextLocalUser.career,
      });

      setUser((prev) => ({
        ...prev,
        ...persistedUser,
        isAdmin: prev?.isAdmin || persistedUser.isAdmin,
      }));
    } catch (error) {
      console.error("No se pudo persistir perfil:", error);
    }
  };

  const handleCompleteOnboarding = async (completedData) => {
    let nextLocalUser = null;

    setUser((prev) => {
      nextLocalUser = {
        ...prev,
        ...completedData,
        onboardingComplete: true,
      };
      return nextLocalUser;
    });

    if (!nextLocalUser?.id) return;

    try {
      const updatedUser = await updateOnboardingProfile(
        nextLocalUser.id,
        completedData,
      );
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
        isAdmin: prev?.isAdmin || updatedUser.isAdmin,
      }));
    } catch (error) {
      console.error("No se pudo persistir onboarding:", error);
    }
  };

  const toggleAdminView = () => {
    setIsAdminView((prev) => !prev);
  };

  const switchToUserView = () => {
    setIsAdminView(false);
  };

  const handleSwitchToPassenger = async () => {
    let nextLocalUser = null;

    setUser((prev) => {
      if (!prev || prev.role !== "driver") return prev;
      nextLocalUser = { ...prev, role: "passenger" };
      return nextLocalUser;
    });

    if (!nextLocalUser?.id) return;

    setIsAdminView(false);

    try {
      const persistedUser = await updateUser(nextLocalUser.id, {
        name: nextLocalUser.name,
        email: nextLocalUser.email,
        role: "passenger",
        isAdmin: nextLocalUser.isAdmin,
        avatar: nextLocalUser.avatar,
        controlNumber: nextLocalUser.controlNumber,
        career: nextLocalUser.career,
      });

      setUser((prev) => ({
        ...prev,
        ...persistedUser,
        isAdmin: prev?.isAdmin || persistedUser.isAdmin,
      }));
    } catch (error) {
      console.error("No se pudo cambiar a pasajero:", error);
    }
  };

  return (
    <Router>
      <div className="app-wrapper">
        {!user ? (
          <Routes>
            <Route
              path="/"
              element={
                <Landing
                  isDarkMode={isDarkMode}
                  toggleDarkMode={toggleDarkMode}
                />
              }
            />
            <Route
              path="/login"
              element={<Auth type="login" onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={<Auth type="register" onLogin={handleLogin} />}
            />
            {/* Si intentan entrar a otra ruta sin estar en sesión, los regresa al landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <>
            <Navbar
              user={user}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
              isAdminView={isAdminView}
              onToggleAdminView={toggleAdminView}
              onSwitchToUserView={switchToUserView}
              onSwitchToPassenger={handleSwitchToPassenger}
            />
            <main className="container pb-lg">
              <Routes>
                <Route
                  path="/"
                  element={
                    user.onboardingComplete ? (
                      user.isAdmin && isAdminView ? (
                        <Navigate to="/admin" replace />
                      ) : user.role === "driver" ? (
                        <DriverDashboard />
                      ) : (
                        <Home />
                      )
                    ) : (
                      <Navigate to="/completar-perfil" replace />
                    )
                  }
                />
                <Route
                  path="/publicar"
                  element={
                    user.onboardingComplete && user.role === "driver" ? (
                      <PublishRide />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <Profile user={user} onUpdateUser={handleProfileUpdate} />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    user.onboardingComplete && user.isAdmin && isAdminView ? (
                      <AdminPanel />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/completar-perfil"
                  element={
                    user.onboardingComplete ? (
                      <Navigate to="/" replace />
                    ) : (
                      <CompleteProfile
                        user={user}
                        onComplete={handleCompleteOnboarding}
                      />
                    )
                  }
                />
                <Route
                  path="/cerrar-sesion"
                  element={<LogoutRoute onLogout={handleLogout} />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
