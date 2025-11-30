# Contribuer rapidement

- **Organisation** : routes dans `src/app`, logique métier/utilitaires dans `src/lib`, hooks réutilisables dans `src/hooks`, composants par feature dans `src/components/<feature>` (sous-dossiers `charts/`, `forms/`, etc.), stores Zustand dans `src/store`.
- **Nommage** : composants en `PascalCase`, hooks en `useSomething.ts`, utilitaires explicites (`timers/day.ts`, `journal.ts`, `validation.ts`). Éviter les `any`.
- **API** : valider avec les schémas Zod existants, retourner via `NextResponse.json`. Extraire les helpers partagés dans `src/lib` plutôt que dupliqués dans les routes.
- **UI / charts** : utiliser `useChartSize` pour les tailles, garder les composants de graphique courts et déplacer les calculs dans `src/lib/timers` ou `components/<feature>/utils`.
- **Tests rapides** : privilégier `npm run lint` / `npm run build` avant de pousser, vérifier les imports après déplacement de fichiers.
