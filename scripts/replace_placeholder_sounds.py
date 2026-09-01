#!/usr/bin/env python3
"""Replace placeholder sine-wave MP3s with public-domain / CC0 / CC-BY recordings."""
from __future__ import annotations

import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = "BTCPriceAlarmClock/1.0 (https://github.com/ritrek; public-domain alarm tones)"
TMP = ROOT / "assets/sounds/.tmp"
NGU = ROOT / "assets/sounds/ngu"
NGD = ROOT / "assets/sounds/ngd"

# dest slug -> (mood, start_sec, filenames to try on Commons FilePath)
# Prefer PD / CC0 / US-government; CC-BY-SA allowed with attribution in LICENSES.md.
TRACKS: list[tuple[str, str, float, list[str]]] = [
    (
        "ngu",
        "mozart_alla_turca",
        0,
        ["Rondo Alla Turka.ogg", "Mozart - Piano Sonata No. 11 - III. Alla Turca.ogg"],
    ),
    (
        "ngu",
        "vivaldi_spring",
        0,
        [
            "Vivaldi - Four Seasons 1 Spring mvt 1 Allegro - John Harrison violin.oga",
            "01 - Vivaldi Spring mvt 1 Allegro - John Harrison violin.ogg",
        ],
    ),
    (
        "ngu",
        "rossini_william_tell",
        450,  # finale of US Marine Band full overture
        [
            "Gioachino Rossini, William Tell Overture (military band version, 2000).ogg",
            "William Tell Overture - Edison.ogg",
        ],
    ),
    (
        "ngu",
        "handel_queen_of_sheba",
        0,
        ["Handel - Arrival of the Queen of Sheba.ogg"],
    ),
    (
        "ngu",
        "mozart_nachtmusik",
        0,
        [
            "Mozart K525 Serenade in G Major 1 - Allegro.ogg",
            "Mozart - Eine kleine Nachtmusik - 1. Allegro.ogg",
            "Eine kleine Nachtmusik - I. Allegro.ogg",
            "Mozart K525 Serenade in G Major 3 - Minuet.ogg",
        ],
    ),
    (
        "ngu",
        "strauss_blue_danube",
        0,
        [
            '"An der schönen, blauen Donau" performed by the U.S. Marine Band.mp3',
            "An der schönen, blauen Donau performed by the U.S. Marine Band.mp3",
            "Johann Strauss jr - An der schönen blauen Donau Op. 314.ogg",
            "Strauss, An der schönen blauen Donau.ogg",
        ],
    ),
    (
        "ngu",
        "strauss_radetzky",
        0,
        [
            "Radetzky March.ogg",
            "Johann Strauss Sr. - Radetzky March.ogg",
            "Radetzky-Marsch.ogg",
            "Johann Strauss I Radetzky March.ogg",
        ],
    ),
    (
        "ngu",
        "handel_hallelujah",
        0,
        ["Handel Messiah Hallelujah by Oratorio Chorus.ogg", "Handel - Messiah - 44. Hallelujah.ogg"],
    ),
    (
        "ngd",
        "chopin_funeral_march",
        0,
        [
            "Chopin Sonata no 2 3rd movement.ogg",
            "Frederic Chopin - Marche funèbre.ogg",
            "Chopin_-_Piano_Sonata_No._2_-_III._Marche_funèbre.ogg",
        ],
    ),
    (
        "ngd",
        "mozart_lacrimosa",
        0,
        ["Mozart - Requiem - Lacrimosa.ogg", "Mozart Requiem Lacrimosa.ogg", "Lacrimosa Mozart.ogg"],
    ),
    (
        "ngd",
        "grieg_ases_death",
        0,
        [
            "Edvard Grieg - Peer Gynt - Aases death.ogg",
            "Grieg - Aases Death.ogg",
            "Peer Gynt Suite - The Death of Ase.ogg",
            "Aases Tod.ogg",
        ],
    ),
    (
        "ngd",
        "chopin_prelude_4",
        0,
        [
            "Chopin Prelude Op. 28 No. 4.ogg",
            "Chopin - Prelude Opus 28 No. 4.ogg",
            "Frédéric Chopin - Prelude in E minor, Op. 28, No. 4.ogg",
        ],
    ),
    (
        "ngd",
        "beethoven_moonlight",
        0,
        [
            "Moonlight Sonata.ogg",
            "Beethoven Moonlight Sonata 1st movement.ogg",
            "Piano Sonata No.14 Moonlight I. Adagio sostenuto.ogg",
        ],
    ),
    (
        "ngd",
        "beethoven_symphony7",
        0,
        [
            "Beethoven Symphony No. 7 - II. Allegretto.ogg",
            "Ludwig van Beethoven - Symphony No. 7 in A major, Op. 92 - II. Allegretto.ogg",
            "Beethoven 7th Symphony 2nd movement.ogg",
        ],
    ),
    (
        "ngd",
        "tchaikovsky_swan_lake",
        0,
        [
            "Tchaikovsky - Swan Lake - Scene.ogg",
            "Swan Lake Scene.ogg",
            "Tchaikovsky Swan Lake Op.20 Act II No.10 Scene.ogg",
        ],
    ),
    (
        "ngd",
        "dvorak_largo",
        0,
        [
            "Dvorak Symphony 9 Largo.ogg",
            "Antonín Dvořák - Symphony No. 9 - II. Largo.ogg",
            "Dvořák - New World Symphony - Largo.ogg",
            "From the New World - Largo.ogg",
        ],
    ),
    (
        "ngd",
        "handel_sarabande",
        0,
        ["Handel - Sarabande.ogg", "George Frideric Handel - Sarabande.ogg", "Handel Sarabande HWV 437.ogg"],
    ),
    (
        "ngd",
        "bach_air",
        0,
        [
            "Johann Sebastian Bach - Air on the G String.ogg",
            "Bach - Air - Orchestral Suite No. 3.ogg",
            "Bach Air from Orchestral Suite No. 3.ogg",
            "Air on the G String.ogg",
            "BWV 1068 - Air.ogg",
        ],
    ),
]

