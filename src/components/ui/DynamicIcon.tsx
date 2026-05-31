import { forwardRef, memo } from "react";
import {
  ShieldCheckIcon,
  TruckIcon,
  GiftIcon,
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  ZapIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  TagIcon,
  type IconProps,
} from "@/components/ui/icons";

const iconMap: Record<string, React.FC<IconProps>> = {
  Shield: ShieldCheckIcon,
  ShieldCheck: ShieldCheckIcon,
  Truck: TruckIcon,
  RotateCcw: TruckIcon,
  Lock: ShieldCheckIcon,
  Heart: SparklesIcon,
  Star: SparklesIcon,
  Award: ShieldCheckIcon,
  Zap: ZapIcon,
  Clock: ClockIcon,
  Package: PackageIcon,
  Headphones: PhoneIcon,
  Phone: PhoneIcon,
  Mail: MailIcon,
  MapPin: MapPinIcon,
  Tag: TagIcon,
  Gift: GiftIcon,
  Sparkles: SparklesIcon,
  CheckCircle: CheckCircleIcon,
  ThumbsUp: CheckCircleIcon,
  Gem: SparklesIcon,
};

const DynamicIcon = memo(forwardRef<SVGSVGElement, { name: string; className?: string; size?: number }>(({ name, ...props }, ref) => {
  const Icon = iconMap[name] || ShieldCheckIcon;
  return <Icon ref={ref} {...props} />;
}));
DynamicIcon.displayName = "DynamicIcon";

export default DynamicIcon;
