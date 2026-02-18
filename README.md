# 📋 SIGEPIC - Sistema de Gestión del Personal de Inteligencia Criminal

Sistema integral para la gestión del personal del Departamento de Inteligencia Criminal D-2.

## 🚀 Características

- ✅ Gestión completa de personal (CRUD)
- ✅ Control de acceso basado en roles
- ✅ Auditoría completa de cambios
- ✅ Generación de reportes y estadísticas
- ✅ Gestión de archivos y documentos
- ✅ Búsqueda avanzada
- ✅ API RESTful documentada
- ✅ Interfaz responsive moderna

## 🏗️ Arquitectura

```
Frontend (React + Vite)  →  Backend (Node.js + Express)  →  Database (PostgreSQL)
```

- **Frontend**: Single Page Application con React 18
- **Backend**: API RESTful con Node.js y Express
- **Base de Datos**: PostgreSQL 15 con Prisma ORM
- **Deployment**: Docker + Docker Compose + Nginx

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- PostgreSQL 15+ ([Descargar](https://www.postgresql.org/download/))
- Git ([Descargar](https://git-scm.com/))

### Instalación (Desarrollo)

1. **Clonar el repositorio**

```bash
git clone https://github.com/FRSanchezflavio/sigepic1.0.git
cd sigepic1.0
```

2. **Instalar dependencias del backend**

```bash
cd backend
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**

```bash
# Crear base de datos PostgreSQL
createdb sigepic_db

# Ejecutar migraciones
npx prisma migrate dev

# Cargar datos iniciales
npx prisma db seed
```

5. **Iniciar backend**

```bash
npm run dev
# Backend corriendo en http://localhost:3000
```

6. **Instalar dependencias del frontend** (nueva terminal)

```bash
cd frontend
npm install
```

7. **Configurar variables de entorno del frontend**

```bash
cp .env.example .env
# Editar VITE_API_URL si es necesario
```

8. **Iniciar frontend**

```bash
npm run dev
# Frontend corriendo en http://localhost:5173
```

9. **Acceder a la aplicación**

- URL: http://localhost:5173
- Usuario: `admin`
- Contraseña: `Admin123!`

### Instalación con Docker (Producción)

1. **Clonar repositorio**

```bash
git clone https://github.com/FRSanchezflavio/sigepic1.0.git
cd sigepic1.0
```

2. **Configurar variables de entorno**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar archivos .env
```

3. **Iniciar servicios**

```bash
docker compose up -d --build
```

4. **Ejecutar migraciones**

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

5. **Acceder**

- URL: http://localhost
- Usuario: `admin`
- Contraseña: `Admin123!`

## 📚 Documentación

- [📖 Manual de Usuario](./docs/MANUAL_USUARIO.md) - Guía completa para usuarios finales
- [🚀 Guía de Deployment](./docs/DEPLOYMENT.md) - Instrucciones de despliegue en producción
- [🏗️ Arquitectura del Sistema](./docs/ARQUITECTURA.md) - Diseño técnico y patrones
- [📡 Documentación API](./docs/API.md) - Endpoints y ejemplos de uso

## 🛠️ Stack Tecnológico

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express 4.18
- **ORM**: Prisma 5.7
- **Base de Datos**: PostgreSQL 15
- **Autenticación**: JWT + bcrypt
- **Validación**: Joi
- **Logging**: Winston
- **File Upload**: Multer
- **PDF**: PDFKit
- **Email**: Nodemailer

### Frontend

- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Routing**: React Router 6.20
- **Styling**: Tailwind CSS 3.4
- **HTTP Client**: Axios 1.6
- **Icons**: Lucide React
- **Components**: shadcn/ui style

### DevOps

- **Containerización**: Docker + Docker Compose
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Testing**: Jest + Vitest

## 📁 Estructura del Proyecto

```
SIGEPIC/
├── backend/              # Backend API
│   ├── src/
│   │   ├── controllers/  # Controladores
│   │   ├── routes/       # Rutas API
│   │   ├── middlewares/  # Middlewares
│   │   ├── services/     # Servicios
│   │   ├── config/       # Configuración
│   │   └── utils/        # Utilidades
│   ├── prisma/           # Schema y migraciones
│   └── tests/            # Tests
│
├── frontend/             # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes UI
│   │   ├── pages/        # Páginas
│   │   ├── contexts/     # Context API
│   │   ├── services/     # API clients
│   │   └── utils/        # Utilidades
│   └── tests/            # Tests
│
├── docker/               # Dockerfiles
├── scripts/              # Scripts de utilidad
├── .github/workflows/    # CI/CD
└── docs/                 # Documentación
```

## 🔐 Seguridad

- ✅ Autenticación JWT stateless
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Rate limiting (15 req/min)
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado
- ✅ Validación de entrada con Joi
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Auditoría completa de cambios

## 🧪 Testing

### Backend

```bash
cd backend
npm test                    # Todos los tests
npm run test:unit          # Tests unitarios
npm run test:integration   # Tests de integración
npm run test:coverage      # Coverage
```

### Frontend

```bash
cd frontend
npm test                   # Todos los tests
npm run test:ui           # UI mode
npm run test:coverage     # Coverage
```

## 📊 Base de Datos

### Modelos Principales

- **Usuario**: Cuentas de acceso
- **Personal**: Información del personal
- **Jerarquia**: Rangos policiales
- **Seccion**: Secciones/departamentos
- **Licencia**: Licencias y permisos
- **Capacitacion**: Cursos y capacitaciones
- **Sancion**: Sanciones disciplinarias
- **Auditoria**: Registro de cambios

### Migraciones

```bash
# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Reset DB (desarrollo)
npx prisma migrate reset
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

### Backend

- `npm start`: Iniciar en producción
- `npm run dev`: Iniciar con nodemon
- `npm test`: Ejecutar tests
- `npm run migrate`: Ejecutar migraciones
- `npm run seed`: Cargar datos iniciales

### Frontend

- `npm run dev`: Servidor de desarrollo
- `npm run build`: Build para producción
- `npm run preview`: Preview del build
- `npm test`: Ejecutar tests
- `npm run lint`: Linter

## 🐛 Troubleshooting

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar variables de entorno
cat backend/.env | grep DATABASE_URL
```

### Puerto en uso

```bash
# Cambiar puerto en .env
PORT=3001
```

### Problemas con Prisma

```bash
# Regenerar cliente
npx prisma generate

# Reset DB
npx prisma migrate reset
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Flavio Sanchez** - _Desarrollo Inicial_ - [FRSanchezflavio](https://github.com/FRSanchezflavio)

## 🙏 Agradecimientos

- Policía Boliviana - Departamento de Inteligencia Criminal D-2
- Comunidad Open Source
- Todos los contribuidores

## 📞 Soporte

- **Email**: soporte@policia.gob.bo
- **Issues**: [GitHub Issues](https://github.com/FRSanchezflavio/sigepic1.0/issues)
- **Documentación**: [Wiki](https://github.com/FRSanchezflavio/sigepic1.0/wiki)

---

**Desarrollado con ❤️ para la Policía Boliviana**

© 2024 Departamento de Inteligencia Criminal D-2. Todos los derechos reservados.
# sigepic2.0
