# Render Setup

1. ZIP entpacken.
2. Dateien in GitHub hochladen.
3. Wichtig: `index.html` muss überschrieben werden.
4. In Render:

```text
Build Command: echo "No build needed"
Publish Directory: .
```

5. Danach in Render auf **Manual Deploy → Clear build cache & deploy** klicken.

Wenn die alte Oberfläche weiterhin erscheint, ist höchstwahrscheinlich noch das alte `index.html` aktiv oder in Render ist der falsche Root Directory gesetzt.
