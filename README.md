# findpals Social Platform

findpals is a next-generation encrypted social platform built with a modular architecture and a premium "cyber-neon" aesthetic.

## Architecture

- **Backend**: NestJS (TypeScript), PostgreSQL, Redis, Socket.io, WebRTC.
- **Frontend**: React (TypeScript), TailwindCSS, Framer Motion.
- **Mobile**: Flutter (Android/iOS).
- **Aesthetic**: Dark/neon cyber aesthetic with glassmorphism.

## Progress Status

### Phase 0 - Prep ✅
- Modular repository structure initialized.
- Infrastructure (Docker, Nginx) configured for port `8023`.

### Phase 1 - Backend Services 🧪
- **Auth & Identity**: Implemented with pseudonymity support and AES-256 encryption.
- **Messaging**: Implemented with Chat/Message entities and Socket.io gateway.
- **Feed & Social**: Implemented with Post/Comment entities.
- **Creator Economy**: Basic Transaction and Subscription entities/services.
- **Gamification**: XP and Leveling progression system.

### Phase 3 - Frontend (Web & PWA) 🎨
- **Main Layout**: Cyber-neon layout with glassmorphism sidebar.
- **Onboarding**: Operational mode selector.
- **Feed**: Social feed with post cards and infinite scroll preparation.
- **Messaging**: Sleek real-time chat interface.
- **Creator Hub**: Wallet and analytics dashboard.

## Deployment

The project is designed for a cloud-based environment using Docker and Kubernetes.

```bash
cd infra
docker-compose up -d
```

Access:
- Frontend: `http://localhost:3000`
- API Proxy: `http://localhost:80/api`
- Backend Direct: `http://localhost:8023`

## Tech Requirements
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
