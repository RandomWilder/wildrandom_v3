// src/components/pools/PoolHeader.tsx
import { Lock } from 'lucide-react';
import type { PrizePool } from '@/types/pools';
import { POOL_STATUS_META } from '@/types/pools';
import { formatDate } from '@/utils/date';

interface PoolHeaderProps {
  pool: PrizePool;
  onLock?: (pool: PrizePool) => void;
}

export function PoolHeader({ pool, onLock }: PoolHeaderProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {pool.name}
            </h1>
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
              ${POOL_STATUS_META[pool.status].bgColor}
              ${POOL_STATUS_META[pool.status].color}
            `}>
              {POOL_STATUS_META[pool.status].label}
            </span>
          </div>
          {pool.description && (
            <p className="mt-1 text-sm text-gray-500">
              {pool.description}
            </p>
          )}
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>ID: <span className="font-mono">{pool.id}</span></span>
            <span>Created: {formatDate(pool.created_at)}</span>
            {pool.locked_at && (
              <span>Locked: {formatDate(pool.locked_at)}</span>
            )}
          </div>
        </div>

        {pool.status === 'unlocked' && onLock && (
          <button
            onClick={() => onLock(pool)}
            disabled={pool.total_odds !== 100 || pool.draw_win_instances === 0}
            className="inline-flex items-center px-4 py-2 rounded-lg
                     bg-indigo-600 text-white hover:bg-indigo-700 
                     transition-colors shadow-sm disabled:opacity-50
                     disabled:cursor-not-allowed"
            title={
              pool.total_odds !== 100
                ? 'Total odds must equal 100%'
                : pool.draw_win_instances === 0
                ? 'At least one draw win prize is required'
                : 'Lock pool'
            }
          >
            <Lock className="w-5 h-5 mr-2" />
            Lock Pool
          </button>
        )}
      </div>

      {pool.status === 'unlocked' && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800">
            Pool Lock Requirements
          </h3>
          <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li className={pool.total_odds === 100 ? 'text-green-700' : ''}>
              Total odds must equal 100% (currently {pool.total_odds.toFixed(1)}%)
            </li>
            <li className={pool.draw_win_instances > 0 ? 'text-green-700' : ''}>
              At least one draw win prize must be allocated (currently {pool.draw_win_instances})
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}