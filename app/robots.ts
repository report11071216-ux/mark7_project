import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mypage", "/guild"],
    },
    sitemap: "https://clayloa.com/sitemap.xml",
  };
}
