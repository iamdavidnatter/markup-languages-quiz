# ISY Fragenkatalog – GitHub-ready

Dieser Ordner enthält einen strukturierten Fragenkatalog für **Informationssysteme (ISY)**.

## Inhalt

- **80 Originalfragen** aus den bereitgestellten Probeklausuren `SS2023` und `HK2025`
- **80 zusätzliche, thematisch passende Erweiterungsfragen**
- Gesamt: **160 Fragen**

## Dateien

```text
src/questions.js          JavaScript-Fragenbank für die Quiz-App
data/questions.json       strukturierte JSON-Version
data/questions.csv        CSV-Version für Excel/Import
docs/questions.md         lesbare Markdown-Version mit Lösungen
index.html                einfache lokale Quiz-Oberfläche
styles.css                Styling der Quiz-Oberfläche
app.js                    Quiz-Logik
```

## Nutzung

1. ZIP entpacken.
2. Ordner in ein GitHub-Repository hochladen.
3. `index.html` im Browser öffnen oder GitHub Pages aktivieren.
4. In der Oberfläche kann nach Quelle und Thema gefiltert werden.

## Datenformat

Jede Frage enthält:

- `id`
- `source`
- `topic`
- `type`
- `question`
- `options`
- `correct`
- `explanation`
- `tags`

## Hinweis

Die Originalfragen wurden aus den bereitgestellten Prüfungsscreenshots strukturiert übertragen. Bei Zuordnungs- und Lückentextfragen wurden die Antworten als maschinenlesbare Paare bzw. Listen abgebildet.
