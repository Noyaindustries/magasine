import Link from "next/link";
import { BrandLogo } from "@/components/site-chrome/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <BrandLogo variant="auth" />
      <h1 className="font-serif text-6xl font-bold text-charcoal mt-10 mb-4">404</h1>
      <p className="text-xl text-muted mb-2">Page not found</p>
      <p className="text-sm text-muted max-w-md mb-8">
        The article or page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-charcoal text-white text-sm rounded-sm hover:bg-charcoal/90 transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 border border-border text-charcoal text-sm rounded-sm hover:bg-muted-bg transition-colors"
        >
          Search for an article
        </Link>
      </div>
    </div>
  );
}
