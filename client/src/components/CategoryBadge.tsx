import { Badge } from "@/components/ui/badge";
import type { Category } from "@shared/schema";
import {
  Terminal,
  Cpu,
  Package,
  Wifi,
  HardDrive,
  Settings,
  HelpCircle,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  terminal: Terminal,
  cpu: Cpu,
  package: Package,
  wifi: Wifi,
  "hard-drive": HardDrive,
  settings: Settings,
  "help-circle": HelpCircle,
};

interface CategoryBadgeProps {
  category: Category;
  showIcon?: boolean;
  className?: string;
}

export function CategoryBadge({ category, showIcon = true, className = "" }: CategoryBadgeProps) {
  const Icon = iconMap[category.icon] || HelpCircle;

  return (
    <Badge
      variant="secondary"
      className={`gap-1.5 ${className}`}
      data-testid={`badge-category-${category.slug}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{category.name}</span>
    </Badge>
  );
}
