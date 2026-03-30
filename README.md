# Eastmy Media — Admin Panel

The management dashboard for the Eastmy Media OOH advertising platform. Admins use this panel to manage billboard inventory, proposals, customers, blog posts, packages, and system settings.

## About

This admin panel is the backend management interface for Eastmy Media. It provides full CRUD operations for all platform data, role-based access control, and business tools like proposal generation, PDF export, traffic analytics, and media backup.

## Features

- **Dashboard** — Overview with stats (total media, proposals, customers, estimated revenue) and recent activity
- **Media Inventory** — Add, edit, delete billboards with GPS coordinates, rental rates, image uploads, traffic profiles, and approval workflows (draft → pending → published)
- **Proposals** — Create client proposals, attach billboards, generate PDF downloads, track status (new → contacted → closed)
- **Customers** — Manage client database with company details, registration forms, and proposal history
- **Blog Management** — Create and edit blog posts with markdown support and image uploads
- **Packages** — Bundle billboards into discounted packages with validity periods
- **Settings** — Configure branding, contact info, social links, hero content, and feature toggles
- **User Management** — Role-based access (Administrator, Director, Manager, Sales, Admin) with signup approval workflow
- **Reports** — AI-generated traffic analytics with hourly breakdown charts and campaign performance
- **Media Backup** — Export/import billboard inventory as JSON, bulk operations
- **Excel Import/Export** — Bulk import billboards from XLSX/CSV files

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (image uploads)
- **Auth:** Supabase Auth (email/password with OTP verification)
- **Email:** Nodemailer (Hostinger SMTP) for OTP and notifications
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **Maps:** Mapbox GL + react-map-gl
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Deployment:** Vercel

## User Roles

| Role | Permissions |
|------|------------|
| Administrator | Full access, approve/reject users and media, delete operations, view financials |
| Director | View financials, manage proposals and customers |
| Chief | View financials, manage proposals |
| Manager | View financials, manage proposals |
| Sales | Create proposals, view customers |
| Admin (Basic) | Basic read access |

## Architecture

This panel writes data to Supabase, which the public frontend reads from.

```
Admin Panel (write) → Supabase ← Frontend (read)
```
