# Revue UI/UX de l’administration

Revue et corrections du 11 septembre 2026, avec le skill Impeccable.

## Périmètre et direction

Vue d’ensemble `/admin`, listes par catégorie, création d’activité, éditeur,
modification des informations, description, indications, photos, GPX et
suppression. Mode **Operate** : faciliter la gestion quotidienne du contenu.

L’identité existante est conservée : Rubik, palette montagne verte, surfaces,
composants Radix et boutons partagés. Les références visuelles sont
`app/globals.css`, `components/ui` et les écrans Admin existants.

## Constats corrigés

| Priorité | Constat                                                                                                                                          | Correction                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Haute    | La navigation pouvait élargir toute la page sur mobile. Un texte réservé aux lecteurs d’écran débordait aussi après redimensionnement.           | Largeur minimale corrigée et positionnement du contenu masqué contenu dans la navigation défilante.                                                                                         |
| Haute    | Une sauvegarde échouée ne restait pas signalée dans le formulaire.                                                                               | États attente, enregistrement, succès, erreur et validation ; reprise explicite ; conservation de la saisie dans le formulaire.                                                             |
| Haute    | Plusieurs modifications pouvaient déclencher des écritures concurrentes dans un même formulaire.                                                 | Écritures sérialisées ; seul le résultat correspondant à la dernière modification est présenté comme enregistré. Avertissement à la fermeture/recharge si une saisie reste non enregistrée. |
| Haute    | Effacer une valeur numérique pouvait envoyer une valeur absente, sans réellement modifier la valeur persistée.                                   | Une distance ou un dénivelé vide déclenche une erreur visible ; aucune confirmation trompeuse de sauvegarde.                                                                                |
| Haute    | Le lien de préparation « Indications » ne sélectionnait pas le bon onglet.                                                                       | Sélection, défilement et focus vers le champ concerné, y compris lors de clics répétés sur le même lien.                                                                                    |
| Haute    | L’ordre des photos ne disposait pas de commandes explicites alternatives au glisser-déposer ; le cache serveur pouvait restituer l’ancien ordre. | Flèches utilisables au clavier et au toucher ; invalidation des données serveur après réordonnancement.                                                                                     |
| Moyenne  | Les suppressions de photo et de GPX étaient immédiates.                                                                                          | Confirmation, annulation et retour d’échec ; commandes bloquées pendant l’opération.                                                                                                        |
| Moyenne  | L’import des photos utilisait un champ fichier contrôlé et ne détaillait pas la progression du lot.                                              | Champ natif non contrôlé, progression par fichier, traitement séquentiel, liste des fichiers en échec et possibilité de les resélectionner.                                                 |
| Moyenne  | Un aperçu GPX en erreur empêchait de remplacer le fichier depuis cette section.                                                                  | Remplacement, téléchargement et suppression accessibles pendant l’erreur d’aperçu ; validation du format et reprise d’import.                                                               |
| Moyenne  | L’éditeur cumulait des marges et réservait trop peu de place au contenu.                                                                         | Suppression du conteneur imbriqué, colonnes rééquilibrées, préparation de fiche plus compacte et galerie adaptée à la largeur disponible.                                                   |
| Moyenne  | Les actions principales et destructives se disputaient la priorité visuelle.                                                                     | Modification mise en avant ; suppression visuellement secondaire ; retour déterministe vers la catégorie ; cadrage désactivé aux limites.                                                   |
| Moyenne  | Les titres longs, images manquantes et listes vides étaient inégalement traités.                                                                 | Titres lisibles sur plusieurs lignes, icône de remplacement, état vide explicite et compteurs distinguant chargement et erreur.                                                             |
| Moyenne  | Les onglets ne proposaient pas le comportement clavier attendu.                                                                                  | Flèches gauche/droite, Début/Fin, un seul onglet dans l’ordre de tabulation et panneaux ARIA présents.                                                                                      |
| Moyenne  | La fenêtre de modification pouvait afficher un formulaire incomplet après un échec de chargement des options.                                    | État d’erreur avec reprise ; champs désactivés pendant l’enregistrement et rejet des noms constitués d’espaces.                                                                             |

## Vérifications réalisées

- `pnpm --filter 65.front check-types` : réussi.
- `pnpm --filter 65.front lint` : réussi.
- `pnpm --filter 65.front build` : réussi.
- `git diff --check` : réussi.
- Chromium / Playwright : vue d’ensemble, catégorie et éditeur à 320, 390,
  768, 1024 et 1440 px, sans débordement horizontal de la page.
- Inspection des captures : hiérarchie, titres longs, images réelles du projet,
  galerie, fenêtres de création/modification et tailles mobile/bureau.
- axe : aucune violation détectée dans les trois écrans Admin principaux,
  la fenêtre de modification et la section GPX avec carte.
- Parcours : recherche sans distinction de casse, absence de résultat,
  réinitialisation, catégorie vide, ouverture/annulation des formulaires,
  validation du nom et retour vers la liste.
- Sauvegarde : succès, erreur serveur, saisie conservée, reprise, validation
  numérique et modification pendant une requête en cours.
- Navigation du contenu : clavier, lien vers les indications, répétition du
  même lien et focus sur le champ.
- Photos : changement d’ordre conservé après rechargement, validation du
  fichier, échec/reprise d’import, import réussi, annulation et confirmation de
  suppression.
- GPX : format refusé, échec/reprise d’import, carte affichée, erreur d’aperçu,
  conservation des commandes de remplacement/téléchargement, récupération,
  annulation et confirmation de suppression.
- Aucune exception JavaScript non gérée relevée dans les parcours automatisés.

Le détecteur Impeccable a été exécuté une fois sur les surfaces Admin. Ses deux
avertissements concernent le soulignement de 2 px des onglets, classé comme une
bordure de carte. Ce soulignement est conservé intentionnellement : il matérialise
l’onglet actif et suit le composant existant.

## Limites de la vérification

Les interactions ont été exécutées contre une API locale de démonstration avec
des réponses et erreurs contrôlées. Elles vérifient le frontend et ses actions
serveur, sans modifier les données réelles. Elles ne constituent pas une recette
du backend en production ni un audit exhaustif avec lecteur d’écran ou sur
appareils iOS/Android physiques.

La conservation annoncée après une erreur de sauvegarde concerne le formulaire
ouvert ; aucun stockage durable de brouillons hors ligne n’a été ajouté.
