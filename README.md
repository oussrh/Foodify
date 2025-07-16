# Foodify - AR Menu Platform

Foodify is a prototype web platform that helps restaurants present their menus in Augmented Reality. Guests can scan a QR code to view 3D dishes while restaurant administrators manage content through a dashboard.

## Project Goals
- Display dishes in AR using web technologies
- Provide a dashboard for restaurants to manage menus and analytics
- Support multi-language content in English and French

## Tech Stack
- Next.js 15 with React 19 and TypeScript
- Tailwind CSS with shadcn/ui components
- PostgreSQL via Prisma ORM
- NextAuth for authentication
- Framer Motion, React Hook Form, Zod, and Lucide icons

## Development
Install dependencies and run the development server:
```bash
pnpm install
pnpm dev
```

The project uses Tailwind CSS with class-based dark mode. Toggle the theme using the sun/moon button on the home page.

## UI Components
Foodify uses reusable UI components from [shadcn/ui]. The following pieces are prepared in `components/ui`:

| UI Piece | Shadcn Component(s) |
| --- | --- |
| Buttons | `Button` |
| Cards | `Card` |
| Modals / Drawers | `Dialog`, `Sheet` |
| Inputs | `Input`, `Textarea`, `Select` |
| Alerts | `Alert`, `AlertDialog` |
| Menus | `DropdownMenu` |
| Notifications | `Toast` |
| Loading states | `Skeleton`, `Spinner` |
| Tooltips | `Tooltip` |
| Tabs | `Tabs` |
| Forms | `Input` + `Label` + `Button` |
| Avatars | `Avatar` |
| Badges | `Badge` |

This repository currently contains minimal scaffolding. More features will be added over time.

## Menu Management

Restaurant admins can manage menu categories and subcategories from `/admin/restaurants/[id]/menu`. Categories support inline editing, deletion with confirmation and drag-and-drop reordering using the built-in HTML5 API. Subcategories can be reordered using Up/Down buttons.
