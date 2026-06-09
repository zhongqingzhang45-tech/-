import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
}

export default function StatCard({ title, value, icon, trend, gradient = 'from-primary-500/20 to-accent-500/20' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br border border-white/5 p-5 hover:scale-[1.02] transition-transform duration-200 group">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5">
            {icon}
          </div>
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${trend.isPositive ? 'text-success' : 'text-red-500'}`}>
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500">较昨日</span>
          </div>
        )}
      </div>
    </div>
  );
}
