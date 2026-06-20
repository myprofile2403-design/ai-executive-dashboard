"""
Local Whisper Server for AI Executive Assistant
Run: uvicorn whisper_server:app --host 0.0.0.0 --port 8000
"""

from faster_whisper import WhisperModel
from fastapi import FastAPI, UploadFile, HTTPException
import tempfile
import os

app = FastAPI(title="Local Whisper Server")

# Load model once at startup
# Options: "tiny", "base", "small", "medium", "large-v3"
# CPU: use "small" or "medium" for reasonable speed
# GPU: use "large-v3" for best quality
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "large-v3")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")       # "cuda" for GPU
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")  # "float16" for GPU

print(f"Loading Whisper model: {MODEL_SIZE} on {DEVICE}...")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
print("Model loaded successfully!")


@app.post("/transcribe")
async def transcribe(file: UploadFile):
    """
    Transcribe an audio file using local Whisper model.

    Accepts: .ogg, .mp3, .wav, .m4a, .flac
    Returns: {"text": "transcribed text"}
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    tmp_path = None
    try:
        # Determine file extension from original filename
        suffix = ".ogg"
        if file.filename:
            _, ext = os.path.splitext(file.filename)
            if ext:
                suffix = ext

        # Write to temporary file (avoids concurrency issues with fixed name)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(await file.read())
            tmp_path = f.name

        # Transcribe with Ukrainian language hint
        segments, info = model.transcribe(
            tmp_path,
            language="uk",
            beam_size=5,
            vad_filter=True
        )

        text = " ".join([s.text.strip() for s in segments])

        return {"text": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        # Always clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
