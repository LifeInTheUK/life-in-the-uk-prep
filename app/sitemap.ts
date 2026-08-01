import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/config";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: SITE_URL,
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${SITE_URL}/questions`,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/changelog`,
            changeFrequency: "weekly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/privacy`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/terms`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];
}
