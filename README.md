# Gundamaxing

The definitive platform for Gunpla builders. Showcase your builds, earn your rank.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Hero Video Setup

1. Place your hero video at `public/hero.mp4`
2. Optionally place a poster image at `public/hero-poster.jpg` (used as fallback)

The video autoplays muted and loops as the landing page background. Users with `prefers-reduced-motion` enabled will see a static gradient fallback instead.

## Routes

| Route | Description |
|---|---|
| `/` | Landing page with video hero, featured builds, Build DNA teaser, workshops |
| `/builds` | Build showcase feed with filters (grade, timeline, scale, techniques, status) |
| `/builds/[id]` | Build Passport — cinematic viewer, spec sheet, build log, DNA lineage |
| `/u/[username]` | Builder profile — portfolio, badges, build gallery, threads |
| `/upload` | Upload build form with progressive disclosure (UI only) |
| `/forum` | Forum index — categories and recent threads |
| `/thread/[id]` | Thread view with nested comments |

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** — animations
- **Lucide React** — icons

## Project Structure

```
src/
  app/            # Route pages
  components/
    build/        # Build card
    landing/      # Hero, featured builds, DNA teaser, workshops
    layout/       # Navbar, footer
    ui/           # Badges, chips, skeleton
  lib/
    types.ts      # TypeScript types
    utils.ts      # cn() utility
    mock/
      data.ts     # Mock builds, users, threads, comments
      filters.ts  # Filter configuration
```

## Notes

- All data is mocked — no backend required
- Deployable on Vercel as-is
- Dark mode by default
- Mobile responsive
- Respects `prefers-reduced-motion`
