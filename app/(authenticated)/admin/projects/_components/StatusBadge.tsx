/**
 * StatusBadge Component
 * Displays project status with appropriate styling
 */

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300",
    archived: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-base border-2 font-medium ${
        statusColors[status.toLowerCase()] ||
        "bg-gray-100 text-gray-800 border-gray-300"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
