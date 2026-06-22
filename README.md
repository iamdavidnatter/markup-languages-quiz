# ISY Quiztrainer v3

Interaktiver Fragenkatalog für Informationssysteme.

## Wichtiges Update in v3

Diese Version nutzt absichtlich neue Dateinamen:

- `styles-v3.css`
- `app-v3.js`

Dadurch werden alte Browser-/Render-Caches umgangen.

## Render-Konfiguration

Wenn `index.html` direkt im Root des Repositories liegt:

```text
Build Command: echo "No build needed"
Publish Directory: .
Root Directory: leer lassen
```

Wenn der gesamte Ordner `isy_fragenkatalog_github_v3` ins Repository hochgeladen wurde:

```text
Root Directory: isy_fragenkatalog_github_v3
Build Command: echo "No build needed"
Publish Directory: .
```

## Prüfen, ob die richtige Version live ist

Oben auf der Seite muss stehen:

```text
Informationssysteme · Quiztrainer v3
```

Falls noch `ISY Fragenkatalog` sichtbar ist, ist noch die alte Version deployed oder Render nutzt den falschen Root Directory.
