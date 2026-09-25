# Équilibrage et tests rejouables

## Exécuter les séries

Depuis la racine du projet, avec Node.js 20 ou plus :

```bash
npm test
npm run balance
```

`npm test` exécute **239 tests nommés**. Ils vérifient les 40 cases, les 24 cartes, les loyers extrêmes des 22 rues, neuf dés invalides, les achats à un ¤ près, les limites de stock, les enchères, les échanges, les dettes, la caution, les expirations et les scores. Soixante tests jouent aussi des parties entières à 2, 4 et 6 joueurs, avec 20 graines fixes par taille de salon ; chaque partie est rejouée deux fois et les états finaux doivent être identiques. Les simulations contrôlent après chaque action les soldes, les propriétaires, les niveaux, le stock des 32 maisons et celui des 12 appartements.

`npm run balance` joue **3 000 parties** : 1 000 graines pour chacun des salons de 2, 4 et 6 joueurs. Pour rejouer un nombre différent de graines : `node scripts/balance.mjs 200`. Le nombre passé est le nombre de parties **par taille**. Une graine et une taille données produisent toujours la même partie dans le simulateur.

## Hypothèses de la simulation

Les joueurs simulés lancent des dés issus d'une graine fixe, achètent un titre en gardant 200 ¤ de réserve, enchérissent jusqu'à 65 % du prix imprimé, proposent une offre à 125 % du prix pour compléter un groupe, construisent en gardant 300 ¤ de réserve et liquident leurs actifs pour payer les dettes. Ils ne cherchent pas des stratégies avancées et acceptent systématiquement ces offres de regroupement. Les parties simulées durent 24 tours complets à deux joueurs, 12 à quatre et 8 à six ; cela représente un nombre de lancers comparable entre formats. Le tirage initial choisit le premier joueur au hasard de manière reproductible.

Ces bots servent à repérer des déséquilibres grossiers et des blocages. Leurs résultats ne prouvent pas qu'une stratégie humaine ou un salon particulier sera équilibré, et ils ne mesurent pas directement le plaisir de jouer.

## Mesures après réglage

Résultat de `npm run balance` avec 1 000 graines par format :

| Joueurs | Victoires par place dans le salon | Lancers médians | Achats médians | Échanges médians | Constructions médianes |
|---:|---|---:|---:|---:|---:|
| 2 | 521 / 479 | 56 | 15 | 1 | 2 |
| 4 | 246 / 249 / 250 / 255 | 56 | 20 | 1 | 2 |
| 6 | 185 / 162 / 176 / 166 / 162 / 149 | 56 | 21 | 1 | 2 |

Une place dans le salon garde une légère dispersion à six joueurs. Le premier tour aléatoire évite de donner systématiquement l'initiative à l'hôte. La médiane de faillites est zéro pour ces horizons courts ; les faillites restent possibles sur des parties plus longues ou face à des stratégies agressives. Un suivi avec des parties réelles reste utile pour affiner les prix et loyers.

## Changements de rythme et de lisibilité

- Loyers des niveaux 3 et 4 abaissés de 24×/45× à 20×/30× le loyer de base. Le plus grand loyer direct devient 1 200 ¤, contre 1 800 ¤ auparavant. Les constructions restent attractives, mais une seule arrivée ne dépasse plus les 1 500 ¤ initiaux.
- Premier joueur tiré au lancement, sans modifier les 1 500 ¤ de départ pour chaque joueur.
- Patrimoine estimé affiché pendant la partie, avec un objectif de groupe à compléter. Cela rend visibles les progrès même lorsqu'un joueur dépense de l'argent pour investir.
- Un titre de fin de partie, fondé sur les actions réellement accomplies, accompagne chaque résultat : Bâtisseur, Négociateur, Rentier, Collectionneur ou Explorateur. Il ne modifie pas les points ni l'économie.
- Les transferts d'une carte impliquant plusieurs joueurs reprennent après une dette. Une mise d'enchère reste couverte lors d'un échange. La caution de la troisième tentative au Commissariat interrompt le déplacement jusqu'au règlement de la dette.

## Points à tester avec des joueurs

Après quelques soirées, relever pour chaque format la durée effective, le nombre de constructions, la fréquence des échanges et les abandons. Si les parties à six montrent peu de constructions humaines, ajuster d'abord l'aide à la négociation et la durée des tours avant de changer le prix des titres. Le score est lié au pseudo et persiste en production lorsque PostgreSQL est configuré.
