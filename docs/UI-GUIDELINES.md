# UI Guidelines

## Aesthetic
- **Style**: Modern, minimal, premium, glassmorphism-inspired.
- **Inspiration**: Apple, Linear, Arc Browser, Notion, Jago Bank, Monzo.
- **Avoid**: Corporate dashboards, heavy borders, cluttered navigation.

## Typography
- **Primary Font**: Inter (clean, versatile, legible).
- **Secondary/Display Font**: Space Grotesk (for headers or numbers, if needed) or just stick to Inter.

## Colors
- **Background**: Soft off-whites (#FAFAFA, #F5F5F5) for light mode, or deep charcoal grays for dark mode. Let's aim for a clean light/dark mode setup utilizing shadcn/ui defaults (Zinc or Slate).
- **Accents**: Subtle colors for categories (e.g., soft green for income, soft red for expenses, soft blue for transfers).
- **Cards**: White with subtle drop shadows (`shadow-sm` or `shadow-[0_2px_10px_rgba(0,0,0,0.05)]`) and subtle borders (`border-gray-100`).

## Components
- **Buttons**: Minimal, rounded corners (`rounded-lg` or `rounded-full`).
- **Inputs**: Clean, with focus rings.
- **Animations**: Use `motion` for smooth layout transitions and simple hover states.
