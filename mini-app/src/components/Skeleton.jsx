/**
 * Skeleton Loading Components
 * Provides various skeleton shapes for loading states
 */

/**
 * Base skeleton element with shimmer animation
 */
export function SkeletonBox({ className = '', width, height }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className="h-4"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for pool card
 */
export function SkeletonPoolCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3">
      {/* Pool name */}
      <div className="flex items-center justify-between mb-3">
        <SkeletonBox className="h-6 w-32" />
        <SkeletonBox className="h-5 w-16" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <SkeletonBox className="h-3 w-12 mb-1" />
          <SkeletonBox className="h-5 w-20" />
        </div>
        <div>
          <SkeletonBox className="h-3 w-12 mb-1" />
          <SkeletonBox className="h-5 w-20" />
        </div>
        <div>
          <SkeletonBox className="h-3 w-12 mb-1" />
          <SkeletonBox className="h-5 w-20" />
        </div>
      </div>

      {/* APR badge */}
      <SkeletonBox className="h-8 w-24 rounded-full" />
    </div>
  );
}

/**
 * Skeleton for pool list
 */
export function SkeletonPoolList({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPoolCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for calculation results
 */
export function SkeletonResults() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      {/* Title */}
      <SkeletonBox className="h-6 w-48 mb-4" />

      {/* Result cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <SkeletonBox className="h-4 w-24 mb-2" />
            <SkeletonBox className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Skeleton for comparison table
 */
export function SkeletonComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {Array.from({ length: 5 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <SkeletonBox className="h-5 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: 3 }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: 5 }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <SkeletonBox className="h-5 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton for chart
 */
export function SkeletonChart({ height = '400px' }) {
  return (
    <div className="bg-white rounded-lg p-6">
      {/* Chart title */}
      <SkeletonBox className="h-6 w-48 mb-4" />

      {/* Chart area */}
      <div style={{ height }} className="relative">
        <SkeletonBox className="h-full w-full rounded" />

        {/* Fake axis lines */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300" />
        <div className="absolute top-0 left-0 w-px h-full bg-gray-300" />
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBox className="h-3 w-3 rounded-full" />
            <SkeletonBox className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for history entries
 */
export function SkeletonHistoryEntry() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-full" />
      </div>
    </div>
  );
}

export function SkeletonHistoryList({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonHistoryEntry key={i} />
      ))}
    </div>
  );
}
