    # React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Cloudinary (fotos de vehiculo)

El proyecto usa subida firmada (signed upload): la firma se genera en backend y el frontend no expone secretos.

Configura en `.env`:

```bash
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
VITE_CLOUDINARY_UPLOAD_FOLDER=synroute/vehiculos
VITE_CLOUDINARY_PROFILE_FOLDER=synroute/perfiles
```

Notas:

- `VITE_CLOUDINARY_UPLOAD_FOLDER` es opcional.
- `VITE_CLOUDINARY_PROFILE_FOLDER` es opcional.
- No pongas `CLOUDINARY_API_SECRET` en código frontend.

## Backend PostgreSQL (usuarios reales)

Este proyecto incluye un backend local para usuarios con PostgreSQL.

Configura la variable de entorno `DATABASE_URL` antes de correr server/seed.

Ejemplo:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/riofrio
```

### 1) Instalar dependencias

```bash
npm install
```

### 2) Crear base y seed

```bash
npm run seed
```

### 3) Levantar API

```bash
npm run server
```

### 4) Levantar frontend

```bash
npm run dev
```

El frontend usa proxy de Vite hacia `http://localhost:4000` para rutas `/api`.

Usuarios seed:

- admin@matamoros.tecnm.mx / Admin123\*
- l20230000@matamoros.tecnm.mx / User123\*
- l22260053@matamoros.tecnm.mx / Driver123\*
