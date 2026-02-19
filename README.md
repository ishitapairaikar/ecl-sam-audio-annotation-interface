# SAM Audio Annotation Tool

A web app for annotating short audio clips with Self-Assessment Manikin (SAM) ratings:
- Valence (1-9)
- Arousal (1-9)
- Dominance (1-9)

Each annotator's results are saved to their own CSV file in `annotations/`.

## 1) Clone the repository

```sh
git clone https://github.com/ishitapairaikar/ECL_UI_tool.git
cd ECL_UI_tool
```

## 2) Add your audio files

Put input audio in `audio_clips/`.

Supported formats:
- `.wav`
- `.mp3`
- `.ogg`
- `.flac`
- `.m4a`

## 3) Run the app

### Option A (Recommended): Docker

Prerequisite: Docker Desktop installed.

```sh
docker compose up --build
```

Open: http://localhost:5000

Notes:
- Dependencies are installed in the container, not on your machine.
- `audio_clips/` and `annotations/` are mounted, so your data remains local.
- Stop with `Ctrl+C`, then remove the container with:

```sh
docker compose down
```

### Option B: Local Python

Prerequisite: Python 3.10+ installed.

```sh
pip install -r requirements.txt
python app.py
```

Open: http://localhost:5000

## 4) Annotate clips

1. Enter your annotator ID (example: `intern_01`).
2. Listen to the clip (`Play` button or `Space`).
3. Rate valence, arousal, and dominance (1-9 each).
4. Submit (`Submit` button or `Enter`) to save and continue.

Progress resumes automatically if you reopen the browser with the same annotator ID.

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
| Pause/Resume button | Pause or continue playback |
| `1`-`9` | Select rating for active dimension |
| `Tab` | Switch active dimension |
| `Enter` | Submit annotation |

## Data Output

Annotations are saved as CSV files in `annotations/`, one file per annotator (for example, `annotations/intern_01.csv`).

Columns: `clip_id`, `filename`, `valence`, `arousal`, `dominance`, `annotator`, `timestamp`

## Sharing with multiple annotators

1. Ask each person to clone the repo and run with Docker.
2. Share the same `audio_clips/` set with everyone.
3. Give each annotator a unique annotator ID.
4. Collect each person's CSV from `annotations/` when done.

If you run centrally on one machine, keep unique annotator IDs to prevent row mixing.

## Project Structure

```
ECL_UI_tool/
  app.py              # Flask server
  requirements.txt    # Dependencies
  Dockerfile          # Container image definition
  docker-compose.yml  # Local container run config
  templates/
    index.html        # Login + annotation UI
  static/
    js/annotation.js  # Client logic
    css/style.css     # Styling
    img/sam/          # SAM figure SVGs
  audio_clips/        # Input audio files
  annotations/        # CSV output (auto-created)
```
