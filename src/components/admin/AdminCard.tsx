// src/components/admin/AdminCard.tsx
interface AdminCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminCard({ title, children, className = '' }: AdminCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}