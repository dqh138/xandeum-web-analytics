import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatsCard({ label, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const colorStyles = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    green: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm bg-gradient-to-br transition-all hover:shadow-lg",
        colorStyles[color]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-100">{value}</h3>
          {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
        </div>
        <div className={cn("rounded-lg p-3 bg-white/5", colorStyles[color].split(' ')[3])}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}
