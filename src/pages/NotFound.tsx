import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { BeamsBackground } from "@/components/ui/beams-background";

const NotFound = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <BeamsBackground intensity="medium" />
      <div className="relative text-center max-w-md">
        <div className="text-7xl sm:text-8xl font-bold text-primary/30 mb-4 tabular-nums">404</div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.35)]"
        >
          <ArrowLeftIcon size={16} /> Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
