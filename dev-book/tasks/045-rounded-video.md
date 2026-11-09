# Vidéo de fond — landing Rounded

Intégration des deux vidéos fournies dans `ScreenRealEstateRounded`, sur la branche de travail existante `feat/cinematic-landing`.

- Image par défaut : `/?landing=rounded`. Première vidéo uniquement avec `/?landing=rounded&heroVideo=1` (également sur les routes localisées). Sans ce paramètre ou avec une autre valeur, aucune vidéo n’est chargée.
- La seconde vidéo reste archivée dans les fichiers, sans activation par URL.
- Image existante rendue en SSR via AppImage / Nuxt Image, conservée jusqu'au premier événement `playing`.
- Sources vidéo ajoutées uniquement après montage, image prête et screen visible. Aucun préchargement vidéo dans le HTML SSR.
- MP4 H.264, yuv420p, sans audio, faststart ; 1280 px desktop et 640 px mobile. Une seule source sélectionnée par le navigateur.
- Lecture muette en boucle, pause/reprise accessible FR/EN/ES, suspension hors viewport et onglet masqué.
- Pas de chargement en mode économie de données lorsque le navigateur expose saveData, ni avec prefers-reduced-motion.
- Fichiers originaux conservés à la racine. Fichiers servis dans `public/videos/`.

Reproduction de la compression (FFmpeg) :

```bash
ffmpeg -i Animate_this_image_5109562b.mp4 -an -vf scale=1280:-2 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart public/videos/rounded-1.mp4
```

Répéter avec `scale=640:-2` pour `rounded-1-mobile.mp4`, puis avec `Animate_this_image_9fca615e.mp4` pour les variantes `rounded-2`.

Validation : ESLint et Prettier ciblés, type-check Nuxt / vue-tsc réussis. Les gains indiquent les tailles de fichiers, sans mesure Lighthouse sur production.

Vérification navigateur tentée : Chromium ne peut pas démarrer dans cet environnement (`libnspr4.so` manquante). Lecture réelle et comparaison visuelle à valider dans le navigateur local.
