import React, { useEffect, useState, useCallback } from "react";
import { generatePianoKeys, getNoteString } from "../utils/pianoUtils";
import { audioManager } from "../utils/audioUtils";
import { notesApi } from "../utils/supabase";
import { Note, PianoKey } from "../types";
import ViewNoteModal from "./ViewNoteModal";
import EditNoteModal from "./EditNoteModal";
import AddNoteModal from "./AddNoteModal";
import "./Piano.css";

const Piano: React.FC = () => {
  const keys = generatePianoKeys();
  const [notesData, setNotesData] = useState<Record<string, Note>>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedKeyForAdd, setSelectedKeyForAdd] = useState<PianoKey | null>(
    null
  );
  const [audioContextStarted, setAudioContextStarted] = useState(false);
  const [lastHoverTime, setLastHoverTime] = useState(0);

  useEffect(() => {
    // Load existing notes from database
    const loadNotes = async () => {
      try {
        const notes = await notesApi.getAllNotes();
        const notesMap = notes.reduce((acc, note) => {
          acc[note.note] = note;
          return acc;
        }, {} as Record<string, Note>);
        setNotesData(notesMap);

        // Preload custom audio files for better performance
        const audioNotes = notes.filter((note) => note.custom_audio_url);
        audioNotes.forEach((note) => {
          if (note.custom_audio_url) {
            // Preload the audio file
            audioManager
              .preloadAudio(note.custom_audio_url)
              .catch((error: any) => {
                // Failed to preload audio
              });
          }
        });
      } catch (error) {
        // Failed to load notes
      }
    };

    loadNotes();
  }, []);

  const startAudioContext = async () => {
    if (!audioContextStarted) {
      try {
        await audioManager.startAudioContext();
        setAudioContextStarted(true);
      } catch (error) {
        // Failed to start audio context
      }
    }
  };

  const handleKeyClick = async (keyData: PianoKey) => {
    // Start audio context on first interaction
    await startAudioContext();

    const noteString = getNoteString(keyData);
    const noteData = notesData[noteString];

    if (noteData) {
      setSelectedNote(noteData);
      setShowViewModal(true);
    } else {
      // No note exists for this key, show add note modal
      setSelectedKeyForAdd(keyData);
      setShowAddModal(true);
    }
  };

  const handleKeyHover = useCallback(
    async (keyData: PianoKey) => {
      // Debounce rapid hover events
      const now = Date.now();
      if (now - lastHoverTime < 50) {
        // Reduced from 100ms to 50ms
        return; // Ignore hover events that are too close together
      }
      setLastHoverTime(now);

      const noteString = getNoteString(keyData);
      const noteData = notesData[noteString];


      // Play audio - audio context will be started automatically if needed
      try {
        await audioManager.playPianoNote(keyData, noteData?.custom_audio_url);
      } catch (error) {
        // Failed to play audio
      }
    },
    [lastHoverTime, notesData]
  );

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotesData((prev) => ({
      ...prev,
      [updatedNote.note]: updatedNote,
    }));
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotesData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (newData[key].id === noteId) {
          delete newData[key];
        }
      });
      return newData;
    });
  };

  const handleNoteAdded = (newNote: Note) => {
    setNotesData((prev) => ({
      ...prev,
      [newNote.note]: newNote,
    }));
  };

  return (
    <>
      <div className="piano">
        <div className="piano-keys">
          {keys.map((key, index) => {
            const noteString = getNoteString(key);
            const hasNote = !!notesData[noteString];

            return (
              <div
                key={index}
                className={`piano-key ${key.isBlack ? "black" : "white"} ${
                  hasNote ? "has-note" : ""
                }`}
                onClick={() => handleKeyClick(key)}
                onMouseEnter={() => handleKeyHover(key)}
                title={
                  hasNote
                    ? `${noteString} - ${notesData[noteString].title}`
                    : `Click to add a note to ${noteString}`
                }
              >
                <span className="key-label">{noteString}</span>
                {hasNote && <span className="note-indicator">•</span>}
              </div>
            );
          })}
        </div>
      </div>

      <ViewNoteModal
        isOpen={showViewModal}
        note={selectedNote}
        onClose={() => setShowViewModal(false)}
        onEdit={handleEditNote}
      />

      <EditNoteModal
        isOpen={showEditModal}
        note={selectedNote}
        onClose={() => setShowEditModal(false)}
        onNoteUpdated={handleNoteUpdated}
        onNoteDeleted={handleNoteDeleted}
      />

      <AddNoteModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedKeyForAdd(null);
        }}
        onNoteAdded={handleNoteAdded}
        preSelectedNote={
          selectedKeyForAdd ? getNoteString(selectedKeyForAdd) : undefined
        }
      />
    </>
  );
};

export default Piano;
