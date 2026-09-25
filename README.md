# Cité Capitale

Jeu de plateau immobilier 2D original pour 2 à 6 amis. Il utilise des noms, textes et valeurs propres au projet. Le détail des règles et le plan initial sont dans [PLAN_DE_CONSTRUCTION.md](./PLAN_DE_CONSTRUCTION.md).

## Jouer en local

1. Installer Node.js 20 ou plus récent.
2. Dans le dossier du projet, exécuter `npm install`, puis `npm run dev`.
3. Ouvrir l’adresse locale affichée. Utiliser deux navigateurs ou deux profils pour tester les salons.

Le mode local conserve profils, salons et scores dans la mémoire du serveur Vite : il reste disponible après un rafraîchissement, mais disparaît à l’arrêt du serveur. Ce mode appelle le même moteur de règles que l’API de production.

## Déployer sur Vercel

1. Placer ce dossier dans un dépôt Git, puis l'importer dans Vercel (ou utiliser le CLI Vercel depuis ce dossier). Le build utilise `npm run build` et publie le dossier `dist`.
2. Créer une base PostgreSQL et ajouter `DATABASE_URL` aux variables d’environnement du projet Vercel (production et preview si souhaité).
3. Déployer. L’API initialise les tables au premier appel ; le SQL équivalent est dans `db/schema.sql`.

Sans `DATABASE_URL`, l’API Vercel répond avec une erreur de configuration. Ne pas ajouter cette chaîne au code du client. Les fonctions utilisent le paquet `pg`; choisir une base accessible par connexions PostgreSQL TLS.

## Fonctionnalités présentes

- Pseudos uniques sans mot de passe. Un code de reprise indépendant restaure un profil. En production, le code est stocké sous forme de hash SHA-256 ; une session séparée utilise un cookie `HttpOnly`, `SameSite=Lax` et `Secure` sur Vercel.
- Salons privés par code et lien d’invitation, lobby et parties à 2–6 joueurs avec premier joueur tiré au sort.
- Plateau original de 40 cases, dés tirés côté serveur en production, achats, enchères avec plusieurs surenchères, loyers, taxes, 24 cartes, doubles, Commissariat et carte Libération.
- Maisons et appartements équilibrés, stock commun de 32 maisons et 12 appartements, revente, hypothèques et levées d’hypothèque.
- Échanges d’argent, de titres sans bâtiments et de cartes Libération, avec proposition, acceptation/refus et contrôle des actifs au moment de l’accord.
- Dette réglable par revente, hypothèque ou faillite ; transfert des actifs au créancier. Chronomètre de tour de 90 secondes avec action de secours calculée par le moteur lorsqu’un client connecté demande l’expiration.
- Actualisation multijoueur toutes les 1,4 seconde ; commandes PostgreSQL sérialisées par verrou et vérification de version.
- Score attribué une seule fois par partie terminée, classement global, patrimoine et prochain groupe à compléter visibles, titres de fin de partie, animations CSS, affichage mobile et prise en compte de `prefers-reduced-motion`.

Le code de reprise apparaît dans une fenêtre à la création du pseudo et reste visible jusqu'à ce que le joueur confirme l'avoir sauvegardé. Le plateau anime les dés, le déplacement du pion, les échanges d'argent et les changements de tour.

L’interface cartoon utilise 36 illustrations IA et deux fonds optimisés (environ 837 Ko au total). Les actions du tour sont regroupées au-dessus du plateau. Clique sur une case pour consulter ses loyers et gérer tes terrains ; un bouton permet d’agrandir le plateau sur mobile. Les sources, dimensions et prompts sont documentés dans [assets/ART_DIRECTION.md](assets/ART_DIRECTION.md).

## Vérifier le moteur

`npm test` lance 239 tests rejouables, dont 60 parties complètes à graines fixes. `npm run balance` simule 3 000 parties pour mesurer le rythme et les victoires par place. La méthode et les mesures figurent dans [BALANCE_ET_TESTS.md](BALANCE_ET_TESTS.md). `npm run build` vérifie le client Vite.

## Limites actuelles

Quelques points restent à finir avant une partie longue sans limites : le choix des couleurs est automatique, le chronomètre de partie est vérifié à la fin d’un tour, et la faillite au profit de la banque remet les titres libres en état non possédé sans lancer une enchère automatique. Les délais s’écoulent côté serveur et un client actif envoie l’action d’expiration ; aucun processus planifié n’est nécessaire, mais si tous les joueurs ferment leur navigateur, l’action ne se produit qu’à leur reconnexion. Le classement local reste en mémoire et disparaît à l’arrêt de Vite ; la persistance de production nécessite PostgreSQL.

Les profils et scores du mode PostgreSQL sont permanents. Les salons conservent leur état JSON, mais aucune purge automatique des anciens salons n’est configurée. La production Vercel n’a pas encore été testée sur une URL publique avec la base choisie.
