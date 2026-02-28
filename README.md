# SummitStone CRM — Construction Operations Platform

A full-stack Next.js 14 CRM built for SummitStone Developments. Supabase backend with real-time data, Row Level Security, and role-based access control.

---

## What's Included

- **Dashboard** — Live KPIs, active projects, alerts, activity feed
- **Project Pipeline** — Kanban board across 6 stages
- **Budget & Forecasting** — Multi-currency (USD/BBD/TTD/JMD/KYD), variance tracking
- **Payment Schedules** — Milestone-based disbursement monitoring
- **Change Orders** — Full CO log with approval workflow
- **Procurement** — Multi-island import & logistics tracker
- **Contractors** — Performance scoring system (0–100)
- **Site Logs** — Daily field documentation with weather & safety
- **Permits & Approvals** — Island-by-island government workflow tracking
- **Investor Portal** — Read-only reporting view
- **Risk Heatmap** — 5×5 likelihood/impact matrix
- **Documents** — Role-based file storage with Supabase Storage

---

## Deploy in 3 Steps

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, give it a name (e.g. `summitstone-crm`) and set a database password
3. Wait ~2 minutes for the project to provision
4. In your Supabase project, go to **SQL Editor** → **New Query**
5. Paste the entire contents of `supabase-schema.sql` into the editor
6. Click **Run** — this creates all tables, RLS policies, and loads sample data
7. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — Push to GitHub

1. Create a new GitHub repository (e.g. `summitstone-crm`)
2. Extract this project folder and push to GitHub:
   ```bash
   cd summitstone-crm
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/summitstone-crm.git
   git push -u origin main
   ```

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `summitstone-crm` repository
4. Under **Framework Preset** select **Next.js** (auto-detected)
5. Under **Environment Variables** add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = [your Supabase project URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your Supabase anon key]
   ```
6. Click **Deploy** — takes about 60 seconds

Your CRM will be live at `https://summitstone-crm-xxxx.vercel.app`

### Step 4 — Set Auth Redirect URL in Supabase

1. In Supabase, go to **Authentication → URL Configuration**
2. Under **Site URL**, enter your Vercel domain:
   `https://summitstone-crm-xxxx.vercel.app`
3. Under **Redirect URLs**, add:
   `https://summitstone-crm-xxxx.vercel.app/auth/callback`
4. Click **Save**

---

## Create Your First Admin User

1. In Supabase, go to **Authentication → Users**
2. Click **Add User → Create New User**
3. Enter your email and password
4. Click **Create User**
5. Now go to **SQL Editor** and run this to make them admin:
   ```sql
   UPDATE profiles
   SET role = 'admin', full_name = 'Your Name'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```
6. Sign in at `https://your-domain.vercel.app/auth/login`

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access to everything |
| `director` | Full access except user management |
| `project_manager` | Projects, site logs, procurement, permits |
| `engineer` | Site logs, documents (engineers+), milestones |
| `investor` | Investor portal, read-only project data |
| `viewer` | Read-only access to basic data |

To set a user's role, run in SQL Editor:
```sql
UPDATE profiles SET role = 'project_manager' WHERE id = 'user-uuid-here';
```

---

## Add More Users

1. Supabase Auth → Users → Add User
2. Set their role via SQL as shown above
3. They log in at `/auth/login`

---

## Custom Domain (Optional)

1. In Vercel, go to your project → **Settings → Domains**
2. Add your domain (e.g. `crm.summitstonedevelopments.com`)
3. Point your DNS CNAME record to `cname.vercel-dns.com`
4. SSL certificate is provisioned automatically
5. Update the Supabase Site URL and Redirect URL to your new domain

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/summitstone-crm.git
cd summitstone-crm

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
# Open http://localhost:3000
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with SSR
- **Styling:** Tailwind CSS + custom CSS variables
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel
