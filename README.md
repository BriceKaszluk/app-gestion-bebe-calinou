# Calinou 👶✨

Calinou est une application web installable (PWA-ready) pour jeunes parents, construite avec Next.js 15 (App Router) et React 19.
Objectif : suivre simplement le quotidien de bébé (biberons, dodos, couches, bain, notes, photos) et partager ces infos entre parents.

🔴 **Important**
L’application nécessite une connexion Internet.
Le manifest et le service worker permettent l’installabilité, mais **aucun mode hors-ligne n’est activé** pour éviter les conflits de données entre plusieurs parents.

---

## 🍼 Fonctionnalités principales

### 1. Timers & suivi du quotidien

Boutons rapides pour enregistrer chaque événement du quotidien :

- Dodo / Sieste 😴
- Biberon / Repas 🍼🍽️
- Couches :
- Caca 💩
- Pipi 💧
- Bain 🛁

Chaque action enregistre automatiquement :

- l’heure exacte
- la catégorie (biberon, dodo, etc.)

L’interface affiche ensuite :

- le temps écoulé depuis le dernier événement (ex. "Dernier biberon : il y a 1h15")
- les métriques utiles à la journée

---

### 2. Statistiques de la journée (nouveau)

Une vue dédiée pour analyser la journée en un coup d’œil :

- fréquence des événements
- répartition des biberons / repas / dodos / couches / bains
- visualisation timeline (Recharts)
- segments de sommeil affichés clairement
- icônes adaptées sur le graphique (🍼 😴 💩 etc.)

Optimisations :

- chargement sélectif des données du jour
- rendu client léger (charts isolés côté client)

---

### 3. Journal de bébé (texte + photos)

- Journal chronologique : notes + photos
- Upload sécurisé via Supabase Storage
- Favoris
- Lazy loading des images
- Skeletons pendant l’upload
- URLs signées pour la sécurité

---

### 4. Multi-parent & partage des accès

- Un bébé peut avoir 1 ou plusieurs parents associés
- Invitations par e-mail
- Gestion des statuts : `pending`, `accepted`, `revoked`

Base MongoDB :

- collection `babies`
- `parents[]` : liste des parents autorisés
- `invites[]` : invitations liées au bébé

---

### 5. Authentification sécurisée (NextAuth)

- Connexion via Google
- Sessions sécurisées
- Vérification stricte dans chaque route API :
  - session valide
  - e-mail correspondant à un parent du bébé

---

### 6. PWA (installable, mais pas offline pour le moment)

- Manifest configuré
- Service worker minimal
- Icônes pour mobile et desktop
- Ajout sur l’écran d’accueil possible

🧠 **Pourquoi pas d’offline ?**

- Deux parents peuvent modifier les données du même bébé.
- Un mode hors-ligne entraînerait des conflits impossibles à résoudre proprement sans CRDT ou système temps réel.
- Pour garantir l’exactitude des informations, l’application reste en ligne uniquement.

---

### 7. UI moderne & responsive

- Mobile-first
- Tailwind CSS v4
- Composants Shadcn UI + Radix
- Layout fluide :
  - mobile : largeur 94vw
  - tablette : `max-w-md` / `max-w-lg`
  - desktop : `max-w-2xl`

---

## 🧱 Stack technique

- Framework : Next.js 15 – App Router
- UI : React 19, TypeScript
- Styles : Tailwind CSS v4, Shadcn UI, Radix UI
- Auth : NextAuth (Google Provider) + MongoDBAdapter
- DB : MongoDB Atlas (`clientPromise`)
- Images : Supabase Storage (`src/lib/supabase.ts`)
- Déploiement : Vercel
- PWA : installable (manifest + sw), mais pas de cache offline
