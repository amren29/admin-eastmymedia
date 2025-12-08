
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BLOG_POSTS = [
    {
        title: "The Complete Guide to Outdoor Advertising in Sabah (2025 Edition)",
        slug: "outdoor-advertising-sabah-guide-2025",
        excerpt: "Everything you need to know about billboard advertising in East Malaysia—from high-impact locations and pricing to AI-powered planning and cultural strategies for maximum campaign success.",
        date: "2025-11-20",
        author: "Eastmy Media",
        category: "Guide",
        image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800",
        status: "published",
        content: `
# Introduction

Outdoor advertising in East Malaysia has expanded rapidly over the past decade as brands compete for visibility in a culturally diverse market with high mobile traffic and unique geographical landscapes. Whether promoting retail, tourism, FMCG, or government campaigns, Sabah offers a dynamic environment for OOH (Out-of-Home) exposure. With key urban hubs like Kota Kinabalu, Sandakan, and Tawau — plus rural highways with strong vehicle movement — the opportunities to reach Sabahan audiences are tremendous. This guide explains how OOH works in Sabah, why it performs differently from other states, and how brands can leverage it for maximum impact.

# Understanding the Sabah Market Landscape

Sabah stands out for its multi-ethnic communities, multilingual culture, and diverse lifestyle patterns. Unlike Kuala Lumpur where traffic is dense and predictable, Sabah's traffic flow varies based on tourism seasons, township layouts, and community-driven commerce. Brands that succeed here often focus on emotional connection, cultural tone, and relatable communication.

> **Tip:** OOH ads that feel friendly, local, and Sabahan-driven tend to attract more attention. Using Sabahan slang, humor, or imagery can significantly increase recall and engagement.

# Types of Billboards & OOH Formats in Sabah

Sabah offers a wide range of outdoor media formats suitable for various marketing objectives:

*   **Static Billboards (Most Common):** Found along major roads, highways, and town entrances. Ideal for consistent brand visibility.
*   **Digital Billboards (LED):** Growing mostly in Kota Kinabalu city areas. Allows animated visuals and rotating content.
*   **Unipoles:** Large, high-impact structures typically located along highways or long-distance roads.
*   **Building Wraps:** Perfect for crowded commercial hotspots; delivers massive visual impact.
*   **LED Screens:** Less widespread compared to Klang Valley, but still valuable in KK, Putatan, and Penampang.

# High-Impact OOH Locations in Sabah

## Kota Kinabalu (KK) — No.1 Strategic Hub
KK combines tourism, business districts, and heavy local traffic. High-performing zones include:
*   KK City Centre
*   Lintas
*   Damai
*   Luyang
*   Penampang
*   Putatan

## Sandakan
Strong along ring roads and key town entrances — ideal for FMCG and public campaigns.

## Tawau
Effective for agriculture, industrial markets, and cross-border consumer segments.

## Major Highways
Routes like KK–Beaufort and Tuaran–Kudat offer excellent long-distance brand exposure.

# Why Outdoor Advertising in Sabah is Highly Effective

OOH in Sabah performs exceptionally well due to:
*   High visibility
*   Steady daily traffic
*   Lower digital noise compared to metropolitan areas
*   Longer time spent on the road
*   Strong community-based word-of-mouth

A striking billboard often becomes a talking point among locals. OOH is highly effective for brand awareness, retail direction, tourism promotions, events, and government messaging.

# Cost & Budgeting for Billboard Advertising in Sabah

Pricing varies based on:
*   Location (prime city areas vs. suburban/rural)
*   Size and format
*   Traffic volume
*   Lighting inclusion
*   Structure type (static, unipole, LED, wrap)

City-centre billboards cost more due to high exposure. Unipoles are premium due to their size and long-range visibility. Suburban or rural boards are more affordable and great for long-term branding.

> **Tip:** Brands often combine multiple boards across KK, Sandakan, Tawau, and northern/southern districts for full regional coverage.

# How to Plan an Effective OOH Campaign in Sabah

To succeed, you need to understand:
1.  **Your Target Audience:** Tourists, daily commuters, families, business owners, or rural communities.
2.  **High-traffic routes:** Identify areas with consistent movement patterns.
3.  **The right format:** Static, unipole, LED, building wrap, or directional signage.
4.  **Strong creative design:** Use bold colours, short text, and culturally relevant elements. Sabahan-friendly designs perform significantly better.

# The Role of AI in Modern OOH Advertising

AI is transforming outdoor advertising in East Malaysia. Using AI-powered tools like Eastmy Media's platform, brands can:
*   Analyse traffic data
*   Understand audience behaviour
*   Predict location performance
*   Match billboard sites to specific industries
*   Reduce media wastage
*   Optimise budgets with data-driven recommendations

As AI evolves, OOH planning will become more precise and ROI-focused.

# Conclusion

Sabah's OOH landscape presents massive opportunities for brands aiming to build strong regional presence. With strategic location choices, culturally aligned creative design, and AI-powered planning tools, campaign performance can improve dramatically. As the market continues to expand, outdoor advertising remains one of Sabah's most trusted and impactful marketing channels — offering real-world visibility that digital media alone cannot match.
        `
    },
    {
        title: "Why Billboard Advertising Still Works in 2025: The Sabah Perspective",
        slug: "why-billboards-still-matter-2025",
        excerpt: "Despite the rise of digital marketing, billboards continue to dominate as a powerful advertising medium. Discover why OOH remains essential for brand visibility, trust-building, and local impact in Sabah.",
        date: "2025-11-20",
        author: "Eastmy Media",
        category: "Industry Insights",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800",
        status: "published",
        content: `
# Introduction

In a world dominated by digital screens and social media, many people assume that traditional advertising — especially billboards — is losing relevance. But in Sabah, the opposite is true. Billboard advertising continues to be one of the strongest, most reliable, and most cost-effective marketing channels for brands. With high mobility, strong community culture, and large daily traffic across key roads, billboards remain a powerful way to capture real-world attention in 2025.

# Billboards Deliver Guaranteed Visibility

One major reason billboards perform well in Sabah is simple: people are always on the road. From Kota Kinabalu to Sandakan to Tawau, thousands of commuters, tourists, and local families pass major roads every single day. Unlike digital ads that can be skipped, ignored, or blocked, billboard exposure is guaranteed — every driver and passenger sees it.

> **Highlight:** In high-traffic areas like Lintas, Penampang, Putatan, KK City Centre, and Batu 5 Sandakan, a single billboard can generate tens of thousands of impressions daily.

# Sabah's Road Structure Makes OOH More Effective

Sabah's urban layout and long-route highways create natural funnels where billboards stand out even more. For example:
*   KK Outer Ring Road naturally channels continuous vehicle flow
*   The Sandakan Ring Road gives advertisers extended visibility
*   Tawau's main commercial corridor captures both business and cross-border buyers
*   Long stretches like KK–Beaufort or Tamparuli–Kudat give brands extended viewing time

Because of these road patterns, billboards maintain attention for longer than those in rush-hour-heavy cities like KL.

# Cultural Connection Increases Ad Impact

Sabahans love things that feel familiar, friendly, and local. Billboards with Sabahan tone, local humour, or culturally relevant visuals often perform better because they feel more relatable. When an advertisement resonates emotionally, people remember it longer.

Examples:
*   Short phrases in Sabahan slang
*   Visuals showing local scenery or lifestyle
*   Bright colours and bold layouts
*   Friendly, community-based messaging

This emotional connection gives billboards a natural advantage over generic, nationwide digital ads.

# Billboards Build Trust and Brand Authority

In Sabah, people trust brands they see often — especially those that appear consistently in the same high-traffic locations. A billboard acts like a physical stamp of credibility. When customers repeatedly pass by your billboard, your brand becomes familiar and trustworthy.

Industries that benefit:
*   Retail stores
*   Property developers
*   FMCG brands
*   Clinics and health services
*   Restaurants and cafés
*   Tourism operators

High exposure locations like KK City, Donggongon, Inanam, and Sandakan Mile 4 can establish brand authority quickly.

# Longer Viewing Time = Higher Recall

Digital ads last seconds. Billboards last weeks or months, staying visible day and night. This long exposure gives customers plenty of time to absorb the message. In Sabah — where traffic may move slower and routes are long — the viewing duration becomes even more valuable. Brands gain high recall rates simply by being present along major travel paths.

# Perfect for Tourists and Local Audiences

Sabah's tourism sector makes billboards even more effective. Visitors from West Malaysia, Singapore, China, Korea, and Europe often rely on visual cues and directional ads. Billboards help them:
*   Discover attractions
*   Find restaurants
*   Locate hotels
*   Identify retail stores
*   Learn about local products

Meanwhile, locals travelling daily also absorb the same brand messages, giving campaigns dual impact.

# Cost-Effective for Both Short and Long Campaigns

Billboards in Sabah generally cost less than major cities like KL or Penang — but deliver equally strong (or even stronger) visibility. This creates excellent value for:
*   Short-term promotions (festivals, sales, launches)
*   Long-term branding (3–12 months)
*   Seasonal tourism campaigns
*   Road safety or government awareness campaigns

> **Tip:** Rural or suburban billboards are even more affordable and often stay less cluttered, making them perfect for long-term coverage.

# The Boost from AI-Enhanced OOH Planning

In 2025, AI technology is transforming how businesses plan billboard campaigns. Platforms like Eastmy Media's AI system help advertisers:
*   Analyse traffic flow and peak hours
*   Identify audience demographics around each billboard
*   Predict the best locations for specific industries
*   Estimate impression value
*   Avoid low-performing placements
*   Maximize ROI through data-backed recommendations

AI ensures every billboard ringgit is invested wisely — with clear results.

# Conclusion

Billboards remain one of the most effective marketing tools in Sabah for 2025 and beyond. With strong visibility, local cultural relevance, guaranteed traffic, and the new advantage of AI planning, outdoor advertising continues to outperform many digital channels. For businesses hoping to grow brand awareness across Sabah, billboard advertising remains a powerful and reliable strategy that delivers real, measurable impact.
        `
    },
    {
        title: "Why OOH Advertising Still Works in a Digital World",
        slug: "why-ooh-advertising-works-digital-world",
        excerpt: "In an era of digital saturation, Out-of-Home (OOH) advertising cuts through the noise. Learn how physical presence combined with digital strategy creates the ultimate marketing mix.",
        date: "2025-11-25",
        author: "Eastmy Media",
        category: "Strategy",
        image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=800",
        status: "published",
        content: `
# Introduction

As digital marketing costs rise and ad fatigue sets in, brands are rediscovering the power of Out-of-Home (OOH) advertising. It's not about choosing between digital and physical—it's about how they work together.

# The Digital Fatigue Problem

Consumers are bombarded with thousands of digital ads daily. Ad blockers are on the rise, and attention spans are shrinking. OOH offers a refreshing alternative: it's unskippable, unblockable, and part of the real world.

# Trust and Credibility

Physical presence implies stability and legitimacy. A brand that can afford a billboard is perceived as established and trustworthy. This "real-world" credibility often translates to higher conversion rates on digital channels.

# The Halo Effect

Studies show that OOH campaigns increase the effectiveness of digital channels. When people see a brand on a billboard, they are more likely to click on a digital ad for that same brand later. This "priming" effect is a powerful tool for marketers.

# Hyper-Local Targeting

OOH allows for precise geographic targeting. You can place ads near your store, near competitors, or in specific neighborhoods. This context relevance drives action.

# Conclusion

OOH is not a relic of the past; it's a vital component of a modern, omnichannel marketing strategy. By combining the reach and impact of OOH with the precision of digital, brands can achieve superior results.
        `
    }
];

async function seed() {
    console.log("Starting seed...");
    try {
        const postsCollection = collection(db, 'posts');
        let addedCount = 0;

        for (const post of BLOG_POSTS) {
            const q = query(postsCollection, where("slug", "==", post.slug));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log(`Skipping existing: ${post.title}`);
                continue;
            }

            await addDoc(postsCollection, {
                ...post,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log(`Added: ${post.title}`);
            addedCount++;
        }
        console.log(`Seed complete. Added ${addedCount} posts.`);
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
}

seed();
