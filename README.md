# 🏥 NeuraNovaa - Rural Healthcare Platform

**Connecting rural communities with quality healthcare through telemedicine, blockchain verification, and AI-powered diagnostics**

NeuraNovaa is a comprehensive healthcare platform designed to bridge the gap between rural communities and quality medical care. Built for hackathon demonstration, this platform showcases cutting-edge technology solutions for healthcare accessibility, security, and user experience.

## 🚀 Demo

**Live Demo:** [https://neuranovaa.vercel.app](https://neuranovaa.vercel.app) *(placeholder - update with actual URL)*

### Demo Credentials
- **Doctor:** `doctor@neuranovaa.com` / `demo123`
- **Patient:** `patient@neuranovaa.com` / `demo123`
- **Admin:** `admin@neuranovaa.com` / `demo123`

## ✨ Features

### 🩺 Telemedicine & Video Consultations
- **Real-time video consultations** using Jitsi Meet integration
- **Secure patient-doctor communication** with end-to-end encryption
- **Appointment scheduling** with calendar integration
- **Medical record sharing** during consultations
- **Prescription management** with digital signatures

### 🔗 Blockchain Verification
- **Immutable medical records** stored on blockchain
- **Doctor credential verification** through decentralized identity
- **Prescription authenticity** with blockchain-based verification
- **Audit trail** for all medical transactions
- **Smart contracts** for automated healthcare processes

### 🤖 AI-Powered Diagnostics
- **Symptom analysis** using machine learning algorithms
- **Medical image analysis** for preliminary diagnostics
- **Risk assessment** based on patient history and symptoms
- **Treatment recommendations** powered by AI
- **Early warning systems** for critical conditions

### 🌍 Multilingual Support
- **12+ languages** including English, Spanish, French, Hindi, Arabic
- **Real-time translation** for patient-doctor communication
- **Localized medical terminology** for accurate communication
- **Cultural sensitivity** in healthcare delivery
- **RTL language support** for Arabic and Hebrew

### 🎨 Theme Toggle & Accessibility
- **Light/Dark mode** toggle across all dashboards
- **System theme detection** with automatic switching
- **Persistent theme preferences** across sessions
- **Accessibility compliance** with WCAG 2.1 guidelines
- **High contrast modes** for visually impaired users

### 👥 Multi-Role Dashboard System
- **Doctor Dashboard:** Patient management, consultation tools, analytics
- **Patient Dashboard:** Health records, appointments, telemedicine access
- **Admin Dashboard:** System management, user oversight, analytics
- **Pharmacy Dashboard:** Prescription management, inventory tracking
- **Community Health Worker:** Field data collection, patient outreach

### 📱 Emergency & Mobile Features
- **Emergency help system** with GPS location sharing
- **Mobile-responsive design** for all devices
- **Offline functionality** for remote areas with poor connectivity
- **Push notifications** for critical alerts
- **QR code integration** for quick patient identification

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme management system
- **next-intl** - Internationalization framework

### Backend & Database
- **Firebase** - Backend-as-a-Service platform
  - **Firestore** - NoSQL document database
  - **Authentication** - User management and security
  - **Storage** - File and media storage
  - **Cloud Functions** - Serverless backend logic
- **React Query** - Data fetching 

### Development & Testing
- **Vitest** - Fast unit testing framework
- **Testing Library** - Component testing utilities
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking

### Deployment & Infrastructure
- **Vercel** - Frontend hosting and deployment
- **Firebase Hosting** - Static asset hosting
- **Vercel Analytics** - Performance monitoring
- **GitHub Actions** - CI/CD pipeline

### Additional Libraries
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **date-fns** - Date manipulation
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **React QR Code** - QR code generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Firebase account and project
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/neuranovaa.git
   cd neuranovaa
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Start Firebase emulators** (optional for local development)
   ```bash
   pnpm firebase:emulator
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Jitsi Configuration
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Deployment

#### Deploy to Vercel

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy Firebase backend**
   ```bash
   pnpm deploy:firebase
   ```
4. **Push to main branch** (triggers automatic deployment)

#### Deploy Firebase Services

```bash
# Deploy all Firebase services
pnpm deploy:firebase

# Deploy specific services
pnpm firebase:deploy:rules    # Firestore rules
pnpm firebase:deploy:indexes  # Firestore indexes
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[Environment Setup](docs/ENVIRONMENT.md)** - Environment variable configuration
- **[Bundle Optimization](docs/BUNDLE_OPTIMIZATION.md)** - Performance optimization guide
- **[Firebase Setup](FIREBASE_SETUP.md)** - Firebase configuration guide
- **[Security Guide](SECURITY.md)** - Security best practices
- **[Performance Guide](PERFORMANCE.md)** - Performance optimization

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run integration tests
pnpm test:integration

# Run performance tests
pnpm test:performance

# Run with UI
pnpm test:ui
```

## 🔧 Available Scripts

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Testing
pnpm test                   # Run tests
pnpm test:watch            # Run tests in watch mode
pnpm test:integration      # Run integration tests

# Firebase
pnpm firebase:deploy       # Deploy all Firebase services
pnpm firebase:emulator     # Start Firebase emulators

# Deployment
pnpm deploy:check          # Pre-deployment validation
pnpm deploy:firebase       # Deploy Firebase services
pnpm deploy:full          # Full deployment pipeline

# Validation
pnpm validate:env          # Validate environment variables
pnpm i18n:validate        # Validate translations
```

## 🏗️ Project Structure

```
NeuraNovaa/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard layouts and pages
│   ├── auth/             # Authentication pages
│   └── layout.tsx        # Root layout with metadata
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── providers/        # Context providers
│   └── dashboard/        # Dashboard-specific components
├── lib/                  # Utility functions and configurations
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
└── test/                 # Test files
```

## 🌟 Key Highlights for Judges

### Innovation
- **Blockchain integration** for medical record security and verification
- **AI-powered diagnostics** for preliminary health assessments
- **Multilingual support** breaking language barriers in healthcare

### Technical Excellence
- **Modern tech stack** with Next.js 14, TypeScript, and Firebase
- **Performance optimized** with bundle splitting and image optimization
- **Accessibility compliant** with WCAG 2.1 guidelines
- **Mobile-first design** for rural connectivity scenarios

### User Experience
- **Intuitive dashboards** for different user roles
- **Theme toggle** for comfortable usage in any lighting
- **Real-time features** for immediate healthcare delivery
- **Offline capabilities** for areas with poor internet connectivity

### Scalability & Security
- **Firebase backend** for reliable, scalable infrastructure
- **Blockchain verification** for tamper-proof medical records
- **End-to-end encryption** for patient data protection
- **Role-based access control** for data security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ by the NeuraNovaa team for improving rural healthcare accessibility.

---

**🏆 Hackathon Demo Ready** - This platform demonstrates the future of rural healthcare technology, combining accessibility, security, and innovation in one comprehensive solution.

*Last updated: November 2024*