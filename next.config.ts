import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de perfil y de productos guardadas en Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // El Marketplace ahora es su propia sección: los enlaces viejos (notificaciones, favoritos) siguen funcionando.
  async redirects() {
    return [
      { source: "/directorio/marketplace", destination: "/marketplace", permanent: true },
      { source: "/directorio/mis-publicaciones", destination: "/marketplace/mis-publicaciones", permanent: true },
      { source: "/directorio/marketplace/:path*", destination: "/marketplace/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
