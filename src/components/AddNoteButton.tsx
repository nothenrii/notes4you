import React, { useState } from 'react';
import AddNoteModal from './AddNoteModal';
import { Note } from '../types';
import './AddNoteButton.css';

interface AddNoteButtonProps {
  onNoteAdded: (note: Note) => void;
}

const AddNoteButton: React.FC<AddNoteButtonProps> = ({ onNoteAdded }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        className="add-note-button"
        onClick={() => setShowModal(true)}
        title="Add Note"
      >
        🎵
      </button>
      
      <AddNoteModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onNoteAdded={onNoteAdded}
      />
    </>
  );
};

export default AddNoteButton;