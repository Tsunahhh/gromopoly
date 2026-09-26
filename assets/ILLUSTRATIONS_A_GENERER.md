# Illustrations à générer — Cité Capitale

Brief de production pour une IA de génération d'images locale (Stable Diffusion, Flux, etc.). Il liste **71 illustrations** manquantes ou à améliorer, par ordre de priorité, avec pour chacune : le nom de fichier attendu, son rôle dans le jeu, sa taille d'affichage, sa taille d'export et le sujet à dessiner.

Les illustrations existantes (`public/assets/` et `public/assets/pack-cartoon/`) servent de **référence de style** : toutes les nouvelles images doivent pouvoir être posées à côté sans que la différence se voie.

---

## 1. Règles communes à toutes les images

### Style

| Élément | Consigne |
|---|---|
| Rendu | Illustration 2D de jeu de société indé, peinte à la main, drôle et chaleureuse |
| Contours | Épais, **prune foncé `#342d47`**, réguliers, sur tout le sujet |
| Formes | Arrondies, dodues, légèrement de travers ; peu de détails fins |
| Texture | Léger grain de gouache / papier, pas de dégradé numérique lisse |
| Palette | Crème beurre `#fff4df`, corail `#fa7c68`, menthe `#8fd3b6`, lavande `#aa83cf`, accents or `#ffbd59` |
| Vue | Légère vue de trois quarts, sauf mention contraire |
| Lisibilité | La silhouette doit rester reconnaissable **à 24–32 px** |
| Interdits | Aucun texte, lettre, chiffre, logo, signature, filigrane ou cadre. Les prix, noms et règles sont affichés en HTML par le jeu |

### Format de génération

