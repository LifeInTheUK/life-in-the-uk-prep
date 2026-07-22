import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/config";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/test", "/review", "/profile"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
