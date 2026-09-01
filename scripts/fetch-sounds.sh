#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NGU="$ROOT/assets/sounds/ngu"
NGD="$ROOT/assets/sounds/ngd"
mkdir -p "$NGU" "$NGD"
UA="BTCPriceAlarmClock/1.0 (https://ritrek.com; license-free alarm tones)"

download() {
  local dest="$1"
  shift
  if [[ -f "$dest" && $(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest") -gt 20000 ]]; then
    echo "exists $dest"
    return 0
  fi
  for url in "$@"; do
    echo "GET $url"
    if curl -fsSL -A "$UA" -L --retry 2 --max-time 60 "$url" -o "$dest.tmp"; then
      if [[ $(stat -f%z "$dest.tmp" 2>/dev/null || stat -c%s "$dest.tmp") -gt 20000 ]]; then
        mv "$dest.tmp" "$dest"
        return 0
      fi
    fi
    rm -f "$dest.tmp"
  done
  return 1
}

to_mp3() {
  local src="$1"
  local dest="$2"
  ffmpeg -y -i "$src" -ar 44100 -b:a 128k "$dest" </dev/null
}

gen_tone() {
  local dest="$1"
  local f1="$2"
  local f2="$3"
  ffmpeg -y -f lavfi -i "sine=frequency=${f1}:duration=75" -f lavfi -i "sine=frequency=${f2}:duration=75" \
    -filter_complex "[0][1]amix=inputs=2:duration=longest,volume=0.4" -ac 1 -ar 44100 -b:a 96k "$dest" </dev/null
}

commons() {
  echo "https://commons.wikimedia.org/wiki/Special:FilePath/$1"
}

# NGU
download "$NGU/offenbach_cancan.src" \
  "$(commons "Offenbach_-_Orpheus_in_the_Underworld_-_Overture,_Can_Can_section.ogg")" \
  "https://upload.wikimedia.org/wikipedia/commons/6/63/Offenbach_-_Orpheus_in_the_Underworld_-_Overture,_Can_Can_section.ogg" || true
download "$NGU/beethoven_ode_to_joy.src" \
  "$(commons "Beethoven_Symphony_No._9_-_IV._Finale_(Ode_to_Joy_excerpt).ogg")" \
  "$(commons "Beethoven_-_Symphony_No._9_in_D_minor_-_IV._Presto.ogg")" \
  "$(commons "Ode_to_Joy.ogg")" || true
download "$NGU/mozart_alla_turca.src" \
  "$(commons "Mozart_-_Piano_Sonata_No._11_-_III._Alla_Turca.ogg")" \
  "$(commons "Wolfgang_Amadeus_Mozart_-_Piano_Sonata_No._11_in_A_major,_K._331_-_III._Alla_Turca.ogg")" || true
download "$NGU/vivaldi_spring.src" \
  "$(commons "Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro.ogg")" \
  "$(commons "Antonio_Vivaldi_-_The_Four_Seasons_-_Spring_mvt_1.ogg")" || true
download "$NGU/rossini_william_tell.src" \
  "$(commons "Rossini_-_William_Tell_Overture_(finale).ogg")" \
  "$(commons "William_Tell_Overture_Finale.ogg")" || true
download "$NGU/handel_queen_of_sheba.src" \
  "$(commons "Handel_-_Arrival_of_the_Queen_of_Sheba.ogg")" || true
download "$NGU/mozart_nachtmusik.src" \
  "$(commons "Mozart_-_Eine_kleine_Nachtmusik_-_1._Allegro.ogg")" || true
download "$NGU/strauss_blue_danube.src" \
  "$(commons "Johann_Strauss_II_-_The_Blue_Danube.ogg")" \
  "$(commons "An_der_schönen_blauen_Donau.ogg")" || true
download "$NGU/strauss_radetzky.src" \
  "$(commons "Johann_Strauss_Sr._-_Radetzky_March.ogg")" \
  "$(commons "Radetzky_March.ogg")" || true
download "$NGU/handel_hallelujah.src" \
  "$(commons "Handel_-_Messiah_-_Hallelujah_Chorus.ogg")" \
  "$(commons "Handel_-_Messiah_-_44._Hallelujah.ogg")" || true

# NGD
download "$NGD/chopin_funeral_march.src" \
  "$(commons "Chopin_-_Piano_Sonata_No._2_-_III._Marche_funèbre.ogg")" \
  "$(commons "Frédéric_Chopin_-_Piano_Sonata_No._2_-_3._Marche_funèbre.ogg")" || true
download "$NGD/mozart_lacrimosa.src" \
  "$(commons "Mozart_-_Requiem_-_Lacrimosa.ogg")" || true
download "$NGD/grieg_ases_death.src" \
  "$(commons "Edvard_Grieg_-_Peer_Gynt_Suite_1,_The_Death_of_Ase.ogg")" \
  "$(commons "Grieg_-_Aases_Death.ogg")" || true
download "$NGD/chopin_prelude_4.src" \
  "$(commons "Chopin_-_Prelude_Opus_28_No._4.ogg")" \
  "$(commons "Chopin_Prelude_Op._28_No._4.ogg")" || true
download "$NGD/beethoven_moonlight.src" \
  "$(commons "Beethoven_Moonlight_Sonata_1st_movement.ogg")" \
  "$(commons "Piano_Sonata_No.14_in_C-sharp_minor_Moonlight,_Op.27_No.2_-_I._Adagio_sostenuto.ogg")" || true
download "$NGD/beethoven_symphony7.src" \
  "$(commons "Beethoven_Symphony_7_2nd_movement.ogg")" \
  "$(commons "Ludwig_van_Beethoven_-_Symphony_No._7_in_A_major,_Op._92_-_II._Allegretto.ogg")" || true
download "$NGD/tchaikovsky_swan_lake.src" \
  "$(commons "Tchaikovsky_-_Swan_Lake_-_Scene.ogg")" || true
download "$NGD/dvorak_largo.src" \
  "$(commons "Dvorak_Symphony_9_Largo.ogg")" \
  "$(commons "Antonín_Dvořák_-_Symphony_No._9_-_II._Largo.ogg")" || true
download "$NGD/handel_sarabande.src" \
  "$(commons "Handel_-_Sarabande.ogg")" \
  "$(commons "George_Frideric_Handel_-_Sarabande.ogg")" || true
download "$NGD/bach_air.src" \
  "$(commons "Johann_Sebastian_Bach_-_Air_on_the_G_String.ogg")" \
  "$(commons "Bach_-_Air_-_Orchestral_Suite_No._3.ogg")" || true

convert_or_tone() {
  local src="$1"
  local mp3="$2"
  local f1="$3"
  local f2="$4"
  if [[ -f "$src" ]]; then
    if to_mp3 "$src" "$mp3"; then
      rm -f "$src"
      echo "converted $mp3"
      return
    fi
  fi
  echo "placeholder $mp3"
  gen_tone "$mp3" "$f1" "$f2"
}

convert_or_tone "$NGU/offenbach_cancan.src" "$NGU/offenbach_cancan.mp3" 523 784
convert_or_tone "$NGU/beethoven_ode_to_joy.src" "$NGU/beethoven_ode_to_joy.mp3" 392 523
convert_or_tone "$NGU/mozart_alla_turca.src" "$NGU/mozart_alla_turca.mp3" 659 880
convert_or_tone "$NGU/vivaldi_spring.src" "$NGU/vivaldi_spring.mp3" 587 880
convert_or_tone "$NGU/rossini_william_tell.src" "$NGU/rossini_william_tell.mp3" 698 932
convert_or_tone "$NGU/handel_queen_of_sheba.src" "$NGU/handel_queen_of_sheba.mp3" 440 660
convert_or_tone "$NGU/mozart_nachtmusik.src" "$NGU/mozart_nachtmusik.mp3" 494 740
convert_or_tone "$NGU/strauss_blue_danube.src" "$NGU/strauss_blue_danube.mp3" 349 523
convert_or_tone "$NGU/strauss_radetzky.src" "$NGU/strauss_radetzky.mp3" 392 587
convert_or_tone "$NGU/handel_hallelujah.src" "$NGU/handel_hallelujah.mp3" 523 659

convert_or_tone "$NGD/chopin_funeral_march.src" "$NGD/chopin_funeral_march.mp3" 196 247
convert_or_tone "$NGD/mozart_lacrimosa.src" "$NGD/mozart_lacrimosa.mp3" 220 277
convert_or_tone "$NGD/grieg_ases_death.src" "$NGD/grieg_ases_death.mp3" 174 220
convert_or_tone "$NGD/chopin_prelude_4.src" "$NGD/chopin_prelude_4.mp3" 185 233
convert_or_tone "$NGD/beethoven_moonlight.src" "$NGD/beethoven_moonlight.mp3" 207 311
convert_or_tone "$NGD/beethoven_symphony7.src" "$NGD/beethoven_symphony7.mp3" 233 294
convert_or_tone "$NGD/tchaikovsky_swan_lake.src" "$NGD/tchaikovsky_swan_lake.mp3" 246 311
convert_or_tone "$NGD/dvorak_largo.src" "$NGD/dvorak_largo.mp3" 196 262
convert_or_tone "$NGD/handel_sarabande.src" "$NGD/handel_sarabande.mp3" 165 196
convert_or_tone "$NGD/bach_air.src" "$NGD/bach_air.mp3" 220 330

ffmpeg -y -f lavfi -i "sine=frequency=880:duration=1.2" -f lavfi -i "sine=frequency=660:duration=1.2" \
  -filter_complex "[0][1]concat=n=2:v=0:a=1" -t 3 -ac 1 -ar 44100 -b:a 96k "$ROOT/assets/sounds/fallback_chime.mp3" </dev/null

echo "done"
