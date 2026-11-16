@AGENTS.md

# About
This product is called "Product Studio" a web-app to help product managers manage their work, stakeholders and delivery.

# Tech Stack
Backend - Supabase
Frontend - NextJS
Deployed on - Cloudflare Workers, via the OpenNext adapter (@opennextjs/cloudflare). Config is in wrangler.jsonc and open-next.config.ts. The worker name must stay "product-studio" in both places in wrangler.jsonc. Next.js must stay within the adapter's supported range (currently >=16.4.5).