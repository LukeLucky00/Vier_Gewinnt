# Vier Gewinnt

Ein Multiplayer-"Vier Gewinnt"-Spiel mit Socket.io für echtes Online-Spielerlebnis.

## Features

- Klassisches "Vier Gewinnt" Spielerlebnis
- Multiplayer über Netzwerk
- Einfaches Erstellen und Beitreten von Spielen
- Moderne, responsive Benutzeroberfläche
- Animation der fallenden Spielsteine
- Markieren der Gewinnkombination

## Installation

1. Stelle sicher, dass [Node.js](https://nodejs.org/) installiert ist (mindestens Version 14.x)
2. Klone dieses Repository oder entpacke die heruntergeladene Datei
3. Öffne ein Terminal im Projektverzeichnis
4. Installiere die Abhängigkeiten:

```
npm install
```

## Spielanleitung

1. Starte den Server mit:

```
npm start
```

2. Öffne einen Browser und navigiere zu `http://localhost:3000`
3. Wähle "Neues Spiel erstellen"
4. Teile den angezeigten Spiel-Code mit einem Freund
5. Der andere Spieler öffnet ebenfalls die Webseite und wählt "Einem Spiel beitreten"
6. Er gibt den erhaltenen Code ein und klickt auf "Beitreten"
7. Das Spiel beginnt! Klicke auf eine Spalte, um deinen Spielstein fallen zu lassen
8. Gewonnen hat, wer als erstes vier Steine in einer Reihe platziert (horizontal, vertikal oder diagonal)

## Spielregeln

- Spieler setzen abwechselnd einen Spielstein in eine der sieben Spalten
- Steine fallen immer auf die unterste freie Position in der gewählten Spalte
- Gewonnen hat, wer als erstes vier seiner Spielsteine in einer Reihe anordnet (horizontal, vertikal oder diagonal)
- Wenn alle Felder gefüllt sind und niemand vier in einer Reihe hat, endet das Spiel unentschieden

## Netzwerkbenutzer

Um mit anderen Benutzern in deinem lokalen Netzwerk zu spielen:

1. Finde die lokale IP-Adresse deines Computers (z.B. mit `ipconfig` unter Windows oder `ifconfig` unter Linux/Mac)
2. Starte den Server wie oben beschrieben
3. Andere Spieler können über `http://DEINE_IP_ADRESSE:3000` auf das Spiel zugreifen (ersetze DEINE_IP_ADRESSE durch deine tatsächliche IP-Adresse)

## Technologien

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- Echtzeit-Kommunikation: Socket.io

## Lizenz

Frei zur privaten und kommerziellen Nutzung. 