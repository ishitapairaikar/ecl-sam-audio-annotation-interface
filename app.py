import csv
import os
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_from_directory

app = Flask(__name__)

AUDIO_DIR = Path("audio_clips")
ANNOTATIONS_DIR = Path("annotations")

AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a"}
OUTPUT_FIELDS = [
    "clip_id", "filename", "valence", "arousal", "dominance", "annotator", "timestamp"
]


def get_audio_files():
    """Return sorted list of audio filenames in audio_clips/."""
    if not AUDIO_DIR.exists():
        return []
    return sorted(
        f.name for f in AUDIO_DIR.iterdir()
        if f.suffix.lower() in AUDIO_EXTENSIONS
    )


def get_annotations_path(annotator_id):
    """Return CSV path for a given annotator."""
    safe_id = "".join(c for c in annotator_id if c.isalnum() or c in "-_")
    return ANNOTATIONS_DIR / f"{safe_id}.csv"


def get_annotated_clips(annotator_id):
    """Return set of clip filenames already annotated by this annotator."""
    path = get_annotations_path(annotator_id)
    if not path.exists():
        return set()
    annotated = set()
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            annotated.add(row["filename"])
    return annotated


def normalize_existing_annotations(path, annotator_id):
    """Ensure an existing CSV matches the expected output schema."""
    if not path.exists():
        return

    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        existing_fields = reader.fieldnames or []
        rows = list(reader)

    if existing_fields == OUTPUT_FIELDS:
        return

    normalized_rows = []
    for row in rows:
        filename = (row.get("filename") or "").strip()
        if not filename:
            continue

        clip_raw = (row.get("clip_id") or "").strip()
        try:
            clip_num = int(clip_raw)
        except (TypeError, ValueError):
            clip_num = 0

        ts_raw = (row.get("timestamp") or "").strip()
        if ts_raw:
            try:
                ts_raw = datetime.fromisoformat(ts_raw).isoformat(timespec="seconds")
            except ValueError:
                pass

        normalized_rows.append({
            "clip_id": f"{clip_num:03d}" if clip_num > 0 else "000",
            "filename": filename,
            "valence": row.get("valence", ""),
            "arousal": row.get("arousal", ""),
            "dominance": row.get("dominance", ""),
            "annotator": (row.get("annotator") or row.get("annotator_id") or annotator_id),
            "timestamp": ts_raw,
        })

    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(normalized_rows)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/clips")
def api_clips():
    """Return list of all audio clip filenames."""
    return jsonify(get_audio_files())


@app.route("/api/progress/<annotator_id>")
def api_progress(annotator_id):
    """Return number of clips already annotated by this annotator."""
    clips = get_audio_files()
    annotated = get_annotated_clips(annotator_id)
    # Return the index of the first unannotated clip
    next_index = 0
    for i, clip in enumerate(clips):
        if clip not in annotated:
            next_index = i
            break
    else:
        # All clips annotated
        next_index = len(clips)
    return jsonify({
        "total": len(clips),
        "completed": len(annotated),
        "next_index": next_index,
    })


@app.route("/api/annotate", methods=["POST"])
def api_annotate():
    """Save a single annotation row."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    required = ["annotator_id", "filename", "valence", "arousal", "dominance"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        valence = int(data["valence"])
        arousal = int(data["arousal"])
        dominance = int(data["dominance"])
    except (TypeError, ValueError):
        return jsonify({"error": "Ratings must be integers from 1 to 9"}), 400

    if any(score < 1 or score > 9 for score in (valence, arousal, dominance)):
        return jsonify({"error": "Ratings must be integers from 1 to 9"}), 400

    annotator_id = data["annotator_id"]
    path = get_annotations_path(annotator_id)

    ANNOTATIONS_DIR.mkdir(exist_ok=True)
    normalize_existing_annotations(path, annotator_id)
    file_exists = path.exists()

    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
        if not file_exists:
            writer.writeheader()

        # clip_id is 1-indexed position in the sorted list
        clips = get_audio_files()
        clip_num = clips.index(data["filename"]) + 1 if data["filename"] in clips else 0

        writer.writerow({
            "clip_id": f"{clip_num:03d}" if clip_num > 0 else "000",
            "filename": data["filename"],
            "valence": valence,
            "arousal": arousal,
            "dominance": dominance,
            "annotator": annotator_id,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
        })

    return jsonify({"status": "ok"})


@app.route("/audio/<path:filename>")
def serve_audio(filename):
    """Serve audio files from the audio_clips directory."""
    return send_from_directory(AUDIO_DIR, filename)


if __name__ == "__main__":
    AUDIO_DIR.mkdir(exist_ok=True)
    ANNOTATIONS_DIR.mkdir(exist_ok=True)
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
