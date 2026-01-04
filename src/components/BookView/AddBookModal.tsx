import React, { useState } from 'react';
import styled from 'styled-components';
import { db } from '../../db';
import { FiX, FiCheck } from 'react-icons/fi';


const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 4px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

interface AddBookModalProps {
  onClose: () => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ onClose }) => {
  // const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !totalPages) return;

    try {
      await db.books.add({
        title: title.trim(),
        author: author.trim(),
        totalPages: parseInt(totalPages, 10),
        status: 'reading',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      onClose();
    } catch (error) {
      console.error('Failed to add book:', error);
      alert('Failed to add book');
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <h3>Add New Book</h3>
          <CloseButton onClick={onClose}><FiX size={20} /></CloseButton>
        </Header>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Book Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
              autoFocus
            />
          </FormGroup>
          <FormGroup>
            <Label>Author (Optional)</Label>
            <Input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Author name"
            />
          </FormGroup>
          <FormGroup>
            <Label>Total Pages</Label>
            <Input
              type="number"
              value={totalPages}
              onChange={e => setTotalPages(e.target.value)}
              placeholder="Total pages"
              required
              min="1"
            />
          </FormGroup>
          <Button type="submit">
            <FiCheck /> Register Book
          </Button>
        </Form>
      </Modal>
    </Overlay>
  );
};
