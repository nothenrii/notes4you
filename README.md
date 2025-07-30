# 🎹 88 Notes for Zan

An emotional, musical guestbook laid over a full 88-key piano keyboard. Each key can host a message from a visitor, optionally with a video, photo, and a custom sound.

## ✨ Features

### 🎵 Interactive 88-Key Piano
- **Full Range**: Display a top-down, full-range piano keyboard (A0–C8)
- **Clickable Keys**: Open a modal with the note's content
- **Audio Playback**: Hover over keys to play sounds:
  - Custom sounds uploaded by users
  - Default piano notes synthesized with Tone.js

### 📝 Add Notes
- **Floating Music Icon**: Top-right corner for easy access
- **Rich Content Support**:
  - Piano key selection
  - Title and message
  - YouTube video links or file uploads
  - Multiple photo uploads
  - Custom audio files for hover sounds
  - Password protection for future editing

### 👀 View Notes
- **Detailed Display**: Shows title, message, embedded videos, and photos
- **Media Support**: YouTube embeds and uploaded content
- **Custom Audio Preview**: Play and preview custom hover sounds
- **Edit Access**: Password-protected editing for note owners

### ✏️ Edit & Delete
- **Password Protection**: Secure editing with bcrypt-hashed passwords
- **Full Editing**: Modify all aspects of existing notes
- **Media Management**: Add new photos, replace videos/audio
- **Safe Deletion**: Confirmation prompts for permanent removal

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Audio**: Tone.js for piano synthesis
- **Backend**: Supabase (Database + Storage)
- **Authentication**: bcrypt.js for password hashing
- **Styling**: CSS with responsive design

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd zan88keys
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the migration SQL in your Supabase SQL editor:
```sql
-- Copy and paste the contents of supabase-migration.sql
```

3. Create your environment file:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

## 🎹 Piano Key Layout

The application displays all 88 keys of a standard piano:
- **Range**: A0 to C8 (88 keys total)
- **Visual**: Black and white keys with proper spacing
- **Interactive**: Click to view notes, hover to play sounds
- **Indicators**: Visual markers show which keys have notes

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Piano.tsx       # Main piano keyboard
│   ├── AddNoteModal.tsx # Note creation form
│   ├── ViewNoteModal.tsx # Note display
│   └── EditNoteModal.tsx # Note editing
├── types/              # TypeScript definitions
├── utils/              # Utilities
│   ├── supabase.ts     # Database operations
│   ├── audioUtils.ts   # Tone.js audio management
│   └── pianoUtils.ts   # Piano key generation
└── App.tsx             # Main application
```

## 🎨 Styling Features

- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Musical, elegant color scheme
- **Hover Effects**: Interactive feedback on all elements
- **Modal System**: Clean, accessible modal dialogs
- **Piano Aesthetics**: Realistic piano key appearance

## 🔒 Security Features

- **Password Protection**: Notes can be password-protected for editing
- **Secure Hashing**: bcrypt.js for password storage
- **Row Level Security**: Supabase RLS policies
- **File Upload Security**: Restricted file types and sizes

## 🌟 Optional Enhancements

Future improvements could include:
- Random note browser
- Search and filter functionality
- Background ambiance with volume controls
- Social sharing features
- Note analytics and statistics

## 📱 Mobile Responsiveness

The application is fully responsive with:
- Scrollable piano on small screens
- Touch-friendly controls
- Optimized modal layouts
- Responsive key sizing

## 🎵 Audio Features

- **Tone.js Integration**: High-quality audio synthesis
- **Custom Uploads**: Support for user audio files
- **Multiple Formats**: MP3, WAV, and other common formats
- **Hover Playback**: Immediate audio feedback

## 🚀 Deployment

The application can be deployed to:
- Vercel (recommended for Vite projects)
- Netlify
- Any static hosting service

Build the project and deploy the `dist` folder:
```bash
npm run build
# Deploy the dist/ folder
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.
