# 🚗 Irish Auto Market

Ireland's premier car marketplace - A modern, fast, and user-friendly platform for buying and selling cars in Ireland.

## 🌟 Features

- **Lightning Fast Search**: Instant search with advanced filtering
- **Mobile First**: Perfect experience on all devices
- **Dealer Dashboard**: Professional tools for car dealers
- **Real-time Notifications**: Live updates for inquiries and messages
- **Advanced Analytics**: Detailed insights for sellers
- **Secure Authentication**: Safe and secure user accounts

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with secure sessions
- **Deployment**: Vercel
- **Database Hosting**: Neon

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/irish-auto-market.git
cd irish-auto-market
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database URL and other environment variables in `.env.local`

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

Our database includes:
- **Users**: Authentication and profiles
- **Cars**: Vehicle listings with detailed specifications
- **Inquiries**: Buyer-seller communication
- **Favorites**: Saved cars for users
- **Dealer Profiles**: Enhanced business accounts

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered car recommendations
- [ ] Integration with financing partners
- [ ] Expanded dealer tools

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Faithful Aborisade**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

---

**Built with ❤️ for the Irish automotive community**
