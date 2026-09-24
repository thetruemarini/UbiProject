# UbiVais

App social verticale sui viaggi: gli utenti pubblicano post composti da "box esperienza" salvabili da altri utenti e usano i box salvati per creare itinerari.

## Stack
- Expo SDK 57 (`expo ^57.0.25`), React Native 0.86, React 19.2.
- expo-router 57 con typed routes (`experiments.typedRoutes` in app.json).
- Firebase JS SDK 12 (Auth + Firestore), configurato in `config/firebase.ts`.
- Cloudinary per le immagini (upload unsigned, `services/cloudinary.service.ts`).

## Struttura
L'app vive in `UbiVaisApp/`:
- `app/` — routing file-based: gruppi `(auth)` (login, signup) e `(tabs)` (index, search, create, itineraries, profile), più `post/[id]` e `profile/[userId]`.
- `services/` — logica Firebase/Cloudinary; classi singleton esportate come default (`export default new XService()`).
- `types/index.ts` — tipi condivisi.
- `contexts/auth-context.tsx` — stato di autenticazione.
- `components/` — componenti UI.

## Modello dati Firestore
- `users/{uid}`
- `users/{uid}/savedBoxes/{boxId}`
- `posts/{postId}` con sottocollezioni `likes/{uid}` e `comments/{id}`
- `itineraries/{id}`

## Convenzioni
- TypeScript strict; import con alias `@/` (root di UbiVaisApp).
- Schermate e componenti non importano `db` direttamente: passano dai servizi.
- I metodi dei servizi restituiscono `{ success, error?, ... }`.
- I testi dell'interfaccia (e i messaggi di errore mostrati) sono in italiano.

## Comandi (da eseguire in `UbiVaisApp/`)
- `npx tsc --noEmit` — type check
- `npx expo lint` — lint
- `npx expo start -c` — avvio con cache pulita

## Regola di lavoro
Fai modifiche mirate solo ai file richiesti, niente refactoring non richiesti. Alla fine esegui `tsc` e `lint` e riassumi i file modificati.
