import { cn } from "@/lib/utils";
import logo from "@/assets/maverickmist-logo.png";

interface BrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  invert?: boolean;
}

const sizeMap = {
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
  xl: "h-16",
};

/**
 * MaverickMist brand mark — feminine luxury perfume wordmark logo.
 */
const BrandMark = ({ className, size = "md", invert = false }: BrandMarkProps) => (
  <img
    src={logo}
    alt="MaverickMist — Fragrance That You Love"
    className={cn(
      "w-auto select-none object-contain",
      sizeMap[size],
      invert && "brightness-0 invert",
      className,
    )}
    draggable={false}
  />
);

export default BrandMark;