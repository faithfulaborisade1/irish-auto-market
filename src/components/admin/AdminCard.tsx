// src/components/admin/AdminCard.tsx
interface AdminCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminCard({ title, children, className = '' }: AdminCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}