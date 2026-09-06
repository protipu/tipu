export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  error?: boolean;
  retrying?: boolean;
}

export interface SendMessageResult {
  message: Message;
  error?: string;
}