| Élément | Consigne |
|---|---|
| Toile | **1024 × 1024 px**, carrée (sauf icône d'application et image de partage, voir section 3) |
| Cadrage | Un seul sujet, centré, entièrement visible, **15 % de marge vide sur chaque bord** |
| Fond | **Magenta uni `#FF00FF`**, parfaitement plat, sans ombre portée ni sol, pour un détourage automatique. Si le sujet contient du rose ou du magenta, utiliser **vert `#00FF00`** à la place |
| Fichier source | PNG, déposé dans `assets/source/pack-2/<nom>.png` |
| Détourage | Fond supprimé → PNG transparent avec canal alpha, contour net sans halo coloré |

### Prompt de base (à compléter par le sujet de chaque image)

```text
ONE isolated 2D cartoon game sprite for the French property-trading board game "Cité Capitale".
Subject: {SUJET}.
Polished funny hand-painted indie board-game illustration, bold thick dark plum outlines (#342d47),
rounded slightly crooked chunky shapes, subtle gouache paper grain, warm butter cream, coral, mint
and lavender palette with gold accents. Slight three-quarter view, simple shapes readable at 24-64 px.
Subject centered, full silhouette visible, 15% empty margin on every side.
Background: perfectly flat solid magenta #FF00FF, no gradient, no cast shadow, no ground plane.
No text, no letters, no numbers, no logo, no watermark, no frame. Square image.
```

### Prompt négatif

```text
text, letters, numbers, words, typography, watermark, signature, logo, frame, border, photorealistic,
3d render, glossy plastic, gradient background, busy background, scenery, cast shadow on background,
ground plane, cropped, cut off, multiple separate objects, blurry, thin sketchy lines, low contrast
```

### Conseils pour garder le style

- Utiliser 2 ou 3 images existantes comme **référence de style** (IP-Adapter, img2img à faible force ou LoRA de style). Par exemple : `public/assets/pack-cartoon/objet-cles-propriete-256.webp`, `evenement-pluie-pieces-256.webp` et `batiment-gare-train-256.webp`.
- Garder la même graine et les mêmes réglages pour une même famille (les 24 cartes, les 22 rues) : la série paraît alors homogène.
- Vérifier chaque image **réduite à 32 px** avant de la valider.

### Exports attendus (faits ensuite par script, comme pour le pack cartoon)

Chaque image est exportée en WebP transparent, en deux tailles :

- `nom.webp` : taille « jeu », indiquée dans les tableaux ;
- `nom-256.webp` : version haute densité (écrans Retina et mobiles).

Destination : `public/assets/pack-cartoon/`. Les métadonnées vont dans `assets/pack-cartoon.json`, et l'export se fait avec `node scripts/export-pack-cartoon.mjs`.

---

## 2. Priorité 1 — Interface (remplace des émojis et des symboles)

Aujourd'hui, certains boutons affichent encore des émojis système (📖, ✨) ou des symboles typographiques. Ils ne ressemblent pas au reste du jeu et changent d'aspect selon le téléphone.

| Nom du fichier | Sert à | Affichage | Export jeu | Sujet à dessiner |
|---|---|---:|---:|---|
| `ui-livre-regles` | Bouton « Comment on joue ? » et fenêtre des règles | 20–76 px | 96 px | Gros livre ouvert crème à couverture corail, un marque-page menthe qui dépasse, petites étoiles dorées au-dessus |
| `ui-animations-on` | Bouton « Animations activées » | 20 px | 96 px | Trois étincelles dorées dodues de tailles différentes, avec un petit tourbillon lavande |
| `ui-animations-off` | Bouton « Animations désactivées » | 20 px | 96 px | Une seule étincelle dorée endormie (yeux fermés, petit « bonnet de nuit » lavande) posée sur un croissant de lune crème |
| `ui-journal-gazette` | Onglet et panneau « Le petit journal » (historique) | 26 px | 96 px | Journal plié crème avec colonnes de traits (pas de lettres), une petite illustration de maison sur la une, un coin corné |
| `ui-options-boite-outils` | Onglet « Options » sur mobile | 26 px | 96 px | Petite boîte à outils menthe entrouverte, un tournevis corail et une clé dorée qui dépassent |
| `ui-porte-sortie` | Bouton « Quitter la partie » | 20–25 px | 96 px | Porte d'entrée arrondie lavande entrouverte, un petit paillasson corail et une flèche courbe dorée vers l'extérieur |
| `ui-sablier` | Chronomètre du tour (en haut à droite) | 20–24 px | 96 px | Sablier dodu à monture corail, sable doré qui s'écoule, deux gouttes de sueur comiques |
| `ui-invitation-billet` | Boutons « Partager le lien » et « Copier le code » du salon | 20–25 px | 96 px | Ticket d'invitation crème à bords dentelés avec une petite maison menthe imprimée et un ruban corail |
| `ui-place-libre` | Place vide du salon (« En attente d'un ami ») | 36 px | 128 px | Silhouette de pion rond vide en pointillés lavande, avec un petit « + » doré dessiné en forme (pas un caractère) |
| `ui-connexion-perdue` | Message d'erreur réseau / salon introuvable | 64–96 px | 160 px | Deux prises de câble crème qui se regardent, débranchées, avec une petite étincelle et une expression gênée |
| `ui-trone-libre` | Classement vide (« Le trône est libre ») | 64–96 px | 160 px | Petit trône de velours corail à pieds dorés, vide, un coussin menthe et une couronne posée de travers sur l'assise |

---

## 3. Priorité 1 — Identité du jeu et partage

Ces deux images ne suivent **pas** le format carré détouré.

| Nom du fichier | Sert à | Taille source | Exports | Consignes |
|---|---|---:|---|---|
| `app-icone` | Icône de l'onglet du navigateur, raccourci sur l'écran d'accueil du téléphone | 1024 × 1024, **fond plein** | 512, 192, 180 (Apple), 32 (favicon) | Dé crème à cinq points, un peu penché, qui porte une petite maison à toit corail sur sa face supérieure. **Fond plein lavande `#aa83cf`** (pas de transparence). Tout le sujet dans le **cercle central de 80 %**, pour résister au rognage circulaire d'Android. Aucune lettre. |
| `og-partage` | Aperçu affiché quand on partage le lien d'invitation (WhatsApp, Discord, SMS) | **1200 × 630**, fond plein | 1200 × 630 (WebP et PNG) | Scène paysage dans le style de `cartoon-town` : quartier pastel en vue plongeante sur les **60 % de droite**, avec deux dés géants et trois pions animaux (grenouille, renard, panda). Les **40 % de gauche** restent un ciel pêche calme et presque uni : le titre du jeu y sera ajouté ensuite, en HTML ou par script. Aucun texte dans l'image. |

---

## 4. Priorité 2 — Cartes piochées (24)

Quand un joueur pioche une carte, elle s'affiche en grand au milieu de l'écran chez tous les joueurs. Aujourd'hui, plusieurs cartes partagent la même image. Il faut **une illustration par carte**.

- **Affichage :** 112 px (carte révélée). **Export jeu :** 128 px, plus `-256`.
- Le cadre, le titre et le montant de la carte sont en HTML : il faut dessiner **seulement l'illustration**.
- Deux familles de couleurs :
  - **Coup de théâtre** (`carte-theatre-…`) : ton arts du spectacle, dominante **pêche / corail** ;
  - **La Ville vous parle** (`carte-ville-…`) : ton municipal, dominante **lavande / menthe**.

### Coup de théâtre

| Nom du fichier | Carte (effet) | Sujet à dessiner |
|---|---|---|
| `carte-theatre-prime-creative` | Prime créative (+50 ¤) | Palette de peintre dorée d'où jaillissent trois pièces, pinceau corail en l'air |
| `carte-theatre-achat-impulsif` | Achat imprévu (−80 ¤) | Sac de shopping corail qui déborde de trucs inutiles (canard en plastique, chapeau à plumes), une pièce qui s'enfuit en courant |
| `carte-theatre-travaux-facade` | Travaux de façade (par maison et immeuble) | Façade de maison sous échafaudage, pot de peinture renversé et rouleau menthe |
| `carte-theatre-avance-navette` | Avance à la Navette | Petit tramway menthe qui file avec des traits de vitesse et un pion grenouille qui s'accroche à l'arrière |
| `carte-theatre-reculer` | Reculer de deux cases | Pion renard qui marche à reculons, surpris, sur deux petites dalles, avec une flèche courbe lavande vers l'arrière |
| `carte-theatre-defi-artistique` | Défi artistique (+40 ¤) | Chevalet avec une toile abstraite (formes colorées), ruban de concours doré accroché dessus |
| `carte-theatre-route-depart` | En route vers le Départ | Fusée corail qui décolle d'un rond-point, avec un nuage de fumée crème |
| `carte-theatre-visite-commissariat` | Visite au Commissariat | Sifflet de gendarme doré et casquette bleue posés sur une paire de menottes en peluche lavande |
| `carte-theatre-bourse-creative` | Bourse créative (+60 ¤) | Bourse en tissu corail nouée par un ruban, avec un masque de théâtre souriant cousu dessus et des pièces qui débordent |
| `carte-theatre-cotisation-quartier` | Cotisation de quartier (−75 ¤) | Bocal de collecte en verre avec couvercle fendu, pièces qui tombent dedans d'une main cartoon |
| `carte-theatre-voisins-merci` | Les voisins te remercient (chaque joueur te donne 20 ¤) | Trois petites maisons souriantes qui tendent chacune une pièce, avec des cœurs corail |
| `carte-theatre-tour-aurores` | Direction Tour des Aurores | Tour saphir élancée avec un ruban d'aurore boréale menthe et lavande au sommet, un pion qui lève les yeux |

### La Ville vous parle

| Nom du fichier | Carte (effet) | Sujet à dessiner |
|---|---|---|
| `carte-ville-bourse-municipale` | Bourse municipale (+75 ¤) | Petite mairie lavande avec drapeau, d'où sort une enveloppe crème pleine de pièces |
| `carte-ville-stationnement` | Stationnement gênant (−60 ¤) | Petite voiture menthe mal garée sur un trottoir, avec un papillon (PV) crème sans texte sur le pare-brise |
| `carte-ville-remboursement` | Remboursement local (+40 ¤) | Enveloppe lavande ouverte avec deux pièces et une flèche courbe dorée de retour |
| `carte-ville-cotisation-municipale` | Cotisation municipale (−75 ¤) | Boîte aux lettres municipale corail qui avale des pièces, air gourmand |
| `carte-ville-concours-quartier` | Concours de quartier (+20 ¤) | Citrouille géante ou gros chou primé avec une rosette de ruban dorée |
| `carte-ville-avance-depart` | Avance au Départ | Panneau routier rond menthe avec une flèche vers une petite fusée, sans texte |
| `carte-ville-commissariat` | Commissariat | Petite porte de cellule bleue avec barreaux et un pion panda qui boude derrière |
| `carte-ville-liberation` | Carte Libération (à garder) | Clé dorée géante qui ouvre un cadenas en forme de cœur, avec des étincelles |
| `carte-ville-coup-de-pouce` | Coup de pouce aux voisins (tu donnes 20 ¤ à chaque joueur) | Main cartoon qui tend une pièce vers trois petites mains, sur fond de guirlande |
| `carte-ville-participation` | Participation citoyenne (chaque joueur te donne 10 ¤) | Urne crème avec des bulletins pliés sans texte et une cocarde lavande et menthe |
| `carte-ville-prime-voisinage` | Prime de voisinage (+50 ¤) | Tarte fumante posée sur une pile de pièces, deux petites fenêtres de voisins qui sourient derrière |
| `carte-ville-travaux-municipaux` | Travaux municipaux (par maison et immeuble) | Cône de chantier corail, pelle menthe et barrière rayée devant un trou dans le pavé |

---

## 5. Priorité 2 — Fin de partie

| Nom du fichier | Sert à | Affichage | Export jeu | Sujet à dessiner |
|---|---|---:|---:|---|
| `recompense-medaille-argent` | 2ᵉ place de l'écran de résultats | 44 px | 128 px | Médaille argentée dodue avec ruban lavande, étoile en relief |
| `recompense-medaille-bronze` | 3ᵉ place de l'écran de résultats | 44 px | 128 px | Médaille couleur bronze avec ruban menthe, petite maison en relief |
| `badge-batisseur` | Titre « Bâtisseur » (a le plus construit) | 32–48 px | 128 px | Casque de chantier jaune posé sur une truelle et une brique corail |
| `badge-negociateur` | Titre « Négociateur » (a fait des échanges) | 32–48 px | 128 px | Deux cartes de terrain qui s'échangent en tourbillon, avec une étoile dorée entre elles |
| `badge-rentier` | Titre « Rentier » (a encaissé le plus de loyers) | 32–48 px | 128 px | Transat menthe avec une pile de pièces, des lunettes de soleil et une boisson à paille |
| `badge-collectionneur` | Titre « Collectionneur » (a acheté beaucoup de terrains) | 32–48 px | 128 px | Album ouvert lavande rempli de petites vignettes de maisons colorées |
| `badge-explorateur` | Titre « Explorateur » (titre par défaut) | 32–48 px | 128 px | Boussole dorée posée sur une carte au trésor pliée, pointillés corail |

---

## 6. Priorité 3 — Plateau

### 6.1 Une illustration par rue (22)

Aujourd'hui, les 22 rues partagent 8 illustrations de quartier. Une image par rue rendrait le plateau et les fiches bien plus vivants.

- **Affichage :** icône de 12–26 px sur la case, **74 px en en-tête de fiche**. **Export jeu :** 128 px, plus `-256`.
- Chaque bâtiment reprend la **couleur de son quartier** comme couleur dominante : toit, façade ou store.
- Silhouette très simple : elle doit rester lisible à 16 px sur mobile.

| Nom du fichier | Rue | Quartier (couleur) | Sujet à dessiner |
|---|---|---|---|
| `rue-ateliers` | Rue des Ateliers | Cuivre `#bb7657` | Petit atelier au toit de cuivre, enclume et roue dentée devant la porte |
| `rue-artisans` | Passage des Artisans | Cuivre `#bb7657` | Passage couvert en arche avec un étal de poteries et une chaise en bois |
| `rue-fresques` | Allée des Fresques | Azur `#54b8df` | Mur de maison couvert d'une fresque de formes colorées abstraites, pots de peinture au pied |
| `rue-musiciens` | Place des Musiciens | Azur `#54b8df` | Kiosque à musique rond au toit azur, trompette et violon posés sur la rambarde |
| `rue-inventeurs` | Quai des Inventeurs | Azur `#54b8df` | Atelier de quai avec une girouette en ampoule et une petite barque amarrée |
| `rue-lanternes` | Rue des Lanternes | Lavande `#aa83cf` | Maison lavande avec une guirlande de lanternes en papier allumées |
| `rue-livres` | Promenade des Livres | Lavande `#aa83cf` | Kiosque à livres en plein air sous un arbre, piles de livres sans titres |
| `rue-cinemas` | Cour des Cinémas | Lavande `#aa83cf` | Petite façade de cinéma à marquise lumineuse (ampoules, pas de lettres) et cornet de pop-corn |
| `rue-saveurs` | Boulevard des Saveurs | Corail `#fa7c68` | Bistrot au store rayé corail, marmite fumante et petite table en terrasse |
| `rue-epices` | Jardin des Épices | Corail `#fa7c68` | Petit jardin avec des sacs d'épices colorées ouverts et un piment géant |
| `rue-festival` | Avenue du Festival | Corail `#fa7c68` | Petite scène en plein air avec fanions, ballons et un projecteur |
| `rue-etoiles` | Place des Étoiles | Rubis `#dc5572` | Petit observatoire à coupole rubis avec une lunette pointée vers une étoile dorée |
| `rue-studios` | Rue des Studios | Rubis `#dc5572` | Studio de tournage avec une caméra à bobines, un clap sans inscription et un projecteur |
| `rue-spectacles` | Cours des Spectacles | Rubis `#dc5572` | Chapiteau rayé rubis et crème avec un drapeau au sommet |
| `rue-serres` | Avenue des Serres | Or `#e3b94f` | Serre dorée en arcs de verre remplie de plantes vertes |
| `rue-soleil` | Place du Soleil | Or `#e3b94f` | Place avec une fontaine surmontée d'une sculpture en forme de soleil souriant |
| `rue-verrieres` | Promenade des Verrières | Or `#e3b94f` | Galerie couverte d'une verrière dorée, lampadaires et bancs |
| `rue-horizons` | Quai des Horizons | Émeraude `#54b889` | Capitainerie verte avec une longue-vue sur le toit et une bouée |
| `rue-jardins` | Boulevard des Jardins | Émeraude `#54b889` | Kiosque de jardin émeraude entouré de haies taillées en boules |
| `rue-phare` | Terrasse du Phare | Émeraude `#54b889` | Petit phare rayé vert et crème avec une terrasse de café à ses pieds |
| `rue-nuages` | Allée des Nuages | Saphir `#607fe0` | Tour saphir dont le toit est un nuage moelleux, passerelle vers un second petit nuage |
| `rue-aurores` | Tour des Aurores | Saphir `#607fe0` | La plus haute tour du jeu, saphir, avec une couronne et un ruban d'aurore au sommet (terrain le plus cher) |

### 6.2 Navettes (4) et taxe (1)

| Nom du fichier | Case | Affichage | Export jeu | Sujet à dessiner |
|---|---|---:|---:|---|
| `navette-nord` | Navette du Nord | 12–26 px (case), 74 px (fiche) | 128 px | Tramway menthe avec un toit enneigé et une écharpe au conducteur |
| `navette-est` | Navette de l'Est | idem | 128 px | Tramway menthe avec un soleil levant orange derrière |
| `navette-sud` | Navette du Sud | idem | 128 px | Tramway menthe décoré d'un palmier et de lunettes de soleil |
| `navette-ouest` | Navette de l'Ouest | idem | 128 px | Tramway menthe devant un coucher de soleil corail sur la mer |
| `taxe-patrimoine` | Contribution patrimoine (se distingue de la « Contribution locale ») | idem | 128 px | Petit coffre-fort doré avec un reçu crème qui en sort et une loupe lavande posée dessus |

---

## 7. Récapitulatif

| Priorité | Famille | Nombre | Usage |
|---|---|---:|---|
| 1 | Interface | 11 | Remplace les émojis et symboles restants, états vides et erreurs |
| 1 | Identité et partage | 2 | Icône d'application et aperçu du lien d'invitation |
| 2 | Cartes | 24 | Carte révélée en grand pendant la partie |
| 2 | Fin de partie | 7 | Médailles de 2ᵉ et 3ᵉ place, titres de fin de partie |
| 3 | Rues | 22 | Cases du plateau et fiches de terrain |
| 3 | Navettes et taxe | 5 | Cases spéciales du plateau |
| | **Total** | **71** | |

**Intégration :** déposer les PNG dans `assets/source/pack-2/` (fond magenta ou déjà transparent), puis lancer `node scripts/export-pack-2.mjs` (Sharp requis : `npm install --no-save sharp`). Le script ne modifie pas les originaux ; il détoure, recadre, exporte dans `public/assets/pack-2/` et met à jour `src/pack-2.js`. Le jeu utilise alors automatiquement chaque nouvelle illustration ; tant qu'une image manque, l'ancienne reste affichée.

---

## 8. Liste pour génération en lot (JSON)

Chaque entrée contient : `id` (nom du fichier sans extension), `priority`, `size` (taille de la toile de génération), `background` (fond à détourer, ou `null` pour un fond plein), `export` (taille « jeu » en px) et `subject` (sujet en anglais, à insérer dans le prompt de base à la place de `{SUJET}`).

```json
[
  {"id":"ui-livre-regles","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"a big open cream book with a coral cover, a mint bookmark sticking out, small golden stars above it"},
  {"id":"ui-animations-on","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"three chubby golden sparkles of different sizes with a small lavender swirl"},
  {"id":"ui-animations-off","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"one sleepy golden sparkle with closed eyes and a lavender nightcap, resting on a cream crescent moon"},
  {"id":"ui-journal-gazette","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"a folded cream newspaper with columns of plain lines instead of letters, a tiny house drawing on the front page, one dog-eared corner"},
  {"id":"ui-options-boite-outils","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"a small half-open mint toolbox with a coral screwdriver and a golden wrench sticking out"},
  {"id":"ui-porte-sortie","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"a rounded lavender front door slightly open, a small coral doormat, a curved golden arrow pointing outside"},
  {"id":"ui-sablier","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"a chubby hourglass with a coral frame and flowing golden sand, two comic sweat drops"},
  {"id":"ui-invitation-billet","priority":1,"size":[1024,1024],"background":"#FF00FF","export":96,"subject":"a cream invitation ticket with scalloped edges, a small mint house printed on it and a coral ribbon"},
  {"id":"ui-place-libre","priority":1,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an empty round board-game pawn silhouette drawn with lavender dashed outline, a small golden plus shape floating next to it"},
  {"id":"ui-connexion-perdue","priority":1,"size":[1024,1024],"background":"#FF00FF","export":160,"subject":"two cream cable plugs facing each other unplugged, a tiny spark between them, embarrassed cute faces"},
  {"id":"ui-trone-libre","priority":1,"size":[1024,1024],"background":"#FF00FF","export":160,"subject":"a small empty coral velvet throne with golden legs, a mint cushion and a crown lying crooked on the seat"},
  {"id":"app-icone","priority":1,"size":[1024,1024],"background":null,"export":512,"subject":"a tilted cream six-sided die showing five pips with a tiny coral-roofed house on its top face, on a full-bleed flat lavender #aa83cf background, everything inside the central 80% circle"},
  {"id":"og-partage","priority":1,"size":[1200,630],"background":null,"export":1200,"subject":"landscape scene of a pastel French miniature town seen from above on the right 60% of the image, two giant cream dice and three animal pawns (frog, fox, panda) in the streets; the left 40% is a calm nearly empty peach sky left free for a title"},
  {"id":"carte-theatre-prime-creative","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a golden painter palette with three coins bursting out of it and a coral paintbrush in the air"},
  {"id":"carte-theatre-achat-impulsif","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a coral shopping bag overflowing with silly items (rubber duck, feathered hat), one coin running away"},
  {"id":"carte-theatre-travaux-facade","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small house facade under scaffolding, a tipped-over paint pot and a mint paint roller"},
  {"id":"carte-theatre-avance-navette","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small mint tram speeding with motion lines, a frog pawn hanging on to the back"},
  {"id":"carte-theatre-reculer","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a surprised fox pawn walking backwards over two small paving tiles, a curved lavender arrow pointing back"},
  {"id":"carte-theatre-defi-artistique","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an easel with an abstract colorful painting and a golden prize ribbon pinned to it"},
  {"id":"carte-theatre-route-depart","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a coral rocket taking off from a small roundabout with a puff of cream smoke"},
  {"id":"carte-theatre-visite-commissariat","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a golden police whistle and a blue police cap resting on fluffy lavender toy handcuffs"},
  {"id":"carte-theatre-bourse-creative","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a coral cloth purse tied with a ribbon, a smiling theater mask sewn on it, coins spilling out"},
  {"id":"carte-theatre-cotisation-quartier","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a glass donation jar with a slotted lid, a cartoon hand dropping coins into it"},
  {"id":"carte-theatre-voisins-merci","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"three small smiling houses each holding out a coin, little coral hearts around them"},
  {"id":"carte-theatre-tour-aurores","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a slender sapphire tower with a mint and lavender aurora ribbon at the top, a tiny pawn looking up"},
  {"id":"carte-ville-bourse-municipale","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small lavender town hall with a flag, a cream envelope full of coins coming out of the door"},
  {"id":"carte-ville-stationnement","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small mint car badly parked on a sidewalk with a blank cream parking ticket on the windshield"},
  {"id":"carte-ville-remboursement","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an open lavender envelope with two coins and a curved golden return arrow"},
  {"id":"carte-ville-cotisation-municipale","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a greedy coral municipal mailbox swallowing coins"},
  {"id":"carte-ville-concours-quartier","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a giant prize-winning pumpkin with a golden rosette ribbon"},
  {"id":"carte-ville-avance-depart","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a round mint road sign with an arrow pointing to a tiny rocket, no text"},
  {"id":"carte-ville-commissariat","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small blue cell door with bars and a sulking panda pawn behind it"},
  {"id":"carte-ville-liberation","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a giant golden key opening a heart-shaped padlock with sparkles"},
  {"id":"carte-ville-coup-de-pouce","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a cartoon hand offering a coin to three small hands, a little bunting garland behind"},
  {"id":"carte-ville-participation","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a cream ballot box with folded blank ballots and a lavender and mint rosette"},
  {"id":"carte-ville-prime-voisinage","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a steaming pie resting on a stack of coins, two small smiling neighbor windows behind it"},
  {"id":"carte-ville-travaux-municipaux","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a coral traffic cone, a mint shovel and a striped barrier in front of a hole in the cobblestones"},
  {"id":"recompense-medaille-argent","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a chubby silver medal with a lavender ribbon and an embossed star"},
  {"id":"recompense-medaille-bronze","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a chubby bronze medal with a mint ribbon and an embossed tiny house"},
  {"id":"badge-batisseur","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a yellow hard hat resting on a trowel and a coral brick"},
  {"id":"badge-negociateur","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"two property cards swapping places in a swirl with a golden star between them"},
  {"id":"badge-rentier","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a mint deck chair with a stack of coins, sunglasses and a drink with a straw"},
  {"id":"badge-collectionneur","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an open lavender album filled with small colorful house stickers"},
  {"id":"badge-explorateur","priority":2,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a golden compass on a folded treasure map with coral dotted path"},
  {"id":"rue-ateliers","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small workshop with a copper roof (#bb7657), an anvil and a cog wheel by the door"},
  {"id":"rue-artisans","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a covered copper-toned (#bb7657) archway passage with a pottery stall and a wooden chair"},
  {"id":"rue-fresques","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an azure (#54b8df) house wall covered with a colorful abstract mural, paint pots at its foot"},
  {"id":"rue-musiciens","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a round bandstand with an azure (#54b8df) roof, a trumpet and a violin resting on the railing"},
  {"id":"rue-inventeurs","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an azure (#54b8df) quayside workshop with a light-bulb weather vane and a small moored boat"},
  {"id":"rue-lanternes","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a lavender (#aa83cf) house with a string of glowing paper lanterns"},
  {"id":"rue-livres","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an open-air lavender (#aa83cf) book kiosk under a small tree, piles of books without titles"},
  {"id":"rue-cinemas","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small lavender (#aa83cf) cinema facade with a marquee of light bulbs (no letters) and a popcorn cone"},
  {"id":"rue-saveurs","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a bistro with a coral (#fa7c68) striped awning, a steaming pot and a small terrace table"},
  {"id":"rue-epices","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small coral-toned (#fa7c68) garden with open sacks of colorful spices and a giant chili pepper"},
  {"id":"rue-festival","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small open-air coral (#fa7c68) stage with bunting, balloons and a spotlight"},
  {"id":"rue-etoiles","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small observatory with a ruby (#dc5572) dome and a telescope pointing at a golden star"},
  {"id":"rue-studios","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a ruby (#dc5572) film studio with a reel camera, a blank clapperboard and a spotlight"},
  {"id":"rue-spectacles","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a ruby (#dc5572) and cream striped circus tent with a flag on top"},
  {"id":"rue-serres","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a golden (#e3b94f) arched glass greenhouse full of green plants"},
  {"id":"rue-soleil","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small plaza fountain topped by a smiling golden (#e3b94f) sun sculpture"},
  {"id":"rue-verrieres","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a covered gallery with a golden (#e3b94f) glass roof, street lamps and benches"},
  {"id":"rue-horizons","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an emerald (#54b889) harbor master house with a spyglass on the roof and a life buoy"},
  {"id":"rue-jardins","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"an emerald (#54b889) garden gazebo surrounded by round topiary hedges"},
  {"id":"rue-phare","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small emerald (#54b889) and cream striped lighthouse with a café terrace at its base"},
  {"id":"rue-nuages","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a sapphire (#607fe0) tower whose roof is a fluffy cloud, a small bridge to a second little cloud"},
  {"id":"rue-aurores","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"the tallest sapphire (#607fe0) tower with a small crown and an aurora ribbon at the top, prestigious"},
  {"id":"navette-nord","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a mint tram with a snowy roof and a scarf on the driver"},
  {"id":"navette-est","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a mint tram with an orange rising sun behind it"},
  {"id":"navette-sud","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a mint tram decorated with a palm tree and wearing sunglasses"},
  {"id":"navette-ouest","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a mint tram in front of a coral sunset over the sea"},
  {"id":"taxe-patrimoine","priority":3,"size":[1024,1024],"background":"#FF00FF","export":128,"subject":"a small golden safe with a cream receipt coming out and a lavender magnifying glass resting on it"}
]
```