# Fallback pieces (same mood) if the named work cannot be found.
SUBSTITUTES: dict[str, tuple[str, str, list[str]]] = {
    "strauss_radetzky": (
        "Sousa – Stars and Stripes Forever",
        "ngu/strauss_radetzky.mp3",
        [
            "Stars and Stripes Forever.ogg",
            "The Stars and Stripes Forever (Sousa) - U.S. Marine Band.ogg",
            "Sousa - Stars and Stripes Forever.ogg",
        ],
    ),
    "mozart_nachtmusik": (
        "Mozart – The Magic Flute Overture",
        "ngu/mozart_nachtmusik.mp3",
        ["Mozart - Magic Flute Overture.ogg", "Marriage of Figaro.ogg"],
    ),
    "mozart_lacrimosa": (
        "Chopin – Nocturne Op. 9 No. 2",
        "ngd/mozart_lacrimosa.mp3",
        [
            "Frederic Chopin - Nocturne Eb major Opus 9, number 2.ogg",
            "Chopin, Nocturne No. 1 in B Flat Minor, Op. 9.ogg",
        ],
    ),
    "grieg_ases_death": (
        "Chopin – Nocturne Op. 9 No. 1",
        "ngd/grieg_ases_death.mp3",
        [
            "Chopin, Nocturne No. 1 in B Flat Minor, Op. 9.ogg",
            "Frederic Chopin - Nocturne Eb major Opus 9, number 2.ogg",
        ],
    ),
    "chopin_prelude_4": (
        "Satie – Gymnopédie No. 1",
        "ngd/chopin_prelude_4.mp3",
        ["Gymnopedie No. 1..ogg", "Gymnopedie No. 1.ogg", "Erik Satie - Gymnopédie No. 1.ogg"],
    ),
    "beethoven_symphony7": (
        "Tchaikovsky – Pathétique, 4th mov. (Musopen)",
        "ngd/beethoven_symphony7.mp3",
        [
            "Tchaikovsky - Symphony No. 6 in B minor, Op. 74 'Pathétique' - IV. Finale – Adagio lamentoso (Musopen Symphony).flac",
        ],
    ),
    "tchaikovsky_swan_lake": (
        "Tchaikovsky – Pathétique finale",
        "ngd/tchaikovsky_swan_lake.mp3",
        [
            "Tchaikovsky - Symphony No. 6 in B minor, Op. 74 'Pathétique' - IV. Finale – Adagio lamentoso (Musopen Symphony).flac",
        ],
    ),
    "dvorak_largo": (
        "Bach – Concerto for Two Violins, 2nd mov. (Largo)",
        "ngd/dvorak_largo.mp3",
        ["Johann Sebastian Bach - Concerto for Two Violins in D minor - 2. Largo ma non tanto.ogg"],
    ),
    "handel_sarabande": (
        "Satie – Gymnopédie No. 1",
        "ngd/handel_sarabande.mp3",
        ["Gymnopedie No. 1..ogg", "Erik Satie - Gymnopédie No. 1.ogg"],
    ),
    "bach_air": (
        "Bach – Concerto for Two Violins, 2nd mov.",
        "ngd/bach_air.mp3",
        ["Johann Sebastian Bach - Concerto for Two Violins in D minor - 2. Largo ma non tanto.ogg"],
    ),
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        if resp.status != 200:
            raise urllib.error.HTTPError(url, resp.status, "bad status", resp.headers, None)
        return resp.read()


def commons_url(filename: str) -> str:
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(filename)


def to_mp3(src: Path, dest: Path, start: float) -> bool:
    cmd = ["ffmpeg", "-y"]
    if start:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(src), "-ar", "44100", "-b:a", "128k", str(dest)]
    result = subprocess.run(cmd, capture_output=True)
    return result.returncode == 0 and dest.exists() and dest.stat().st_size > 80_000


