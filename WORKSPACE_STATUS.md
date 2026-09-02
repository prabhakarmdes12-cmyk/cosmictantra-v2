# COSMIC TANTRA — WORKSPACE DIRECTORY GUIDE & FOLDER LABELS
**Date**: September 2, 2026
**Latest Unified Git Commit**: `b5409c6` (on `main`, `arena/01a052e2-cosmictantra-v2`, `arena/01a06074-cosmictantra-v2`)
**Remote Repository**: `https://github.com/prabhakarmdes12-cmyk/cosmictantra-v2.git`

---

## Folder Status & Labels in `D:\Projects\`

| Directory Name | Role & Status | Git Branch / Commit | Notes |
|---|---|---|---|
| **`D:\Projects\Cosmic tantra AUGUST 2026`** | **CANONICAL ACTIVE WORKSPACE (PRIMARY)** | `arena/01a052e2-cosmictantra-v2` (`b5409c6`) | Contains local assets (`granth/`, 6.8 GB untracked). Synchronized to the latest unified commit containing both Kashi Sahayak V2 and Kundli Milan V42. |
| **`D:\Projects\cosmictantra-release-review`** | **VERIFIED CLEAN BUILD & REVIEW WORKSPACE (SECONDARY)** | `main` (`b5409c6`) | Clean working tree used for continuous integration, Playwright e2e test execution, and production Next.js build verification. Fully synchronized with remote `main`. |
| **`D:\Projects\cosmictantra-scholar-review`** | **HISTORICAL REVIEW FOLDER (ARCHIVAL)** | `arena/01a05d51-cosmictantra-v2` | Preserved for earlier V40.1 Scholar review testing. Do not use for current development. |
| **`D:\Projects\CosmicTantra-main`** | **STATIC BACKUP / UNVERSIONED** | Non-git archive | Static snapshot backup. |

---

## How to Resume Work in Any Folder

Both **`Cosmic tantra AUGUST 2026`** and **`cosmictantra-release-review`** are synchronized at commit `b5409c6`:
1. If you are developing locally with the granth reader: use **`D:\Projects\Cosmic tantra AUGUST 2026`**.
2. If you are doing clean automated testing, reviews, or builds: use **`D:\Projects\cosmictantra-release-review`**.
3. Live production on GitHub is tracked directly by branch **`main`** at commit `b5409c6`.
