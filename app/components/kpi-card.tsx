interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
}

export function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <p className="text-sm text-slate-600 mb-2">{title}</p>
      <p className="text-4xl font-semibold text-forest-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
