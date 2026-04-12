# SpendMapr

A personal finance dashboard for tracking spending, debt, and savings goals. Built with React, Vite, and Supabase.

![SpendMapr Dashboard](https://via.placeholder.com/1200x600/F7F8FA/0f172a?text=SpendMapr+Dashboard)

## Features

- 🏦 **Banking Integration**: Connect your bank accounts securely with Open Banking
- 📊 **Investment Tracking**: Monitor your investment portfolio performance
- 🎯 **Goal Setting**: Set and track savings goals
- 💳 **Debt Management**: Track and manage your debts effectively
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🔐 **Secure Authentication**: Powered by Supabase Auth
- 📈 **Real-time Insights**: Get actionable financial insights

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Charts**: Recharts
- **Authentication & Database**: Supabase
- **UI Components**: Radix UI + shadcn/ui

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Supabase account for production features

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/adeth0/spendmapr.git
   cd spendmapr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Mode

No configuration required! Simply start the app and click "Try Demo Mode" to explore the application with sample data.

### Production Setup

1. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
spendmapr/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   └── AppShell.tsx   # Main layout with navigation
│   ├── contexts/          # React contexts (Auth)
│   ├── lib/               # Utilities and Supabase client
│   ├── pages/             # Page components
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── dist/                  # Production build output
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Deployment

SpendMapr is designed to be deployed as a static site. The easiest way is to use GitHub Pages:

1. Build the project:
   ```bash
   npm run build
   ```

2. Push the `dist/` folder to GitHub (or use GitHub Actions)

3. Configure GitHub Pages to serve from the `dist/` directory

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | No (demo mode without) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | No (demo mode without) |

## Mobile Responsiveness

The application is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📱 Large phones and tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1280px+)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

- 📧 Email: support@spendmapr.com
- 🐛 Issues: [GitHub Issues](https://github.com/adeth0/spendmapr/issues)
- 📖 Documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Acknowledgments

- [Supabase](https://supabase.com) for authentication and database
- [Vite](https://vitejs.dev) for the amazing build tool
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Recharts](https://recharts.org) for the beautiful charts
- [Radix UI](https://www.radix-ui.com) for accessible UI components

---

Built with ❤️ by [adeth0](https://github.com/adeth0)