# Architecture

- **Stack** : Next.js 15 (App Router) + React 19, TypeScript, Tailwind/shadcn/ui, MongoDB (via `src/lib/mongodb.ts`), Supabase Storage, NextAuth (`src/auth.ts`).

- **Dossiers principaux**
  - `src/app` : routes pages et API Next.js. Les routes API ne contiennent que l’orchestration/validation et délèguent la logique à `src/lib`.
  - `src/components` : composants UI organisés par feature. Exemples :
    - `babies/` : création/gestion des bébés, sélection, parents, etc. Les graphiques sont regroupés dans `babies/charts/` (`DayTimelineChart`, `SleepTimelineChart`, helpers `chartsShared`, `sleepChartUtils`) et la vue stats est découpée dans `babies/stats/`.
    - `journal/` : conteneur principal (`Journal`), formulaires, listes, filtres et `ImagePreview`.
    - `auth/`, `pwa/` (OfflineOverlay, InstallAppButton), `ui/` : composants spécifiques auth/PWA et primitives shadcn/ui.
  - `src/hooks` : hooks réutilisables (`useChartSize`, `useBabyDayEvents`, `useOnlineStatus`, etc.). Les hooks de données appellent les API et valident les réponses.
  - `src/lib` : logique métier et utilitaires. `timers/` contient les schémas Zod, helpers de plage journalière (`day.ts`), calculs sommeil (`sleep.ts`) et stats (`stats.ts`). Clients DB et Supabase vivent dans ce dossier.
  - `src/lib/time.ts` : helpers de formatage de durée/temps relatif pour l’UI.
  - `src/store` : états partagés avec Zustand (ex. `useBabyStore`).
  - `public/` : assets statiques et manifestes PWA.

- **Features clés**
  - **Babies / timers & stats** : création/parents, pad de saisie, vue stats (`BabyStatsOverview`). Les données journalières sont chargées via `useBabyDayEvents` (`/api/events/day`, validation Zod). Les graphiques utilisent Recharts : `DayTimelineChart` pour les événements instantanés, `SleepTimelineChart` pour les durées (segments découpés par jour, support du chevauchement minuit via `lib/timers/sleep` + `lib/timers/day`).
  - **Journal** : API CRUD (`src/app/api/journal`), upload d’images (Supabase), composants `journal/`.
  - **Auth** : NextAuth route handler et composants UI (`auth/`), layouts protégés dans `src/app/auth`.

- **Règles de séparation**
  - Les routes Next.js restent dans `src/app` ; elles valident (Zod) et délèguent au domaine (`src/lib`).
  - Logique métier/formatage/date dans `src/lib`; pas dans les composants.
  - Composants par feature dans `src/components/<feature>` ; sous-dossiers si nécessaire (charts, forms, utils).
  - Hooks réutilisables dans `src/hooks`; éviter de recréer des fonctions de date/validation locales.
  - Stores globaux dans `src/store`; éviter les états transverses dans les composants.
