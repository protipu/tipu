import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageInput } from '../components/chat/MessageInput';

describe('MessageInput', () => {
  it('renders with default placeholder', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Message Tipu...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<MessageInput onSend={vi.fn()} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('calls onSend when form is submitted', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    
    const input = screen.getByPlaceholderText('Message Tipu...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not call onSend with empty message', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    
    const input = screen.getByPlaceholderText('Message Tipu...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<MessageInput onSend={vi.fn()} disabled={true} />);
    expect(screen.getByPlaceholderText('Message Tipu...')).toBeDisabled();
  });
});