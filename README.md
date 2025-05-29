# Calorie Tracker App

A React Native mobile application for tracking daily meals and nutrition using AI-powered food recognition. The app helps users maintain their daily calorie goals and provides detailed monthly reports of their nutrition intake.

## Features

- 📸 AI-powered food recognition from photos
- 📊 Daily calorie tracking and goal management
- 📈 Monthly nutrition reports and statistics
- 🎯 Customizable daily calorie goals
- 👤 User profile management
- 💾 Persistent data storage using SQLite
- 🌓 Light/Dark theme support

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd calorie-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install required Expo packages:
```bash
npx expo install expo-sqlite expo-image-picker expo-camera expo-media-library
```

## Environment Setup

1. Create a `.env` file in the root directory:
```bash
touch .env
```

2. Add your OpenRouter API key (required for food recognition):
```
OPENROUTER_API_KEY=your_api_key_here
```

## Database Setup

The app uses SQLite for persistent data storage. The database is automatically initialized when the app starts. The following tables are created:

- `meals`: Stores meal entries with food items and calorie information
- `daily_goals`: Stores user's daily nutrition goals
- `user_profile`: Stores user profile information

No manual database setup is required as the tables are created automatically on first launch.

## Running the App

1. Start the development server:
```bash
npx expo start
```

2. Run on your preferred platform:
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Scan the QR code with Expo Go app on your physical device

## Development

### Project Structure

```
calorie-tracker/
├── app/
│   ├── (tabs)/           # Main app screens
│   ├── components/       # Reusable UI components
│   ├── context/         # React Context providers
│   ├── services/        # Business logic and API services
│   ├── types/           # TypeScript type definitions
│   └── _layout.tsx      # Root layout component
├── assets/              # Static assets
├── constants/           # App constants
└── hooks/              # Custom React hooks
```

### Key Technologies

- **Frontend**: React Native with Expo
- **Database**: SQLite (expo-sqlite) with the following features:
  - Persistent SQLite database with automatic table creation
  - Type-safe database operations with TypeScript interfaces
  - Efficient CRUD operations for meals, goals, and user profiles
  - Transaction support for data integrity
  - Automatic database initialization and migration
  - Optimized queries for monthly summaries and daily reports
- **State Management**: React Context
- **Food Recognition**: OpenRouter API
- **Image Handling**: expo-image-picker, expo-camera
- **Styling**: React Native StyleSheet

### Database Service

The app uses a robust SQLite database service (`sqliteDatabaseService.ts`) that provides:

1. **Database Structure**:
   - `meals` table: Stores meal entries with food items, calories, and timestamps
   - `daily_goals` table: Manages user's nutrition goals with versioning
   - `user_profile` table: Stores user information and preferences

2. **Key Features**:
   - Automatic database initialization and table creation
   - Type-safe database operations with TypeScript interfaces
   - Efficient querying with proper indexing
   - Transaction support for data integrity
   - Proper error handling and logging
   - SQL injection prevention through parameterized queries
   - Automatic data type conversion and validation

3. **Data Operations**:
   - CRUD operations for meals, goals, and user profiles
   - Efficient date-based queries for daily and monthly reports
   - Batch operations for data updates
   - Proper handling of JSON data for food items
   - Automatic timestamp management

4. **Performance Optimizations**:
   - Efficient query execution using SQLite's native methods
   - Proper indexing for frequently queried fields
   - Optimized data retrieval for monthly summaries
   - Memory-efficient handling of large datasets
   - Connection pooling and resource management

### Adding New Features

1. **Database Changes**:
   - Add new table definitions in `sqliteDatabaseService.ts`
   - Update the `DatabaseService` interface in `types/database.ts`
   - Implement new methods in `SQLiteDatabaseService` class

2. **UI Components**:
   - Create new components in `app/components/`
   - Use existing themed components (`ThemedText`, `ThemedView`)
   - Follow the established styling patterns

3. **New Screens**:
   - Add new screen components in `app/(tabs)/`
   - Update navigation in `app/_layout.tsx`

## Testing

The app includes basic error handling and data validation. To test the app:

1. **Database Operations**:
   - Add/remove meals
   - Update daily goals
   - Modify user profile
   - Check monthly reports

2. **Food Recognition**:
   - Take photos of different meals
   - Verify calorie estimates
   - Check food item detection

3. **Data Persistence**:
   - Close and reopen the app
   - Verify data is retained
   - Check monthly summaries

## Troubleshooting

### Common Issues

1. **Database Errors**:
   - Clear app data and restart
   - Check database initialization logs
   - Verify table creation queries

2. **Image Recognition Issues**:
   - Verify OpenRouter API key
   - Check internet connection
   - Ensure proper image format

3. **Build/Deployment Issues**:
   - Clear npm cache: `npm cache clean --force`
   - Remove node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.
