"""Tanıtım animasyonunu 1280x720, 60 sn MP4 olarak kaydeder (sosyal medya, YouTube vb. için).
Gereken: pip install playwright && playwright install chromium; ffmpeg.
Önce site yerelde çalışmalı: python -m http.server 8765  →  python tools/record_video.py"""
import subprocess, shutil, os
from playwright.sync_api import sync_playwright
FPS = 15
CSS = """header,footer,.hero>div:first-child,.sources,.steps,.compare,.panel,h2{display:none!important}
.hero{display:block!important;padding:0!important}.wrap{max-width:none!important;padding:0!important}
.player{position:fixed!important;inset:0!important;border-radius:0!important;aspect-ratio:auto!important;z-index:99}
.player .ctrl,.player .pause,.player .time{display:none!important}
.player,.player *{font-family:Poppins,Figtree,sans-serif!important}"""
os.makedirs("video/_kare", exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.goto("http://localhost:8765/index.html"); pg.add_style_tag(content=CSS); pg.wait_for_timeout(800)
    for i in range(60 * FPS):
        pg.evaluate(f"window.__player.seek({i / FPS})")
        pg.screenshot(path=f"video/_kare/{i:05d}.png")
    b.close()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", "video/_kare/%05d.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", "video/tanitim.mp4"], check=True)
shutil.rmtree("video/_kare")
print("video/tanitim.mp4 hazır")
