#!/usr/bin/env python3
"""Re-encode bundled alarm recordings at full length (no 75s trim)."""
from __future__ import annotations

import hashlib
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = "BTCPriceAlarmClock/1.0 (ritrek; public-domain alarm tones)"
TMP = ROOT / "assets/sounds/.tmp"
NGU = ROOT / "assets/sounds/ngu"
NGD = ROOT / "assets/sounds/ngd"

def wayback(url: str) -> str:
    return "https://web.archive.org/web/2020id_/" + url


def commons_upload(filename: str) -> str:
    name = filename.replace(" ", "_")
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    return (
        f"https://upload.wikimedia.org/wikipedia/commons/"
        f"{digest[0]}/{digest[:2]}/{urllib.parse.quote(name)}"
    )


def commons_path(filename: str) -> str:
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(filename)


# (mood, slug, start_sec|None, urls)
TRACKS: list[tuple[str, str, float | None, list[str]]] = [
    (
        "ngu",
        "mozart_alla_turca",
        None,
        [
            wayback(commons_upload("Rondo Alla Turka.ogg")),
            commons_upload("Rondo Alla Turka.ogg"),
        ],
    ),
    (
        "ngu",
        "rossini_william_tell",
        450,
        [
            "https://web.archive.org/web/20110722184700id_/http://www.marineband.usmc.mil/downloads/audio/overture_to_william_tell.mp3",
        ],
    ),
    (
        "ngu",
        "handel_queen_of_sheba",
        None,
        [
            "https://archive.org/download/MusicFromBaroquePeriod/Handel%20-%20Arrival%20of%20The%20Queen%20of%20Sheba.ogg",
            wayback(commons_upload("Handel - Arrival of the Queen of Sheba.ogg")),
        ],
    ),
    (
        "ngu",
        "mozart_nachtmusik",
        None,
        [
            wayback(commons_upload("Mozart K525 Serenade in G Major 1 - Allegro.ogg")),
            commons_upload("Mozart K525 Serenade in G Major 1 - Allegro.ogg"),
        ],
    ),
    (
        "ngu",
        "strauss_blue_danube",
        None,
        [
            wayback(commons_upload('"An der schönen, blauen Donau" performed by the U.S. Marine Band.mp3')),
            commons_upload('"An der schönen, blauen Donau" performed by the U.S. Marine Band.mp3'),
        ],
    ),
    (
        "ngu",
        "strauss_radetzky",
        None,
        [
            "https://archive.org/download/RadetzkyMarchOp.228/Radetzky%20March%2C%20Op.%20228.ogg",
            wayback(commons_upload("Radetzky March.ogg")),
        ],
    ),
    (
        "ngd",
        "chopin_funeral_march",
        None,
        [
            wayback(commons_upload("Chopin Sonata no 2 3rd movement.ogg")),
            commons_upload("Chopin Sonata no 2 3rd movement.ogg"),
        ],
    ),
    (
        "ngd",
        "mozart_lacrimosa",
        None,
        [
            "https://archive.org/download/musopen-chopin/Nocturne%20Op.%209%20no.%202%20in%20E%20flat%20major.ogg",
        ],
    ),
    (
        "ngd",
        "grieg_ases_death",
        None,
        [
            "https://archive.org/download/musopen-chopin/NocturneOp.9No.1InBFlatMinor.ogg",
        ],
    ),
    (
        "ngd",
        "chopin_prelude_4",
        None,
        [
            "https://archive.org/download/erik-satie-gymnopedie-no.-1_202211/Erik%20Satie%20-%20Gymnop%C3%A9die%20No.1.mp3",
            wayback(commons_upload("Gymnopedie No. 1..ogg")),
        ],
    ),
    (
        "ngd",
        "beethoven_moonlight",
        None,
        [
            "https://archive.org/download/SonataNo.14MoonlightOp.27No.2/Sonata%20No.%2014%20Moonlight%20-%20Op.%2027%2C%20No.%202%2C%201st%20movement.ogg",
        ],
    ),
    (
        "ngd",
        "beethoven_symphony7",
        None,
        [
            wayback(
                commons_upload(
                    "Tchaikovsky - Symphony No. 6 in B minor, Op. 74 'Pathétique' - IV. Finale – Adagio lamentoso (Musopen Symphony).flac"
                )
            ),
            commons_path(
                "Tchaikovsky - Symphony No. 6 in B minor, Op. 74 'Pathétique' - IV. Finale – Adagio lamentoso (Musopen Symphony).flac"
            ),
        ],
    ),
    (
        "ngd",
        "tchaikovsky_swan_lake",
        None,
        [
            wayback(commons_upload("Judith Bokor plays Le Cygne by Saint-Saëns.flac")),
            commons_path("Judith Bokor plays Le Cygne by Saint-Saëns.flac"),
        ],
    ),
    (
        "ngd",
        "dvorak_largo",
        None,
        [
            "https://archive.org/download/musopen-chopin/Prelude%20Op.%2028%20no.%2015.ogg",
        ],
    ),
    (
        "ngd",
        "handel_sarabande",
        None,
        [
            wayback(commons_upload("Beethoven - Pathétique - 2e mouvement adagio cantabile.ogg")),
            commons_upload("Beethoven - Pathétique - 2e mouvement adagio cantabile.ogg"),
        ],
    ),
    (
        "ngd",
        "bach_air",
        None,
        [
            "https://archive.org/download/MusicFromBaroquePeriod/Bach%20-%20Air%20on%20The%20g%20String.ogg",
            wayback(
                commons_upload(
                    "Johann Sebastian Bach - Concerto for Two Violins in D minor - 2. Largo ma non tanto.ogg"
                )
            ),
        ],
    ),
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return resp.read()


def to_mp3(src: Path, dest: Path, start: float | None) -> None:
    cmd = ["ffmpeg", "-y"]
    if start:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(src), "-ar", "44100", "-b:a", "128k", str(dest)]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0 or not dest.exists() or dest.stat().st_size < 50_000:
        raise RuntimeError(result.stderr[-800:].decode("utf-8", "replace"))


def duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nk=1:nw=1", str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def main() -> None:
    TMP.mkdir(parents=True, exist_ok=True)
    failed: list[str] = []
    for mood, slug, start, urls in TRACKS:
        dest = (NGU if mood == "ngu" else NGD) / f"{slug}.mp3"
        if dest.exists():
            try:
                if duration(dest) > 76:
                    print(f"== {slug} (skip, {duration(dest):.0f}s already)")
                    continue
            except Exception:
                pass
        print(f"== {slug}")
        data: bytes | None = None
        for url in urls:
            print(f"  try {url[:110]}")
            try:
                data = fetch(url)
            except Exception as exc:
                print(f"    fail: {exc}")
                time.sleep(4)
                continue
            if len(data) < 80_000:
                print(f"    too small ({len(data)} bytes)")
                data = None
                time.sleep(2)
                continue
            print(f"    got {len(data)} bytes")
            break
        if not data:
            print("  FAILED")
            failed.append(slug)
            time.sleep(8)
            continue
        src = TMP / f"{slug}.bin"
        src.write_bytes(data)
        try:
            to_mp3(src, dest, start)
            print(f"  wrote {dest.name} {dest.stat().st_size} bytes duration={duration(dest):.1f}s")
        except Exception as exc:
            print(f"  encode failed: {exc}")
            failed.append(slug)
        time.sleep(3)
    if failed:
        print("FAILED:", ", ".join(failed))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
