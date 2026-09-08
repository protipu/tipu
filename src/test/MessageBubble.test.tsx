import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble } from '../components/chat/MessageBubble';
import type { Message } from '../types/chat';

describe('MessageBubble', () => {
  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello Tipu',
    createdAt: new Date().toISOString(),
  };

  const assistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Hey there! How can I help?',
    createdAt: new Date().toISOString(),
  };

  it('renders user message correctly', () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText('Hello Tipu')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<MessageBubble message={assistantMessage} />);
    expect(screen.getByText('Hey there! How can I help?')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const errorMessage: Message = {
      id: '3',
      role: 'assistant',
      content: 'Error: Something went wrong',
      createdAt: new Date().toISOString(),
      error: true,
    };
    render(<MessageBubble message={errorMessage} />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders retrying state', () => {
    const retryingMessage: Message = {
      id: '4',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      retrying: true,
    };
    render(<MessageBubble message={retryingMessage} />);
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });

  it('does not render empty non-retrying messages', () => {
    const emptyMessage: Message = {
      id: '5',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    const { container } = render(<MessageBubble message={emptyMessage} />);
    expect(container.firstChild).toBeNull();
  });
});