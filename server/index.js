import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { initDb, mapUserRow, pool } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;
const emailRegex = /^[^\s@]+@matamoros\.tecnm\.mx$/i;
const PASSWORD_SALT_ROUNDS = 10;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

await initDb();

app.use(cors());
app.use(express.json());

const normalizeEmail = (email = "") => email.trim().toLowerCase();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API de RIOFRIO activa" });
});

app.post("/api/cloudinary/signature", (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        message:
          "Falta configurar CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en el backend.",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = String(req.body?.folder || "synroute/vehiculos").trim();
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return res.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudo generar firma Cloudinary." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password || "";

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Correo institucional inválido." });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const row = result.rows[0];

    if (!row) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    const storedPassword = row.password || "";
    const looksHashed = /^\$2[abxy]?\$\d{2}\$/.test(storedPassword);

    let isValidPassword = false;

    if (looksHashed) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else {
      // Compatibilidad temporal para cuentas antiguas guardadas en texto plano.
      isValidPassword = storedPassword === password;
      if (isValidPassword) {
        const upgradedHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          upgradedHash,
          row.id,
        ]);
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    return res.json({ user: mapUserRow(row) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password || "";
    const role = req.body?.role === "driver" ? "driver" : "passenger";

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Nombre, correo y contraseña son obligatorios." });
    }

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Solo se permite @matamoros.tecnm.mx" });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (exists.rows[0]) {
      return res
        .status(409)
        .json({ message: "Este correo ya está registrado." });
    }

    const inserted = await pool.query(
      `INSERT INTO users (name, email, password, role, avatar, is_admin, onboarding_complete)
       VALUES ($1, $2, $3, $4, $5, FALSE, FALSE)
       RETURNING *`,
      [
        name,
        email,
        passwordHash,
        role,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      ],
    );

    return res.status(201).json({ user: mapUserRow(inserted.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    return res.json({ users: result.rows.map(mapUserRow) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const email = normalizeEmail(req.body?.email || current.email);

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Correo institucional inválido." });
    }

    const duplicated = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, id],
    );

    if (duplicated.rows[0]) {
      return res
        .status(409)
        .json({ message: "El correo ya existe en otro usuario." });
    }

    const role = req.body?.role === "driver" ? "driver" : "passenger";
    const next = {
      name: (req.body?.name || current.name).trim(),
      email,
      role,
      isAdmin:
        typeof req.body?.isAdmin === "boolean"
          ? req.body.isAdmin
          : Boolean(current.is_admin),
      avatar: (req.body?.avatar ?? current.avatar ?? "").trim(),
      onboardingComplete:
        typeof req.body?.onboardingComplete === "boolean"
          ? req.body.onboardingComplete
          : Boolean(current.onboarding_complete),
      controlNumber: (
        req.body?.controlNumber ??
        current.control_number ??
        ""
      ).trim(),
      career: (req.body?.career ?? current.career ?? "").trim(),
    };

    const updated = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, role = $3, is_admin = $4, avatar = $5, onboarding_complete = $6, control_number = $7, career = $8
       WHERE id = $9
       RETURNING *`,
      [
        next.name,
        next.email,
        next.role,
        next.isAdmin,
        next.avatar,
        next.onboardingComplete,
        next.controlNumber,
        next.career,
        id,
      ],
    );

    return res.json({ user: mapUserRow(updated.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (!result.rowCount) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.put("/api/users/:id/onboarding", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const controlNumber = (req.body?.controlNumber || "").trim();
    const career = (req.body?.career || "").trim();
    const car = req.body?.car || {};
    const vehiclePhotos = Array.isArray(req.body?.vehiclePhotos)
      ? req.body.vehiclePhotos
      : [];

    const updated = await pool.query(
      `UPDATE users
       SET control_number = $1,
           career = $2,
           onboarding_complete = TRUE,
           car_model = $3,
           car_color = $4,
           car_plate = $5,
           car_capacity = $6,
           vehicle_photos = $7::jsonb
       WHERE id = $8
       RETURNING *`,
      [
        controlNumber,
        career,
        car.model || "",
        car.color || "",
        car.plate || "",
        Number(car.capacity || 0),
        JSON.stringify(vehiclePhotos),
        id,
      ],
    );

    return res.json({ user: mapUserRow(updated.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor API escuchando en http://localhost:${PORT}`);
});
