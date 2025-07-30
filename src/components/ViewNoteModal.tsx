import React, { useState } from "react";
import { Note } from "../types";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import { InputSanitizer } from "../utils/sanitization";
import { notesApi } from "../utils/supabase";
import "./ViewNoteModal.css";

interface ViewNoteModalProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onEdit: (note: Note) => void;
}

const ViewNoteModal: React.FC<ViewNoteModalProps> = ({
  isOpen,
  note,
  onClose,
  onEdit,
}) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !note) return null;

  const handleEditClick = () => {
    if (note.password_hash) {
      setShowPasswordPrompt(true);
    } else {
      onEdit(note);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isVerifying) {
      return;
    }
    
    setPasswordError("");
    setIsVerifying(true);

    if (!note?.password_hash) {
      setPasswordError("no password set for this note");
      setIsVerifying(false);
      return;
    }

    try {
      const isPasswordValid = await notesApi.verifyPassword(note.id, password);

      if (isPasswordValid) {
        onEdit(note);
        setShowPasswordPrompt(false);
        setPassword("");
        setPasswordError("");
      } else {
        setPasswordError("incorrect password. please try again.");
      }
    } catch (error) {
      setPasswordError("error verifying password. please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <CardContainer className="inter-var modal-width">
          <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[50rem] h-auto rounded-xl p-6 border">
            <CardItem translateZ="50" className="mb-6 w-full">
              <div className="modal-header-buttons">
                <div className="note-key-badge">{note.note}</div>
              </div>
            </CardItem>

            {!showPasswordPrompt ? (
              <div className="note-content">
                <CardItem translateZ="40">
                  <h2 className="note-title">
                    {InputSanitizer.escapeHTML(note.title)}
                  </h2>
                </CardItem>

                <CardItem translateZ="35">
                  <div className="note-message">
                    <p
                      dangerouslySetInnerHTML={{
                        __html: InputSanitizer.sanitizeHTML(note.message),
                      }}
                    />
                  </div>
                </CardItem>

                {/* Author Nickname */}
                {note.author_nickname && (
                  <CardItem translateZ="32">
                    <div className="note-author">
                      <p className="author-nickname">
                        — {InputSanitizer.escapeHTML(note.author_nickname)}
                      </p>
                    </div>
                  </CardItem>
                )}

                {/* YouTube Video Display */}
                {note.youtube_url && (
                  <CardItem translateZ="30" className="w-full">
                    <div className="note-media">
                      <h3>📹 youtube video</h3>
                      <div className="video-container">
                        <iframe
                          src={getYouTubeEmbedUrl(note.youtube_url)}
                          title="Note Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </CardItem>
                )}

                {/* Uploaded Video Display */}
                {note.video_url && (
                  <CardItem translateZ="30" className="w-full">
                    <div className="note-media">
                      <h3>📹 uploaded video</h3>
                      <video controls className="uploaded-video">
                        <source src={note.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </CardItem>
                )}

                {/* Photos Display */}
                {note.photo_urls && note.photo_urls.length > 0 && (
                  <CardItem translateZ="25" className="w-full">
                    <div className="note-media">
                      <h3>📸 photos</h3>
                      <div className="photos-grid">
                        {note.photo_urls.map((photoUrl, index) => (
                          <img
                            key={index}
                            src={photoUrl}
                            alt={`Photo ${index + 1}`}
                            className="note-photo"
                            onClick={() => window.open(photoUrl, "_blank")}
                            loading="lazy"
                          />
                        ))}
                      </div>
                    </div>
                  </CardItem>
                )}

                <CardItem translateZ="15">
                  <div className="note-metadata">
                    <p className="created-date">
                      Created:{" "}
                      {new Date(note.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </CardItem>

                <CardItem translateZ="60" className="mt-6">
                  <div className="note-actions">
                    {note.password_hash && (
                      <button className="edit-button" onClick={handleEditClick}>
                        ✏️ edit note
                      </button>
                    )}
                    <button className="close-button" onClick={onClose}>
                      ✕ close
                    </button>
                  </div>
                </CardItem>
              </div>
            ) : (
              <CardItem translateZ="50">
                <div className="password-prompt">
                  <h3>🔒 enter password to edit</h3>
                  <p>
                    this note is password protected. please enter the password
                    to edit it.
                  </p>

                  <form onSubmit={handlePasswordSubmit}>
                    {passwordError && (
                      <div className="error-message">{passwordError}</div>
                    )}

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="enter password..."
                      required
                      autoFocus
                      disabled={isVerifying}
                    />

                    <div className="password-actions">
                      <button
                        type="button"
                        onClick={() => setShowPasswordPrompt(false)}
                        disabled={isVerifying}
                      >
                        cancel
                      </button>
                      <button 
                        type="button"
                        disabled={isVerifying}
                        className={isVerifying ? 'loading' : ''}
                        onMouseDown={(e) => {
                          // Prevent the input from losing focus on mouse down
                          e.preventDefault();
                        }}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await handlePasswordSubmit(e);
                        }}
                      >
                        {isVerifying ? (
                          <>
                            <span className="loading-spinner"></span>
                            verifying...
                          </>
                        ) : (
                          'unlock & edit'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </CardItem>
            )}
          </CardBody>
        </CardContainer>
      </div>
    </div>
  );
};

export default ViewNoteModal;
