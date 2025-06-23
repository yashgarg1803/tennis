# Sequential, Single Battlefield Blotto Game (Tennis)

A multiplayer web-based implementation of the Sequential Blotto game built with Next.js, TypeScript, and Supabase.

## Features

- 🎮 **Single Player Mode**: Play against AI with configurable difficulty
- 👥 **Multiplayer Mode**: Real-time battles with friends using room codes
- 🔐 **Google OAuth**: Secure authentication with Google accounts
- 📊 **Player Profiles**: Track your game statistics and history
- 🏆 **Game History**: View detailed results of past games
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Custom CSS with modern design
- **Authentication**: Google OAuth via Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tennis
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
- Go to your Supabase dashboard
- Navigate to the SQL Editor
- Run the `sql/database_schema.sql` script for initial setup

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to see the game!

## Deployment

### Deploy to Vercel (Recommended)

This project is optimized for deployment on Vercel. Follow these steps:

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables:**
   - In your Vercel project settings
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Update Supabase Settings:**
   - Add your Vercel domain to Supabase Auth settings
   - Update Google OAuth redirect URLs

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

## Database Setup

The project includes comprehensive SQL scripts for database management:

- **`sql/database_schema.sql`**: Complete initial setup
- **`sql/cleanup_game_tables_fixed.sql`**: Consolidate existing data
- **`sql/simple_rls_fix.sql`**: Fix multiplayer 406 errors
- **`sql/debug_constraint_fix.sql`**: Resolve constraint issues

See the [SQL folder documentation](sql/README.md) for detailed information about each script.

## Game Rules

Sequential Blotto is a strategic battle game where players deploy troops across multiple rounds:

1. Each player starts with 100 troops
2. Players simultaneously deploy troops each round
3. The player with more troops wins the round
4. First player to win 3 rounds wins the game
5. Players can see their opponent's previous moves

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── auth/           # Authentication pages
│   ├── play/           # Game pages (single/multiplayer)
│   └── profile/        # User profile and stats
├── components/         # Reusable React components
├── contexts/          # React contexts (Auth)
└── lib/               # Utility functions and game logic
    ├── game.ts        # Single player game logic
    ├── multiplayer.ts # Multiplayer game logic
    └── supabase.ts    # Database operations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues:
1. Check the [SQL troubleshooting guide](sql/README.md)
2. Review the console for error messages
3. Ensure your Supabase configuration is correct
4. See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
