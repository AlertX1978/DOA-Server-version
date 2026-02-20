# TAQA DOA Reader & Calculator

## Project Overview

Single-file React web application for navigating and calculating TAQA's Delegation of Authority (DOA) matrix. Helps employees understand approval requirements for corporate transactions across 14 organizational domains.

**Main file**: `doa-reader-v4_0.1w.html` (~2,800 lines)

## Architecture

This is a **standalone single-file HTML application** — no build tools, no package manager, no bundler. Everything lives in one HTML file for maximum portability.

### Structure within the HTML file

1. `<head>` — CDN script tags (React, ReactDOM, Babel)
2. `<style>` — Utility-first CSS classes + theme definitions
3. `<script id="browse-doa-data">` — Embedded DOA matrix JSON data
4. `<script type="text/babel">` — React components and application logic

### Key Components

- **App** — Root component, manages all state via React hooks
- **Calculator Tab** — Determines required approval level based on contract value, CAPEX, country risk, etc.
- **Browser Tab** — Search and browse the full DOA matrix by category/subcategory
- **SettingsPanel** — Modal for configuring safe countries, validation flags, etc.
- **Help Tab** — Documents approval action types and chains

### State Management

React hooks (`useState`, `useEffect`) with localStorage persistence for:
- Theme preference (dark/light)
- Settings (safe countries, special countries, validation flags)
- Form state (contract values, country selection, margins)

### Key Algorithms

- `parseActionToken()` — Parses approval action codes (X, R, E, I, N with numeric levels)
- `normalizeAndSortApprovers()` — Orders approval chains by priority (I→R→E→X→N)
- `validateDOAData()` — Data quality diagnostics

## Conventions

### Naming

- **JavaScript**: camelCase for functions/variables, UPPERCASE for constants, PascalCase for React components
- **HTML IDs**: kebab-case (e.g., `browse-doa-data`)
- **CSS**: Utility-first classes similar to Tailwind (flex, grid, text-xs, p-4)

### Constants

```
COLORS — Theme color palette (primary: #006B6B, accent: #E86A2C)
DEFAULT_SAFE_COUNTRIES — List of TAQA operating countries
GROUP_PRIORITY — Approval action ordering { I: 0, R: 1, E: 2, X: 3, N: 4 }
DOA_DATA.categories — 14 corporate function categories
```

### Action Token Format

Approval actions follow the pattern `[IREXN]\d*\*?` where:
- **I** = Initiate, **R** = Review, **E** = Endorse, **X** = Approve, **N** = Notify
- Optional number = approval level
- Optional `*` = conditional

## Dependencies

All loaded via CDN `<script>` tags — no npm/node:
- React
- ReactDOM
- Babel Standalone (for JSX transpilation in-browser)

## Data Sources

- Embedded JSON in `<script id="browse-doa-data">`
- Excel source files: `Final TAQA New DOA_Feb. 2026.xlsx` (reference, not read by app)
- Settings import/export via JSON files (`doa-reader-settings-*.json`)

## Development Workflow

1. Edit `doa-reader-v4_0.1w.html` directly
2. Open in browser to test — no build step required
3. Archive previous versions in `Old Versions/` directory before major changes
4. Version naming: `doa-reader-v{major}_{minor}{patch}w.html`

## Important Notes

- **No git repo** — version history is maintained via file copies in `Old Versions/`
- **No tests** — manual browser testing only
- **No build pipeline** — Babel transpiles JSX client-side
- **For internal TAQA use only** — contains proprietary DOA matrix data
- When modifying the embedded DOA data, preserve the JSON structure inside `<script id="browse-doa-data">`
- localStorage keys are used for persistence — clearing browser data resets user settings
