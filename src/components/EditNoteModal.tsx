import React, { useState, useEffect } from "react";
import { notesApi } from "../utils/supabase";
import { Note } from "../types";
import bcrypt from "bcryptjs";
import { InputSanitizer, MAX_LENGTHS } from "../utils/sanitization";
import "./EditNoteModal.css";

interface EditNoteModalProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onNoteUpdated: (note: Note) => void;
  onNoteDeleted: (noteId: string) => void;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  note,
  onClose,
  onNoteUpdated,
  onNoteDeleted,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (note) {
      setFormData({
        selectedNote: note.note,
        title: note.title,
        message: note.message,
        authorNickname: note.author_nickname || "",
        youtubeUrl: note.youtube_url || "",
        password: "",
      });
    }
  }, [note]);

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
          `password must be no more than ${MAX_LENGTHS.password} characters`
        );
        return;
      } else {
        setError(""); // Clear any previous errors
      }
    } else {
      // Apply length limits for text fields
      const maxLength = MAX_LENGTHS[name as keyof typeof MAX_LENGTHS];
      if (maxLength && value.length > maxLength) {
        setError(`${name} must be no more than ${maxLength} characters.`);
        return;
      } else {
        setError(""); // Clear any previous errors
      }
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photos" | "video" | "audio"
  ) => {
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

        // Log allowed types for debugging
        if (type === "audio") {
        }

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
      setError("error processing file upload");
    }
  };

  const uploadFiles = async () => {
    const uploadedUrls: { photos: string[]; video?: string; audio?: string } = {
      photos: note?.photo_urls || [],
    };

    // Upload new photos (append to existing)
    for (const photo of files.photos) {
      const photoPath = `${Date.now()}-${photo.name}`;
      const photoUrl = await notesApi.uploadFile("photos", photoPath, photo);
      uploadedUrls.photos.push(photoUrl);
    }

    // Upload video (replace existing)
    if (files.video) {
      const videoPath = `${Date.now()}-${files.video.name}`;
      uploadedUrls.video = await notesApi.uploadFile(
        "videos",
        videoPath,
        files.video
      );
    }

    // Upload audio (replace existing)
    if (files.audio) {
      const audioPath = `${Date.now()}-${files.audio.name}`;
      uploadedUrls.audio = await notesApi.uploadFile(
        "audio",
        audioPath,
        files.audio
      );
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Sanitize and validate all inputs
      const sanitizedData = {
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
      if (!sanitizedData.title || !sanitizedData.message) {
        throw new Error("Please fill in all required fields");
      }

      // Validate YouTube URL if provided
      if (
        sanitizedData.youtubeUrl &&
        !InputSanitizer.validateYouTubeURL(sanitizedData.youtubeUrl)
      ) {
        throw new Error("Invalid YouTube URL format");
      }

      // Upload files
      const uploadedUrls = await uploadFiles();

      // Hash new password if provided
      const passwordHash = sanitizedData.password
        ? await bcrypt.hash(sanitizedData.password, 10)
        : note.password_hash;

      // Update note
      const updateData = {
        title: sanitizedData.title,
        message: sanitizedData.message,
        author_nickname: sanitizedData.authorNickname || undefined,
        youtube_url: sanitizedData.youtubeUrl || note.youtube_url,
        video_url: uploadedUrls.video || note.video_url,
        photo_urls: uploadedUrls.photos,
        custom_audio_url: uploadedUrls.audio || note.custom_audio_url,
        password_hash: passwordHash,
      };

      const updatedNote = await notesApi.updateNote(note.id, updateData);

      onNoteUpdated(updatedNote);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update note"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    setIsSubmitting(true);
    setError("");

    try {
      await notesApi.deleteNote(note.id);
      onNoteDeleted(note.id);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content edit-note-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="edit-header">
            <h2>✏️ edit note</h2>
            <div className="note-key-badge">{note.note}</div>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="edit-note-form">
            {error && <div className="error-message">{error}</div>}

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
              <label htmlFor="videoFile">replace video file</label>
              <input
                type="file"
                id="videoFile"
                accept="video/*"
                onChange={(e) => handleFileChange(e, "video")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="photos">add more photos</label>
              <input
                type="file"
                id="photos"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, "photos")}
              />
              <small>new photos will be added to existing ones</small>
            </div>

            <div className="form-group">
              <label htmlFor="audio">replace custom hover sound</label>
              <input
                type="file"
                id="audio"
                accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/mpeg,audio/webm,audio/flac,.mp3,.wav,.ogg,.m4a,.aac,.mpeg,.webm,.flac"
                onChange={(e) => handleFileChange(e, "audio")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">new password (optional)</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="enter new password or leave blank to keep current..."
              />
              <small>leave blank to keep current password</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                🗑️ delete note
              </button>
              <div className="main-actions">
                <button type="button" onClick={onClose} disabled={isSubmitting}>
                  cancel
                </button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "updating..." : "update note"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="delete-confirm">
            <h3>🗑️ delete note?</h3>
            <p>
              are you sure you want to permanently delete this note for{" "}
              <strong>{note.note}</strong>? This action cannot be undone.
            </p>
            <div className="delete-actions">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                cancel
              </button>
              <button
                type="button"
                className="confirm-delete"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "deleting..." : "yes, delete forever... :("}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditNoteModal;
