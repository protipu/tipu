interface WorkspaceHeaderProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function WorkspaceHeader({ title = "Tipu's Workspace", subtitle, right }: WorkspaceHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'var(--font-serif)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-white/30 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0 ml-3">{right}</div>}
    </div>
  );
}