def try_files(filenames: list[str], dest: Path, start: float) -> str | None:
    TMP.mkdir(parents=True, exist_ok=True)
    for name in filenames:
        url = commons_url(name)
        print(f"  try {name}")
        try:
            data = fetch(url)
        except Exception as exc:
            print(f"    fail: {exc}")
            time.sleep(2)
            continue
        if len(data) < 80_000:
            print(f"    too small ({len(data)} bytes)")
            time.sleep(2)
            continue
        src = TMP / "download.bin"
        src.write_bytes(data)
        if to_mp3(src, dest, start):
            print(f"  ok {dest.name} ({dest.stat().st_size} bytes) from {name}")
            return name
        print("    ffmpeg failed")
        time.sleep(2)
    return None


def main() -> None:
    NGU.mkdir(parents=True, exist_ok=True)
    NGD.mkdir(parents=True, exist_ok=True)
    results: dict[str, str] = {}

    for mood, slug, start, names in TRACKS:
        dest = (NGU if mood == "ngu" else NGD) / f"{slug}.mp3"
        print(f"\n== {slug} ==")
        source = try_files(names, dest, start)
        if source:
            results[slug] = f"original:{source}"
            continue
        sub = SUBSTITUTES.get(slug)
        if sub:
            title, _, sub_names = sub
            print(f"  substitute: {title}")
            source = try_files(sub_names, dest, 0)
            if source:
                results[slug] = f"substitute:{title}:{source}"
                continue
        results[slug] = "FAILED"
        print("  still placeholder")

    print("\nSUMMARY")
    for slug, status in results.items():
        print(f"  {slug}: {status}")
    (ROOT / "assets/sounds/download-log.txt").write_text(
        "\n".join(f"{k}\t{v}" for k, v in results.items()) + "\n"
    )


if __name__ == "__main__":
    main()
