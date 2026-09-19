import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function renderMarkdown(content: string): React.ReactNode {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
}
