# RMS Platform - Realtors Management System

<div align="center">
  <img src="docs/logo.png" alt="RMS Platform Logo" width="200">

  [![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
</div>

## 🏠 Overview

RMS (Realtors Management System) is an enterprise-grade PropTech platform designed for managing realtors, properties, clients, and sales. Built with modern technologies and best practices, it provides a comprehensive solution for real estate businesses.

## ✨ Features

### 👥 User Management
- **Multi-role system**: Super Admin, Admin, Realtor, Client
- **Role-based access control (RBAC)**
- **JWT authentication with refresh tokens**

### 🏡 Property Management
- Complete property lifecycle management
- Property listings with offers
- Document management
- Price history tracking
- AI-powered price prediction

### 💰 Sales & Commission
- Automated commission calculation
- Tier-based commission rates
- Tax deduction and reporting
- Real-time sales tracking

### 🏆 Loyalty & Rankings
- **Tier System**: Bronze, Silver, Gold, Platinum
- Points-based rewards
- Achievement badges
- Monthly/Yearly Realtor of the Month/Year
- Leaderboards

### 💬 Communication
- Real-time chat (Admin ↔ Realtor ↔ Client)
- Push notifications
- Email notifications (ready for integration)

### 📊 Analytics & AI
- Sales analytics
- Property market trends
- Realtor performance prediction
- Investment scoring
- Smart pricing suggestions

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Real-time**: Socket.IO
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **State Management**: Zustand
- **Animations**: Framer Motion

### Infrastructure
- **Containerization**: Docker
- **Reverse Proxy**: Nginx
- **CI/CD**: Ready for GitHub Actions

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/rms-platform.git
cd rms-platform

# Copy environment file
cp .env.example .env

# Start development environment
docker-compose -f docker/docker-compose.dev.yml up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate --workspace=backend

# Seed the database
npm run db:seed --workspace=backend

# Start development servers
npm run dev
```

### Manual Setup

```bash
# Backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
rms-platform/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── users/       # User management
│   │   │   ├── admin/       # Admin features
│   │   │   ├── realtor/     # Realtor features
│   │   │   ├── client/      # Client features
│   │   │   ├── property/    # Property management
│   │   │   ├── sale/        # Sales management
│   │   │   ├── commission/  # Commission engine
│   │   │   ├── tax/         # Tax management
│   │   │   ├── loyalty/     # Loyalty system
│   │   │   ├── ranking/     # Ranking system
│   │   │   ├── chat/        # Chat system
│   │   │   ├── notification/# Notifications
│   │   │   ├── analytics/   # Analytics
│   │   │   └── ai/          # AI features
│   │   ├── common/          # Shared utilities
│   │   ├── websocket/       # WebSocket gateway
│   │   └── config/          # Configuration
│   └── prisma/              # Database schema
├── frontend/                # Next.js Frontend
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── lib/             # Utilities
│       ├── hooks/           # Custom hooks
│       ├── store/           # State management
│       └── services/        # API services
├── shared/                  # Shared types
├── docker/                  # Docker configs
└── infrastructure/          # Nginx, scripts
```

## 🎨 Design System

### Brand Colors
- **Primary**: `#1F5625` (Forest Green)
- **Secondary**: `#F5F5F5`
- **Accent**: `#FFD700` (Gold)

### Loyalty Tiers
- 🥉 **Bronze**: `#CD7F32` - 3% commission
- 🥈 **Silver**: `#C0C0C0` - 3.5% commission
- 🥇 **Gold**: `#FFD700` - 4% commission
- 💎 **Platinum**: `#E5E4E2` - 5% commission

## 🔐 API Documentation

After starting the backend, access Swagger documentation at:
```
http://localhost:4000/api/docs
```

## 📊 Database Schema

Key entities:
- Users (with role-specific profiles)
- Properties
- Sales
- Commissions
- Taxes
- Loyalty Points
- Rankings
- Chat Rooms & Messages
- Notifications

## 🧪 Testing

```bash
# Backend tests
npm run test --workspace=backend
npm run test:e2e --workspace=backend

# Frontend tests
npm run test --workspace=frontend
```

## 🚢 Deployment

### Production with Docker

```bash
# Build and start production containers
docker-compose -f docker/docker-compose.yml up -d --build
```

### Environment Variables

See `.env.example` for all required environment variables.

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI/ML predictions
- [ ] Multi-tenancy support
- [ ] Blockchain property records
- [ ] AR property tours

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS Team
- Next.js Team
- Prisma Team
- ShadCN UI

---

<div align="center">
  <p>Built with ❤️ by the RMS Platform Team</p>
  <p>© 2024 RMS Platform. All rights reserved.</p>
</div>
