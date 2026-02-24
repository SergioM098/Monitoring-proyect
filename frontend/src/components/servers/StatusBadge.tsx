const statusConfig: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  up: { dot: 'bg-green-400', bg: 'bg-green-400/10', text: 'text-green-400', label: 'Operativo' },
  down: { dot: 'bg-red-400', bg: 'bg-red-400/10', text: 'text-red-400', label: 'Caido' },
  degraded: { dot: 'bg-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400', label: 'Lento' },
  unknown: { dot: 'bg-gray-400', bg: 'bg-gray-400/10', text: 'text-gray-400', label: 'Desconocido' },
};

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
  const config = statusConfig[status] || statusConfig.unknown;

  if (size === 'lg') {
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
        <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </span>
  );
}
