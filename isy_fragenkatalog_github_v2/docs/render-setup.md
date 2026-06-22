# Render Setup

Für Render als **Static Site** verwenden.

## Standardfall: Dateien liegen direkt im Repository

```text
Name: informationssysteme-quiz
Branch: main
Root Directory: leer lassen
Build Command: echo "No build needed"
Publish Directory: .
Environment Variables: leer lassen
```

## Wenn ein Unterordner verwendet wird

```text
Root Directory: isy_fragenkatalog_github_v2
Build Command: echo "No build needed"
Publish Directory: .
```

Wichtig: Bei Build Command kein einzelnes `$` eintragen.
