import { cn } from "@/lib/utils";
import logo from "@/assets/gothic-vault-logo.png";

interface BrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  invert?: boolean;
}

const sizeMap = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

/**
 * Gothic Vault brand mark — dark luxury gothic accessories emblem.
 */
const BrandMark = ({ className, size = "md", invert = false }: BrandMarkProps) => (
  <img
    src={logo}
    alt="Gothic Vault — Goth Accessories"
    className={cn(
      "w-auto select-none object-contain",
      sizeMap[size],
      "drop-shadow-[0_0_18px_rgba(180,150,230,0.35)]",
      invert && "brightness-0 invert",
      className,
    )}
    draggable={false}
  />
);

export default BrandMark;
