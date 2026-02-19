# SAM Audio Annotation Tool

A web-based tool for annotating 5-second audio clips using the Self-Assessment Manikin (SAM) scales. Built for labeling pilot study audio segments with valence, arousal, and dominance ratings.

## Setup

```sh
pip install -r requirements.txt
```

Place your audio files (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`) in the `audio_clips/` directory.

## Usage

Start the server:

```sh
python app.py
```

Open http://localhost:5000 in your browser.

1. Enter an annotator ID (e.g., `intern_01`)
2. Play the audio clip (click Play or press `Space`) — replay as many times as needed
3. Rate all three SAM dimensions on a 1-9 scale
4. Click Submit (or press `Enter`) to save and advance to the next clip

Closing the browser and reopening will resume from the last unannotated clip.

## SAM Dimensions

| Dimension | Scale | Low (1) | High (9) |
|-----------|-------|---------|----------|
| Valence   | 1-9   | Unhappy | Happy |
| Arousal   | 1-9   | Calm | Excited |
| Dominance | 1-9   | Controlled | In-control |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / replay audio |
| `1`-`9` | Select rating for active dimension |
| `Tab` | Switch active dimension |
| `Enter` | Submit annotation |

## Data Output

Annotations are saved as CSV files in `annotations/`, one file per annotator (e.g., `annotations/intern_01.csv`).

Columns: `clip_id`, `filename`, `valence`, `arousal`, `dominance`, `timestamp`

## Project Structure

```
emotion_lab/
  app.py              # Flask server
  requirements.txt    # Dependencies
  templates/
    index.html        # Login + annotation UI
  static/
    js/annotation.js  # Client logic
    css/style.css     # Styling
    img/sam/          # SAM figure SVGs (optional)
  audio_clips/        # Place audio files here
  annotations/        # CSV output (auto-created)
```
