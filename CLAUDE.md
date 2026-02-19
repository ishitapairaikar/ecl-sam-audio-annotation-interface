Create a GUI interface for annotating 5-second audio clips using the Self-Assessment Manikin (SAM) scales. This will be used by a virtual intern to label pilot study audio segments for comparison with model predictions.

Audio Playback: 
- Load and play 5-second audio clips sequentially 
- Allow unlimited replay of current clip before annotation 
- Auto-advance to next clip after annotation is submitted 
- Display progress (e.g., "Clip 15/200") 

SAM Rating Interface:
- Display all three SAM dimensions: Valence (pleasure): unhappy to happy (top row), Arousal (intensity): calm to excited (middle row), Dominance (control): controlled to in-control (bottom row) 
- 9-point scale for each dimension (1-9) 
- Clear visual representation using SAM figures 
- Click or keyboard input to select rating 

Data Output:
- Save annotations to structured format (CSV or JSON) 
- Include: clip_id, filename, valence, arousal, dominance, timestamp 
- Auto-save progress to prevent data loss 
- Allow resume from last annotated clip
