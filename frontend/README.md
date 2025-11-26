# Travel Planner - Frontend

A modern Next.js frontend for the Travel Planner application, built with TypeScript and Tailwind CSS.

---

## Features

- 🔐 **Authentication** - Customer registration, login, and admin login
- 📦 **Package Browsing** - View available travel packages/catalogs
- ✏️ **Custom Bookings** - Create custom trips by selecting hotels, transport, and food
- 📋 **Booking Management** - View and manage your bookings
- 💳 **Payments** - Submit payments for bookings
- 👨‍💼 **Admin Dashboard** - Manage bookings, view payments, and customers

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (protected)/        # Protected customer pages
│   │   ├── dashboard/      # Customer dashboard
│   │   ├── catalog/[id]/   # Catalog details
│   │   ├── booking/[id]/   # Booking details
│   │   └── custom-booking/ # Custom booking page
│   ├── admin/              # Admin dashboard
│   ├── globals.css         # Global styles with Tailwind
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (redirects to login)
├── components/             # Reusable components
│   ├── Header.tsx          # Navigation header
│   └── ProtectedRoute.tsx  # Auth protection wrapper
├── context/                # React contexts
│   └── AuthContext.tsx     # Authentication context
├── services/               # API services
│   └── api.ts              # Axios API client
├── types/                  # TypeScript types
│   └── index.ts            # Type definitions
└── tailwind.config.ts      # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:3001`
- Oracle Database running inside Docker

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file (optional):
   ```bash
   cp .env.local.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001/api` |

## Pages

### Public Pages
- `/login` - Customer and admin login
- `/register` - Customer registration

### Customer Pages (Protected)
- `/dashboard` - Browse packages and view bookings
- `/catalog/:id` - View package details and book
- `/booking/:id` - View booking details and make payment
- `/custom-booking` - Create a custom booking

### Admin Pages (Protected, Admin Only)
- `/admin` - Admin dashboard with bookings, payments, and customers

## API Integration

The frontend communicates with the backend through the API service (`services/api.ts`), which includes:

- Automatic token injection for authenticated requests
- Token refresh and redirect on 401 errors

## License

MIT
