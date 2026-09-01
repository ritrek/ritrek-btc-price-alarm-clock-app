#!/usr/bin/env python3
"""Download CC0/PD classical recordings from Wikimedia Commons, else generate a placeholder tone."""
from __future__ import annotations

import json
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = "BTCPriceAlarmClock/1.0 (ritrek; public-domain alarm tones)"

TRACKS = [
    ("ngu", "offenbach_cancan", ["Offenbach - Orpheus in the Underworld - Overture, Can Can section.ogg"], 523, 784),
    ("ngu", "beethoven_ode_to_joy", ["Beethoven Symphony No. 9 - IV Finale.ogg", "Ode to Joy.ogg"], 392, 523),
    ("ngu", "mozart_alla_turca", ["Mozart - Piano Sonata No. 11 - III. Alla Turca.ogg", "Rondo Alla Turca.ogg"], 659, 880),
    ("ngu", "vivaldi_spring", ["Vivaldi - Four Seasons 1 Spring mvt 1 Allegro.ogg", "The Four Seasons - Spring.ogg"], 587, 880),
    ("ngu", "rossini_william_tell", ["Rossini - William Tell Overture (finale).ogg", "William Tell Overture Finale.ogg"], 698, 932),
    ("ngu", "handel_queen_of_sheba", ["Handel - Arrival of the Queen of Sheba.ogg"], 440, 660),
    ("ngu", "mozart_nachtmusik", ["Mozart - Eine kleine Nachtmusik - 1. Allegro.ogg"], 494, 740),
    ("ngu", "strauss_blue_danube", ["Johann Strauss II - An der schönen blauen Donau.ogg", "The Blue Danube.ogg"], 349, 523),
    ("ngu", "strauss_radetzky", ["Johann Strauss Sr. - Radetzky March.ogg", "Radetzky March.ogg"], 392, 587),
    ("ngu", "handel_hallelujah", ["Handel - Messiah - 44. Hallelujah.ogg", "Hallelujah Chorus.ogg"], 523, 659),
    ("ngd", "chopin_funeral_march", ["Chopin - Piano Sonata No. 2 - III. Marche funèbre.ogg", "Marche funèbre.ogg"], 196, 247),
    ("ngd", "mozart_lacrimosa", ["Mozart - Requiem - Lacrimosa.ogg"], 220, 277),
    ("ngd", "grieg_ases_death", ["Grieg - Aase's Death.ogg", "Peer Gynt - The Death of Ase.ogg"], 174, 220),
    ("ngd", "chopin_prelude_4", ["Chopin Prelude Op. 28 No. 4.ogg", "Chopin - Prelude Opus 28 No. 4.ogg"], 185, 233),
    ("ngd", "beethoven_moonlight", ["Beethoven Moonlight Sonata 1st movement.ogg", "Moonlight Sonata - I. Adagio sostenuto.ogg"], 207, 311),
    ("ngd", "beethoven_symphony7", ["Beethoven Symphony No. 7 - II. Allegretto.ogg"], 233, 294),
    ("ngd", "tchaikovsky_swan_lake", ["Tchaikovsky - Swan Lake - Scene.ogg"], 246, 311),
    ("ngd", "dvorak_largo", ["Dvořák - Symphony No. 9 - II. Largo.ogg", "Dvorak Symphony 9 Largo.ogg"], 196, 262),
    ("ngd", "handel_sarabande", ["Handel - Sarabande.ogg"], 165, 196),
    ("ngd", "bach_air", ["Bach - Air on the G String.ogg", "Bach - Orchestral Suite No. 3 - Air.ogg"], 220, 330),
]


def request(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read()


def search_commons(title: str) -> str | None:
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"filetype:audio {title}",
            "gsrlimit": "5",
            "gsrnamespace": "6",
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
        }
    )
    try:
        data = json.loads(request(f"https://commons.wikimedia.org/w/api.php?{query}"))
    except Exception as exc:
        print(f"search failed {title}: {exc}")
        return None
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        mime = info.get("mime") or ""
        url = info.get("url")
        if url and ("audio" in mime or url.endswith((".ogg", ".oga", ".flac", ".mp3", ".wav"))):
            return url
    return None


def file_url(filename: str) -> str | None:
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "titles": f"File:{filename}",
            "prop": "imageinfo",
            "iiprop": "url",
        }
    )
    try:
        data = json.loads(request(f"https://commons.wikimedia.org/w/api.php?{query}"))
        pages = (data.get("query") or {}).get("pages") or {}
        for page in pages.values():
            infos = page.get("imageinfo") or []
            if infos and infos[0].get("url"):
                return infos[0]["url"]
    except Exception as exc:
        print(f"lookup failed {filename}: {exc}")
    return None


def ffmpeg_mp3(src: Path, dest: Path) -> bool:
    cmd = [
        "ffmpeg", "-y", "-i", str(src), "-ar", "44100", "-b:a", "128k", str(dest),
    ]
    result = subprocess.run(cmd, capture_output=True)
    return result.returncode == 0 and dest.exists() and dest.stat().st_size > 5000


def gen_tone(dest: Path, f1: int, f2: int) -> None:
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"sine=frequency={f1}:duration=75",
        "-f", "lavfi", "-i", f"sine=frequency={f2}:duration=75",
        "-filter_complex", "[0][1]amix=inputs=2:duration=longest,volume=0.35",
        "-ac", "1", "-ar", "44100", "-b:a", "96k", str(dest),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main() -> None:
    ngu = ROOT / "assets/sounds/ngu"
    ngd = ROOT / "assets/sounds/ngd"
    ngu.mkdir(parents=True, exist_ok=True)
    ngd.mkdir(parents=True, exist_ok=True)
    tmp = ROOT / "assets/sounds/.tmp"
    tmp.mkdir(exist_ok=True)

    for mood, slug, names, f1, f2 in TRACKS:
        dest = (ngu if mood == "ngu" else ngd) / f"{slug}.mp3"
        if dest.exists() and dest.stat().st_size > 20000:
            print(f"skip {dest.name}")
            continue
        url = None
        for name in names:
            url = file_url(name)
            if url:
                break
        if not url:
            url = search_commons(names[0].replace(".ogg", ""))
        src = tmp / f"{slug}.src"
        if url:
            print(f"download {slug} <- {url}")
            try:
                src.write_bytes(request(url))
                if ffmpeg_mp3(src, dest):
                    print(f"ok {dest.name}")
                    src.unlink(missing_ok=True)
                    continue
            except Exception as exc:
                print(f"failed {slug}: {exc}")
        print(f"placeholder {dest.name}")
        gen_tone(dest, f1, f2)

    fallback = ROOT / "assets/sounds/fallback_chime.mp3"
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=880:duration=1.5",
            "-ac", "1", "-ar", "44100", "-b:a", "96k", str(fallback),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("done")


if __name__ == "__main__":
    main()
