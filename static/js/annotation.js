(() => {
  // State
  let annotatorId = "";
  let clips = [];
  let currentIndex = 0;
  let ratings = { valence: null, arousal: null, dominance: null };
  let activeDimension = "valence"; // which dimension receives keyboard input
  const dimensions = ["valence", "arousal", "dominance"];

  // DOM refs
  const loginScreen = document.getElementById("login-screen");
  const annotationScreen = document.getElementById("annotation-screen");
  const loginForm = document.getElementById("login-form");
  const annotatorInput = document.getElementById("annotator-input");
  const annotatorLabel = document.getElementById("annotator-label");
  const progressLabel = document.getElementById("progress-label");
  const clipName = document.getElementById("clip-name");
  const audioPlayer = document.getElementById("audio-player");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const playbackStatus = document.getElementById("playback-status");
  const currentTimeLabel = document.getElementById("current-time");
  const totalTimeLabel = document.getElementById("total-time");
  const timelineTrack = document.getElementById("timeline-track");
  const timelineFill = document.getElementById("timeline-fill");
  const submitBtn = document.getElementById("submit-btn");
  const doneMessage = document.getElementById("done-message");
  const annotationContent = document.getElementById("annotation-content");

  // Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    annotatorId = annotatorInput.value.trim();
    if (!annotatorId) return;

    clips = await fetchJson("/api/clips");
    if (clips.length === 0) {
      alert("No audio clips found in audio_clips/ directory.");
      return;
    }

    const progress = await fetchJson(`/api/progress/${encodeURIComponent(annotatorId)}`);
    currentIndex = progress.next_index;

    annotatorLabel.textContent = `Annotator: ${annotatorId}`;
    loginScreen.classList.add("hidden");
    annotationScreen.classList.remove("hidden");

    loadClip();
  });

  // Audio playback
  playBtn.addEventListener("click", () => {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  });

  pauseBtn.addEventListener("click", () => {
    if (audioPlayer.paused) {
      if (audioPlayer.ended) {
        audioPlayer.currentTime = 0;
      }
      audioPlayer.play();
      return;
    }
    audioPlayer.pause();
  });

  audioPlayer.addEventListener("loadedmetadata", () => {
    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    totalTimeLabel.textContent = `End: ${formatTime(duration)}`;
    currentTimeLabel.textContent = formatTime(0);
    setTimeline(0);
    playbackStatus.textContent = "Not started";
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Pause";
  });

  audioPlayer.addEventListener("timeupdate", () => {
    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    const current = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0;
    currentTimeLabel.textContent = formatTime(current);
    setTimeline(duration > 0 ? (current / duration) * 100 : 0);
  });

  audioPlayer.addEventListener("play", () => {
    playbackStatus.textContent = "Playing";
    pauseBtn.textContent = "Pause";
  });

  audioPlayer.addEventListener("pause", () => {
    if (audioPlayer.ended) return;
    playbackStatus.textContent = audioPlayer.currentTime > 0 ? "Paused" : "Not started";
    pauseBtn.textContent = audioPlayer.currentTime > 0 ? "Resume" : "Pause";
  });

  audioPlayer.addEventListener("ended", () => {
    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    currentTimeLabel.textContent = formatTime(duration);
    setTimeline(100);
    playbackStatus.textContent = "Finished";
    pauseBtn.textContent = "Resume";
  });

  timelineTrack.addEventListener("click", (e) => {
    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    if (duration <= 0) return;

    const rect = timelineTrack.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audioPlayer.currentTime = ratio * duration;
  });

  // SAM button clicks
  document.querySelectorAll(".sam-row").forEach((row) => {
    const dimension = row.dataset.dimension;
    row.querySelectorAll(".sam-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectRating(dimension, parseInt(btn.dataset.value));
      });
    });
    // Clicking on a row sets it as the active dimension
    row.addEventListener("click", () => {
      setActiveDimension(dimension);
    });
  });

  // Submit
  submitBtn.addEventListener("click", submitAnnotation);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ignore if login screen is active or typing in input
    if (!annotationScreen.classList.contains("hidden") === false) return;
    if (e.target.tagName === "INPUT") return;

    if (e.code === "Space") {
      e.preventDefault();
      audioPlayer.currentTime = 0;
      audioPlayer.play();
    } else if (e.key >= "1" && e.key <= "9") {
      e.preventDefault();
      selectRating(activeDimension, parseInt(e.key));
      // Auto-advance to next unrated dimension
      advanceActiveDimension();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!submitBtn.disabled) submitAnnotation();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const idx = dimensions.indexOf(activeDimension);
      setActiveDimension(dimensions[(idx + 1) % dimensions.length]);
    }
  });

  function setActiveDimension(dim) {
    activeDimension = dim;
    document.querySelectorAll(".sam-row").forEach((row) => {
      row.classList.toggle("active-row", row.dataset.dimension === dim);
    });
  }

  function advanceActiveDimension() {
    // Move to next unrated dimension, or stay if all rated
    for (const dim of dimensions) {
      if (ratings[dim] === null && dim !== activeDimension) {
        setActiveDimension(dim);
        return;
      }
    }
  }

  function selectRating(dimension, value) {
    ratings[dimension] = value;

    // Update button visuals
    const row = document.querySelector(`.sam-row[data-dimension="${dimension}"]`);
    row.querySelectorAll(".sam-btn").forEach((btn) => {
      btn.classList.toggle("selected", parseInt(btn.dataset.value) === value);
    });

    checkSubmitReady();
  }

  function checkSubmitReady() {
    const allRated = dimensions.every((d) => ratings[d] !== null);
    submitBtn.disabled = !allRated;
  }

  async function submitAnnotation() {
    submitBtn.disabled = true;

    const resp = await fetch("/api/annotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        annotator_id: annotatorId,
        filename: clips[currentIndex],
        valence: ratings.valence,
        arousal: ratings.arousal,
        dominance: ratings.dominance,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      alert("Error saving: " + (err.error || "unknown"));
      submitBtn.disabled = false;
      return;
    }

    currentIndex++;
    loadClip();
  }

  function loadClip() {
    // Reset ratings
    ratings = { valence: null, arousal: null, dominance: null };
    document.querySelectorAll(".sam-btn").forEach((b) => b.classList.remove("selected"));
    submitBtn.disabled = true;
    setActiveDimension("valence");

    // Update progress
    progressLabel.textContent = `Clip ${Math.min(currentIndex + 1, clips.length)}/${clips.length}`;

    if (currentIndex >= clips.length) {
      // All done
      annotationContent.classList.add("hidden");
      doneMessage.classList.remove("hidden");
      return;
    }

    doneMessage.classList.add("hidden");
    annotationContent.classList.remove("hidden");

    const filename = clips[currentIndex];
    clipName.textContent = filename;
    playbackStatus.textContent = "Not started";
    currentTimeLabel.textContent = "0:00";
    totalTimeLabel.textContent = "End: --:--";
    pauseBtn.disabled = true;
    pauseBtn.textContent = "Pause / Resume";
    setTimeline(0);
    audioPlayer.src = `/audio/${encodeURIComponent(filename)}`;
    audioPlayer.load();
  }

  function setTimeline(percent) {
    const safePercent = Math.min(Math.max(percent, 0), 100);
    timelineFill.style.width = `${safePercent}%`;
    timelineTrack.setAttribute("aria-valuenow", Math.round(safePercent).toString());
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function fetchJson(url) {
    const resp = await fetch(url);
    return resp.json();
  }
})();
