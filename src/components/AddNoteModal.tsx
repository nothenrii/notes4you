import React, { useState, useEffect } from "react";
import { generatePianoKeys, getNoteString } from "../utils/pianoUtils";
import { notesApi } from "../utils/supabase";
import { Note } from "../types";
import bcrypt from "bcryptjs";
import { InputSanitizer, MAX_LENGTHS } from "../utils/sanitization";
import { audioManager } from "../utils/audioUtils";
import "./AddNoteModal.css";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded: (note: Note) => void;
  preSelectedNote?: string;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onNoteAdded,
  preSelectedNote,
}) => {
  const [formData, setFormData] = useState({
    selectedNote: "",
    title: "",
    message: "",
    authorNickname: "",
    youtubeUrl: "",
    password: "",
  });
  const [files, setFiles] = useState({
    photos: [] as File[],
    video: null as File | null,
    audio: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const pianoKeys = generatePianoKeys();

  // Update form data when preSelectedNote changes
  useEffect(() => {
    if (preSelectedNote) {
      setFormData((prev) => ({
        ...prev,
        selectedNote: preSelectedNote,
      }));
    }
  }, [preSelectedNote]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Only apply basic length limits during typing, full sanitization on submit
    let processedValue = value;

    if (name === "password") {
      // Only validate password length during typing
      if (value.length > MAX_LENGTHS.password) {
        setError(
          `Password must be no more than ${MAX_LENGTHS.password} characters`
        );
        return;
      } else {
        setError(""); // Clear any previous errors
      }
    } else if (name !== "selectedNote") {
      // Apply length limits for text fields
      const maxLength = MAX_LENGTHS[name as keyof typeof MAX_LENGTHS];
      if (maxLength && value.length > maxLength) {
        setError(`${name} must be no more than ${maxLength} characters`);
        return;
      } else {
        setError(""); // Clear any previous errors
      }
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photos" | "video" | "audio"
  ) => {
    // Start audio context on first user interaction
    try {
      await audioManager.startAudioContext();
    } catch (error) {
      // Audio context start failed
    }

    const selectedFiles = e.target.files;
    if (!selectedFiles) {
      return;
    }

    try {
      if (type === "photos") {
        // Validate each photo file
        const validFiles: File[] = [];
        for (const file of Array.from(selectedFiles)) {
          const validation = InputSanitizer.validateFile(file, "image");
          if (validation.valid) {
            validFiles.push(file);
          } else {
            setError(`Invalid file: ${file.name} - ${validation.error}`);
            return;
          }
        }
        setFiles((prev) => ({ ...prev, photos: validFiles }));
      } else {
        // Validate single file
        const file = selectedFiles[0];


        const validation = InputSanitizer.validateFile(file, type);

        if (validation.valid) {
          setFiles((prev) => ({ ...prev, [type]: file }));
        } else {
          setError(`Invalid file: ${file.name} - ${validation.error}`);
          return;
        }
      }
      setError(""); // Clear any previous errors
    } catch (error) {
      setError("Error processing file upload");
    }
  };

  const uploadFiles = async () => {
    const uploadedUrls: { photos: string[]; video?: string; audio?: string } = {
      photos: [],
    };

    try {
      // Upload photos
      for (const photo of files.photos) {
        const photoPath = `${Date.now()}-${photo.name}`;
        const photoUrl = await notesApi.uploadFile("photos", photoPath, photo);
        uploadedUrls.photos.push(photoUrl);
      }

      // Upload video
      if (files.video) {
        const videoPath = `${Date.now()}-${files.video.name}`;
        uploadedUrls.video = await notesApi.uploadFile(
          "videos",
          videoPath,
          files.video
        );
      }

      // Upload audio
      if (files.audio) {

        // Validate audio file before upload
        const validation = InputSanitizer.validateFile(files.audio, "audio");
        if (!validation.valid) {
          throw new Error(`Audio file validation failed: ${validation.error}`);
        }

        const audioPath = `${Date.now()}-${files.audio.name}`;
        uploadedUrls.audio = await notesApi.uploadFile(
          "audio",
          audioPath,
          files.audio
        );
      }
    } catch (error) {
      throw error;
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Start audio context on first user interaction
    try {
      await audioManager.startAudioContext();
    } catch (error) {
      // Audio context start failed
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Sanitize and validate all inputs
      const sanitizedData = {
        selectedNote: formData.selectedNote,
        title: InputSanitizer.sanitizeText(formData.title, MAX_LENGTHS.title),
        message: InputSanitizer.sanitizeText(
          formData.message,
          MAX_LENGTHS.message
        ),
        authorNickname: InputSanitizer.sanitizeText(
          formData.authorNickname,
          MAX_LENGTHS.authorNickname
        ),
        youtubeUrl: formData.youtubeUrl
          ? InputSanitizer.sanitizeURL(formData.youtubeUrl)
          : "",
        password: formData.password,
      };

      // Validate required fields
      if (
        !sanitizedData.selectedNote ||
        !sanitizedData.title ||
        !sanitizedData.message
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Validate piano note format
      if (!InputSanitizer.validatePianoNote(sanitizedData.selectedNote)) {
        throw new Error("Invalid piano note format");
      }

      // Validate YouTube URL if provided
      if (
        sanitizedData.youtubeUrl &&
        !InputSanitizer.validateYouTubeURL(sanitizedData.youtubeUrl)
      ) {
        throw new Error("Invalid YouTube URL format");
      }

      // Check if note already exists for this key
      const existingNote = await notesApi.getNoteByKey(
        sanitizedData.selectedNote
      );
      if (existingNote) {
        throw new Error(
          `A note already exists for ${sanitizedData.selectedNote}. Please choose a different key.`
        );
      }

      // Upload files
      const uploadedUrls = await uploadFiles();

      // Hash password if provided
      const passwordHash = sanitizedData.password
        ? await bcrypt.hash(sanitizedData.password, 10)
        : undefined;

      // Create note
      const noteData = {
        note: sanitizedData.selectedNote,
        title: sanitizedData.title,
        message: sanitizedData.message,
        author_nickname: sanitizedData.authorNickname || undefined,
        youtube_url: sanitizedData.youtubeUrl,
        video_url: uploadedUrls.video,
        photo_urls: uploadedUrls.photos,
        custom_audio_url: uploadedUrls.audio,
        password_hash: passwordHash,
      };

      const newNote = await notesApi.createNote(noteData);

      onNoteAdded(newNote);
      onClose();

      // Reset form
      setFormData({
        selectedNote: "",
        title: "",
        message: "",
        authorNickname: "",
        youtubeUrl: "",
        password: "",
      });
      setFiles({ photos: [], video: null, audio: null });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create note"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-note-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🎵 add a musical note</h2>
        </div>

        <form onSubmit={handleSubmit} className="add-note-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="selectedNote">piano key *</label>
            <select
              id="selectedNote"
              name="selectedNote"
              value={formData.selectedNote}
              onChange={handleInputChange}
              required
            >
              <option value="">select a piano key...</option>
              {pianoKeys.map((key, index) => (
                <option key={index} value={getNoteString(key)}>
                  {getNoteString(key)}{" "}
                  {key.isBlack ? "(black key)" : "(white key)"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="give your note a title..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="write your sob inducing message here..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="authorNickname">your nickname (optional)</label>
            <input
              type="text"
              id="authorNickname"
              name="authorNickname"
              value={formData.authorNickname}
              onChange={handleInputChange}
              placeholder="what should we call you? (e.g., 'music slut', 'piano princess')"
              maxLength={50}
            />
            <small>Add a fun nickname to sign your note!</small>
          </div>

          <div className="form-group">
            <label htmlFor="youtubeUrl">youtube video url</label>
            <input
              type="url"
              id="youtubeUrl"
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleInputChange}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="videoFile">or upload video file</label>
            <input
              type="file"
              id="videoFile"
              accept="video/*"
              onChange={(e) => handleFileChange(e, "video")}
            />
          </div>

          <div className="form-group">
            <label htmlFor="photos">upload photos</label>
            <input
              type="file"
              id="photos"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, "photos")}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audio">custom hover sound</label>
            <input
              type="file"
              id="audio"
              accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/mpeg,audio/webm,audio/flac,.mp3,.wav,.ogg,.m4a,.aac,.mpeg,.webm,.flac"
              onChange={(e) => {
                handleFileChange(e, "audio");
              }}
            />
            <small>
              upload a custom sound to play when someone hovers over your key
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">password (for editing later)</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="set a password to edit this note later..."
            />
            <small>optional but recommended to allow future edits</small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "creating note..." : "create note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
