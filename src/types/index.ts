export interface Note {
  id: string;
  note: string; // e.g., "F#3", "C4"
  title: string;
  message: string;
  author_nickname?: string; // Optional nickname for the note author
  youtube_url?: string; // YouTube video URL
  video_url?: string; // URL to uploaded video file
  photo_urls: string[];
  custom_audio_url?: string;
  password_hash?: string;
  created_at: string;
}

export interface PianoKey {
  note: string;
  octave: number;
  isBlack: boolean;
  frequency: number;
  hasNote?: boolean;
}