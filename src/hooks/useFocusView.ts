import { useState, useCallback } from 'react';

export function useFocusView() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  const open = useCallback((text: string) => {
    setContent(text);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setContent('');
  }, []);

  return { isOpen, content, open, close };
}
