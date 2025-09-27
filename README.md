# 🏀 HoopsLedger

**Track hoops. Track dues. Zero fuss.**

HoopsLedger is a modern, multi-tenant SaaS application built specifically for basketball clubs to track attendance and manage offline payments. Designed with mobile-first principles and real-time analytics, it provides a comprehensive solution for club management without the complexity of automated payment processing.

## ✨ Key Features

### 🎯 Core Principles
- **Offline Payment Tracking**: All payments are recorded manually (cash, bank transfer, other)
- **Fast Mobile Attendance**: Large tap targets and mobile-optimized interface for quick session management
- **Real-time Balance Updates**: Accurate financial tracking with instant balance calculations
- **No Email Automation**: Email addresses are optional; system never sends automated emails
- **Player Portal Access**: Magic link authentication for players with email addresses (manual sharing only)
- **GDPR Compliant**: Privacy-focused design with proper access controls

### 👥 User Roles & Permissions

#### Organization Admin
- Full control over players, sessions, pricing rules, attendance, payments, and analytics
- Generate and manually share magic links for player portal access
- Access to comprehensive audit logs and reporting
- Branding and organization settings management

#### Coach/Host
- Create and manage training sessions
- Mark attendance with quick mobile interface
- Process payments and mark fees as paid/waived
- Undo status changes when needed
- No access to organization-wide settings

#### Player (Read-only Portal)
- **Access only if email is on record** via manually shared magic link
- View personal analytics, session history, and balance information
- Cannot edit profile or register themselves
- Cannot make online payments (all payment tracking is manual)

### 📊 Financial Management
- **Default Pricing**: Student £3, Standard £5, Guest £0 (fully customizable per organization)
- **Per-session Overrides**: Adjust pricing rules for specific sessions
- **Per-attendance Fee Overrides**: Individual fee adjustments by admin/host
- **Manual Payment Processing**: All payments recorded manually with audit trails
- **Balance Calculations**: Real-time balance updates with comprehensive reporting

### 📱 Mobile-First Design
- Large tap targets (44px minimum) for easy mobile interaction
- Fast attendance marking with search and filter capabilities
- Responsive design optimized for phones and tablets
- PWA-ready for offline capability

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom magic link system (no third-party auth)
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React
- **Deployment**: Optimized for Hostinger VPS with PM2

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS or later
- PostgreSQL database
- pnpm package manager

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd hoops-ledger
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database and app configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/hoopsledger"
   APP_URL="http://localhost:3000"
   SESSION_SECRET="your-super-secret-session-key"
   NODE_ENV="development"
   ```

3. **Set up the database:**
   ```bash
   pnpm db:push      # Create database schema
   pnpm db:seed      # Create demo data
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Access the application:**
   - Main app: http://localhost:3000
   - Demo admin login: `admin@demohoops.com` / `admin123`
   - Demo coach login: `coach@demohoops.com` / `coach123`

### Database Management
```bash
pnpm db:studio    # Open Prisma Studio for database inspection
pnpm db:migrate   # Run database migrations
pnpm typecheck    # Run TypeScript type checking
```

## 🏗 Architecture Overview

### Data Models
- **Organizations**: Multi-tenant structure with branding and settings
- **Users**: Admin and Coach roles with organization-scoped access
- **Players**: Club members with optional email addresses and categories
- **Sessions**: Training sessions with pricing rules and capacity management
- **Attendance**: Check-in records with fee calculations and status tracking
- **Payments**: Manual payment records with method and occurrence tracking
- **Audit Logs**: Complete audit trail of all critical operations

### Key Business Rules
- **Default Fees**: Student £3, Standard £5, Guest £0 (configurable)
- **Exempt Players**: Automatic exempt status with £0 fees
- **Balance Calculation**: `Total Fees Owed - Total Payments = Balance`
- **Payment Allocation**: Payments linked to attendance records when possible
- **Magic Links**: 15-minute expiry, single-use, manual sharing only

## 🎨 Design System

### Brand Colors
- **Primary Orange**: `#F97316` (Hoops Orange)
- **Dark Accent**: `#111827`
- **Success Green**: `#16A34A` (Paid status)
- **Warning Orange**: `#D97706` (Unpaid/highlight)
- **Neutral Colors**: `#F3F4F6` (Background), `#9CA3AF` (Muted text)

### Typography
- **Font Family**: Inter with tabular numbers for currency display
- **Weights**: Regular (400), Medium (500), Semibold (600)
- **Features**: OpenType features for better number display

## 🔐 Security Features

- **Role-based Access Control**: Strict permission enforcement
- **Session Management**: Secure cookie-based sessions
- **Magic Link Security**: Short expiry, single-use tokens
- **Audit Logging**: Complete activity tracking for compliance
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 📈 Analytics & Reporting

### Player Analytics
- Session attendance tracking (30/90/365/lifetime periods)
- Payment history and balance calculations
- Attendance streaks and participation patterns
- Average fees and financial summaries

### Organization Analytics
- Monthly revenue tracking with trends
- Outstanding balance monitoring
- Session fill rates and capacity utilization
- Player category distribution
- Attendance patterns and insights

## 🚀 Deployment

### Hostinger VPS Deployment
1. **Server Setup:**
   ```bash
   # Install Node.js 20 LTS
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install pnpm
   npm install -g pnpm
   
   # Install PM2
   npm install -g pm2
   ```

2. **Application Deployment:**
   ```bash
   # Build the application
   pnpm install
   pnpm build
   
   # Start with PM2
   pm2 start pnpm --name "hoopsledger" -- start
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Environment Variables (Production)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/hoopsledger_prod"
APP_URL="https://your-domain.com"
SESSION_SECRET="super-secure-production-key"
NODE_ENV="production"
```

## 📋 MVP Acceptance Criteria

✅ **Authentication & Access Control**
- Admin creates players with optional email addresses
- Magic link generation and consumption for players with emails
- Role-based access (Admin, Coach, Player read-only)

✅ **Session Management**
- Create sessions with pricing rules and capacity
- Fast mobile attendance tracking interface
- Fee application based on player category

✅ **Payment Processing**
- Manual "Mark Paid" functionality creates payment records
- Undo payment functionality with audit trails
- Balance calculation updates in real-time

✅ **Player Portal**
- Magic link authentication for email-enabled players
- Read-only dashboard with personal analytics
- Session history and balance viewing

✅ **Reporting & Analytics**
- Monthly revenue tracking (manual payment sums)
- Outstanding balance monitoring
- Attendance trends and category analysis

✅ **Audit & Compliance**
- Complete audit log of all critical operations
- Before/after state tracking
- User attribution for all changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review the [API reference](docs/api.md)

---

**HoopsLedger** - Built with ❤️ for basketball clubs who want simple, effective management without the complexity.

*Track hoops. Track dues. Zero fuss.*