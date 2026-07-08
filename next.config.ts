import type { NextConfig } from "next";
import { securityHeaders } from "@/lib/security-headers";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "mongodb", "bcryptjs"],
  images: {
    // AVIF puis WebP : meilleure compression que JPEG/PNG, fallback automatique.
    formats: ["image/avif", "image/webp"],
    // Cache des images optimisées 24 h côté CDN/navigateur.
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "globalsouthwatch.org" },
      { protocol: "https", hostname: "www.globalsouthwatch.org" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/connexion", destination: "/login", permanent: true },
      { source: "/inscription", destination: "/register", permanent: true },
      { source: "/a-propos", destination: "/about", permanent: true },
      { source: "/abonnement", destination: "/newsletter", permanent: true },
      { source: "/subscription", destination: "/newsletter", permanent: true },
      { source: "/mentions-legales", destination: "/legal", permanent: true },
      { source: "/confidentialite", destination: "/privacy", permanent: true },
      { source: "/cgu", destination: "/terms", permanent: true },
      { source: "/recherche", destination: "/search", permanent: true },
      { source: "/profil", destination: "/profile", permanent: true },
      { source: "/equipe", destination: "/team", permanent: true },
      { source: "/charte-editoriale", destination: "/editorial-charter", permanent: true },
      { source: "/carrieres", destination: "/careers", permanent: true },
      { source: "/espace-presse", destination: "/press", permanent: true },
      { source: "/publicite", destination: "/advertising", permanent: true },
      { source: "/accessibilite", destination: "/accessibility", permanent: true },
      { source: "/categorie/:slug", destination: "/category/:slug", permanent: true },
      { source: "/africa", destination: "/category/africa", permanent: true },
      { source: "/latin-america", destination: "/category/latin-america", permanent: true },
      { source: "/south-asia", destination: "/category/south-asia", permanent: true },
      { source: "/west-asia", destination: "/category/west-asia", permanent: true },
      { source: "/actualites", destination: "/news", permanent: true },
      { source: "/toutes-les-actualites", destination: "/news", permanent: true },
      { source: "/commentary", destination: "/category/commentary", permanent: true },
      { source: "/explainer", destination: "/category/explainer", permanent: true },
      { source: "/culture", destination: "/category/culture", permanent: true },
      { source: "/world", destination: "/category/feature", permanent: true },
      { source: "/feature", destination: "/category/feature", permanent: true },
      { source: "/investigations", destination: "/category/investigations", permanent: true },
      { source: "/special-reports", destination: "/category/special-reports", permanent: true },
      { source: "/politics", destination: "/category/politics", permanent: true },
      { source: "/health", destination: "/category/health", permanent: true },
      { source: "/technology", destination: "/category/news", permanent: true },
      { source: "/category/technology", destination: "/category/news", permanent: true },
      { source: "/category/opinion", destination: "/category/commentary", permanent: true },
      { source: "/opinion", destination: "/category/commentary", permanent: true },
      { source: "/subscribe", destination: "/newsletter", permanent: true },
      { source: "/category/actualites", destination: "/category/news", permanent: true },
      { source: "/category/politique", destination: "/category/politics", permanent: true },
      { source: "/category/technologie", destination: "/category/news", permanent: true },
      { source: "/category/sante", destination: "/category/health", permanent: true },
      { source: "/category/monde", destination: "/category/feature", permanent: true },
      { source: "/category/world", destination: "/category/feature", permanent: true },
      { source: "/multimedia", destination: "/category/multimedia", permanent: true },
      { source: "/galleries", destination: "/photo-galleries", permanent: true },
      { source: "/erasure", destination: "/right-to-erasure", permanent: true },
      { source: "/suppression-donnees", destination: "/right-to-erasure", permanent: true },
      { source: "/auteur/:slug", destination: "/author/:slug", permanent: true },
      { source: "/admin/commentaires", destination: "/admin/comments", permanent: true },
      { source: "/admin/parametres", destination: "/admin/settings", permanent: true },
      { source: "/admin/auteurs", destination: "/admin/authors", permanent: true },
      { source: "/admin/articles/nouveau", destination: "/admin/articles/new", permanent: true },
    ];
  },
  async headers() {
    if (!isProd) return [];
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
      },
    ];
  },
};

export default nextConfig;
