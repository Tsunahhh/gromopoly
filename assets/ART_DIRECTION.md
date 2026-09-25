# Direction artistique et assets IA

## Pack complémentaire

16 illustrations supplémentaires sont documentées dans [CATALOGUE_PACK_CARTOON.md](CATALOGUE_PACK_CARTOON.md), avec noms explicites, usages, aperçus et formats. La galerie se trouve à `/assets/pack-cartoon/index.html`. Les prompts sont conservés dans [PROMPTS_PACK_CARTOON.md](PROMPTS_PACK_CARTOON.md).

Interface cartoon à contours prune, boutons en relief, couleurs crème, corail, menthe et lavande. Les textes restent du HTML lisible et les actions restent de vrais boutons utilisables au clavier.

## Livrables

- `public/assets/` : 36 illustrations WebP transparentes et 2 fonds WebP, environ 837 Ko au total.
- `public/assets/manifest.json` : noms, dimensions et correspondance avec la planche source.
- `assets/source/` : les trois PNG originaux générés avec l'outil imagegen intégré, conservés hors du dossier public.
- `src/assets.js` : association entre les illustrations et les éléments du jeu.
- `src/game-view.js` : plateau, fiches de terrain, loyers, gestion et aide.
- `src/cartoon.css` : thème responsive, textures et dimensions d'affichage.

| Famille | Nombre | Taille du fichier | Affichage prévu |
|---|---:|---|---|
| Pions / portraits | 6 | 80 × 80 px | 16–40 px |
| Quartiers, services, cartes, cases, monnaie, constructions, échange et hypothèque | 23 | 112 × 112 px | 12–76 px |
| Dés | 6 | 112 × 112 px | 28–54 px |
| Trophée | 1 | 144 × 144 px | 64–94 px |
| Ville | 1 | 1280 × 853 px | Accueil et centre du plateau |
| Papier | 1 | 512 × 512 px | Fond répétitif |

Les 22 rues partagent huit illustrations de quartiers ; les cartes utilisent les deux illustrations de paquets. Les six pions ont chacun leur portrait. Les prix, noms, dés tirés et informations de jeu sont indépendants des images.

## Réexporter

Le script `scripts/export-assets.mjs` utilise Sharp pour découper la planche générée, conserver la transparence et produire les petits formats. Il ne redessine pas les illustrations.

```bash
node scripts/export-assets.mjs
```

Il faut que le paquet `sharp` soit disponible, ou passer son chemin en argument. Sharp n'est pas nécessaire pour lancer le jeu ni pour déployer sur Vercel : les WebP exportés sont déjà présents.

## Vérification

Accueil, salon, partie locale à deux joueurs, lancer, fiche de terrain et aide vérifiés dans le navigateur. Vue ordinateur à 1440 px et vue mobile à 390 px. Les images visibles chargent sans erreur. Les cases s'ouvrent au clic et au clavier ; le plateau peut être agrandi sur mobile. Les modales de fiche et d'aide se ferment avec Échap.

## Prompts de génération

Mode utilisé : **outil imagegen intégré**. Les PNG ont ensuite subi uniquement un export technique (découpe, dimensions, compression WebP).

### Ville illustrée

Use case: stylized-concept. Asset type: original background illustration for a playful 2D property-trading browser board game. Primary request: a funny hand-painted cartoon miniature French neighborhood seen from a high three-quarter bird's-eye perspective, rounded crooked pastel townhouses, little orange tiled roofs, teal storefronts, cobbled paths, trees shaped like broccoli, tiny parked cars, a cheerful sunny cream sky, a few gold coins and dice as whimsical street sculptures. Style: polished indie board game art, thick dark plum outlines, warm gouache and paper grain textures, charming imperfect shapes, flat 2D illustration with soft depth, cheerful and witty. Composition: landscape 3:2 image, detailed town grouped along the lower half and right side, upper left light peach mostly empty to allow interface title overlay. Palette: warm butter cream, coral orange, lavender, mint and turquoise, dark plum ink. No text, no typography, no logos, no UI controls, no watermark. Ready to use as a website hero and board-center decorative background.

### Papier à confettis

Use case: stylized-concept. Asset type: seamless repeating background texture for a cheerful cartoon board-game interface. Create one square perfectly top-down flat cream ivory paper texture, very subtle warm pale butter grain, faint tiny hand-drawn squiggles, curved dashes, small confetti dots and scattered simple rounded stars in very pale peach and lavender. The texture should be quiet and low contrast so dark interface text remains highly legible on top. Playful hand-painted gouache on craft paper, not realistic crumpled paper, no folds, no vignette, no shadows, no perspective, no center focal point. Uniform distribution edge to edge with seamless matching edges. No letters, no words, no logos, no watermarks. Texture only, 1024x1024.

### Planche de 36 éléments

Use case: stylized-concept. Asset type: ONE game sprite atlas, a precisely aligned 6 columns by 6 rows regular grid containing 36 separate small cartoon icons for a playful property board game. Target atlas size 1024x1024, square. Every cell equal size, icon centered exactly within its cell, at least 20% inner margin on each cell so icons never touch or cross cells. Transparent background, no grid lines, no labels, no typography, no words or watermark. All icons in exactly the same polished cartoon sticker style: thick dark plum outline, simple rounded bold shapes, warm gouache texture, cream highlights, slight flat shadow; designed to remain readable at 24–48 pixels. Flat frontal or slightly isometric 2D forms. The exact row-major icon sequence MUST be: Row 1: smiling green frog head, smiling orange fox head, smiling panda head, smiling lilac octopus, cheerful yellow chick, smiling gray koala head. Row 2: copper tiny cottage, blue small townhouse, lavender bookstore building, coral bakery building, ruby theater building, golden sunny apartment building. Row 3: emerald greenhouse building, sapphire tall tower building, cute mint tram, yellow electric power station with bolt, blue water utility with drop, small coral rocket pointing upward. Row 4: funny blue police station building, palm tree park bench, red police siren with arrow, tax receipt with a coin, pink envelope card with a heart, purple surprise card with a star. Row 5: stack of gold coins, green construction house, coral apartment block, cream six-sided die FRONT FACE with exactly ONE pip, cream die FRONT FACE with exactly TWO pips, cream die FRONT FACE with exactly THREE pips. Row 6: cream die FRONT FACE with exactly FOUR pips, cream die FRONT FACE with exactly FIVE pips, cream die FRONT FACE with exactly SIX pips, friendly handshake icon, gold trophy, small house with a padlock. Strictly one icon in each cell, all 36 cells used, consistent spacing, no scenery, no extra decorative objects outside icons. Genuine transparent background.
