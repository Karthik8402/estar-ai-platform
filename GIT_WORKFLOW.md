# ePharmic AI Platform — Team Git Workflow

## Repo Structure (Monorepo)

```
epharmic-ai-platform/
├── landing-page/           ← Shared frontend (React + Vite)
├── services/
│   ├── audit-trail-service/       ← MS1 (Karthik)
│   ├── stability-testing-service/ ← MS2 (Team Member B)
│   ├── oot-detection-service/     ← MS3 (Team Member C)
│   └── data-entry-service/        ← MS4 (Team Member D)
├── shared/                 ← Shared contracts & types
├── docker-compose.yml
└── .gitignore
```

---

## Step 1: Create Remote Repo (GitHub)

1. Go to [github.com/new](https://github.com/new)
2. Name: `epharmic-ai-platform`
3. Set to **Private**, don't add README (we already have code)
4. Click **Create repository**
5. Then push your local repo:

```bash
git remote add origin https://github.com/YOUR_USERNAME/epharmic-ai-platform.git
git branch -M main
git push -u origin main
```

---

## Step 2: Invite Team Members

GitHub → Repo → **Settings** → **Collaborators** → **Add people**

Add each team member by their GitHub username or email.

---

## Step 3: Branching Strategy

We use **feature branches** — nobody pushes directly to `main`.

```
main  ─────────────────────────────────────────────►
  │
  ├── feat/ms1-audit-dashboard     (Karthik)
  ├── feat/ms2-stability-testing   (Member B)
  ├── feat/ms3-oot-detection       (Member C)
  └── feat/ms4-data-entry          (Member D)
```

### Branch Naming Convention

| Type    | Pattern                        | Example                          |
|---------|--------------------------------|----------------------------------|
| Feature | `feat/ms1-short-description`   | `feat/ms1-audit-dashboard`       |
| Bugfix  | `fix/ms1-short-description`    | `fix/ms1-anomaly-filter-crash`   |
| Hotfix  | `hotfix/short-description`     | `hotfix/login-redirect`          |

---

## Daily Workflow for Each Team Member

### 1. Clone (first time only)

```bash
git clone https://github.com/YOUR_USERNAME/epharmic-ai-platform.git
cd epharmic-ai-platform
```

### 2. Create your feature branch

```bash
git checkout -b feat/ms1-audit-dashboard
```

### 3. Work → Stage → Commit

```bash
# After making changes:
git add .
git commit -m "feat(ms1): add anomaly table with filtering"
```

#### Commit Message Format

```
type(scope): short description

type  = feat | fix | docs | style | refactor | test
scope = ms1 | ms2 | ms3 | ms4 | landing | shared
```

**Examples:**
- `feat(ms1): add agent control panel`
- `fix(ms2): fix stability chart rendering`
- `docs(shared): update API contract`

### 4. Push your branch

```bash
git push origin feat/ms1-audit-dashboard
```

### 5. Create a Pull Request (PR)

On GitHub → Click **"Compare & pull request"** → Select `main ← feat/ms1-audit-dashboard`

- Add a description of what changed
- Request review from at least one teammate
- After approval → **Merge** into `main`

### 6. Stay up to date with `main`

Before starting new work each day:

```bash
git checkout main
git pull origin main
git checkout feat/ms1-your-branch
git merge main
```

If there are **merge conflicts**, resolve them in your editor, then:

```bash
git add .
git commit -m "merge: resolve conflicts with main"
```

---

## Golden Rules

| Rule | Why |
|------|-----|
| **Never push directly to `main`** | Use PRs so others can review |
| **Pull `main` before starting new work** | Avoids big merge conflicts |
| **Each person works in their own `services/` folder** | Minimizes conflicts |
| **Small, frequent commits** | Easier to review and revert |
| **Don't commit `node_modules/`, `.env`, or `dist/`** | Already in `.gitignore` |

---

## Quick Reference Card

```bash
# Morning routine
git checkout main
git pull origin main
git checkout feat/ms1-your-feature
git merge main

# During work
git add .
git commit -m "feat(ms1): description"

# End of day
git push origin feat/ms1-your-feature

# After PR is merged
git checkout main
git pull origin main
git branch -d feat/ms1-old-branch    # clean up
```
