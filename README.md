# Calinou 👶✨

Calinou est une application web PWA-ready pour jeunes parents, construite avec **Next.js 15 (App Router)** et **React 19**.  
Objectif : **suivre simplement le quotidien de bébé** (biberons, dodos, couches, notes, photos) et **partager ces infos entre parents**.

> 🔴 Important :  
> L’application **nécessite une connexion Internet**.  
> Le manifest et le service worker sont en place pour l’installabilité, mais **aucun mode hors-ligne fonctionnel n’est encore implémenté**.

---

## 🍼 Fonctionnalités principales

### 1. Timers & suivi du quotidien
- Boutons rapides pour enregistrer les événements du quotidien :
  - Sieste / Dodo 😴  
  - Biberon / Repas 🍼🍽️  
  - Couches (caca / pipi) 💩  
- Chaque clic enregistre :
  - l’heure
  - la catégorie (biberon, dodo, etc.)
- L’UI est pensée pour afficher ensuite :
  - le **temps écoulé depuis le dernier événement** (ex. "Dernier biberon : il y a 1h15")
  - des métriques futures (statistiques, graphiques…).

### 2. Journal de bébé (texte + photos)
- Journal chronologique des moments importants :
  - notes texte
  - photos (stockées sur Supabase Storage)
- Possibilité de marquer des entrées comme **favoris** (moments à retenir).
- Affichage optimisé :
  - **scroll fluide** dans le journal
  - chargement progressif des images
  - skeletons / états de chargement pendant l’upload.
- Les images sont servies via **URLs signées** (Supabase) pour plus de sécurité.

### 3. Multi-parent & partage des accès
- Chaque bébé peut avoir **plusieurs parents associés**.
- Système d’**invitation par e-mail** :
  - un parent invite l’autre via son adresse e-mail
  - l’invité voit automatiquement le ou les bébés associés s’il accepte.
- Côté base de données (MongoDB) :
  - collection `babies`
  - champs `parents[]` (liste des parents) et `invites[]` (invitation, statut `pending | accepted | revoked`).

### 4. Authentification sécurisée (NextAuth)
- Connexion via **Google** (NextAuth + MongoDBAdapter).
- Session sécurisée côté serveur.
- Les routes API vérifient systématiquement :
  - la présence d’une session valide
  - l’e-mail utilisateur avant de lire / modifier des données.

### 5. PWA (installable, mais pas offline)
- **Manifest PWA** configuré (`public/manifest.json`).
- **Service worker** présent (`public/sw.js`, via `next-pwa`) pour :
  - permettre l’installation sur mobile / desktop
  - gérer la base pour de futures optimisations PWA.
- Icônes configurées :
  - `favicon`
  - `apple-touch-icon`
  - `themeColor` pour un bon rendu sur mobile.
- ✅ **Ce qui est en place :**
  - l’app peut être installée comme une PWA (icône sur l’écran d’accueil).
- 🔴 **Ce qui n’est pas encore fait :**
  - aucune stratégie de cache offline fiable
  - pas de fonctionnement hors-ligne garanti (lecture/écriture de données impossible sans réseau).

### 6. UI moderne & responsive
- Design **mobile-first** avec **Tailwind CSS v4**.
- Composants **Shadcn UI + Radix** pour :
  - boutons
  - cartes
  - formulaires
  - dialogues (invitations de parent)
  - selects (sélecteur de bébé, filtres du journal).
- Layout responsive :
  - mobile : cartes centrées, largeur adaptée (~94vw), marges réduites
  - tablette / desktop : largeur max contrôlée (`max-w-md`, `max-w-lg`, `max-w-2xl`).

---

## 🧱 Stack technique

- **Framework** : Next.js 15 – App Router
- **UI** : React 19, TypeScript
- **Styles** : Tailwind CSS v4, Shadcn UI, Radix UI
- **Auth** : NextAuth (Google Provider) + MongoDBAdapter
- **Base de données** : MongoDB Atlas (driver natif via `clientPromise`)
- **Stockage d’images** : Supabase Storage (`src/lib/supabase.ts`)
- **Déploiement** : Vercel
- **PWA** : `next-pwa`, `public/manifest.json`, `public/sw.js` (installable, pas encore offline-ready)

---