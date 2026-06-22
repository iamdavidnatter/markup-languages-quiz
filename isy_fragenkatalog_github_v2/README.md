# ISY Quiztrainer

Interaktiver Fragenkatalog für die Lehrveranstaltung **Informationssysteme**.

## Inhalt

- 160 Fragen insgesamt
- Originalfragen aus den Probeklausuren
- zusätzliche, thematisch passende Erweiterungsfragen
- Interaktive Web-App mit Auswertung
- Daten zusätzlich als JSON, CSV und Markdown

## Dateien

```text
index.html          Einstiegspunkt der Web-App
styles.css          Design / Benutzeroberfläche
app.js              Quiz-Logik
data/questions.json Fragen als JSON
src/questions.js    Fragen für die Web-App
data/questions.csv  Fragen als CSV
docs/questions.md   Fragen als Markdown
```

## Lokal öffnen

Einfach `index.html` im Browser öffnen.

Alternativ mit kleinem lokalen Server:

```bash
python3 -m http.server 5173
```

Danach im Browser öffnen:

```text
http://localhost:5173
```

## Render Static Site

Wenn `index.html` direkt im Repository liegt:

```text
Root Directory: leer lassen
Build Command: echo "No build needed"
Publish Directory: .
```

Wenn die Dateien in einem Unterordner liegen, z. B. `isy_fragenkatalog_github_v2`, dann:

```text
Root Directory: isy_fragenkatalog_github_v2
Build Command: echo "No build needed"
Publish Directory: .
```

## GitHub Pages

1. Repository erstellen
2. Entpackte Dateien hochladen
3. Settings → Pages öffnen
4. Branch `main` und Root `/` auswählen
5. Speichern

## Bedienung

1. Quelle und Thema auswählen
2. Anzahl der Fragen festlegen
3. Auf **Quiz starten** klicken
4. Antworten auswählen
5. Auf **Quiz auswerten** oder **Frage prüfen** klicken

Die Antworten werden erst nach dem Prüfen grün oder rot markiert.
