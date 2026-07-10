// Country name -> ISO code for flagcdn. Special sub-region codes for UK nations.
window.WC_FLAGS = {
  "Mexico": "mx",
  "South Africa": "za",
  "South Korea": "kr",
  "Czech Republic": "cz",
  "Canada": "ca",
  "Bosnia & Herzegovina": "ba",
  "Qatar": "qa",
  "Switzerland": "ch",
  "Brazil": "br",
  "Morocco": "ma",
  "Haiti": "ht",
  "Scotland": "gb-sct",
  "USA": "us",
  "Paraguay": "py",
  "Australia": "au",
  "Turkey": "tr",
  "Germany": "de",
  "Curaçao": "cw",
  "Ivory Coast": "ci",
  "Ecuador": "ec",
  "Netherlands": "nl",
  "Japan": "jp",
  "Sweden": "se",
  "Tunisia": "tn",
  "Belgium": "be",
  "Egypt": "eg",
  "Iran": "ir",
  "New Zealand": "nz",
  "Spain": "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  "Uruguay": "uy",
  "France": "fr",
  "Senegal": "sn",
  "Iraq": "iq",
  "Norway": "no",
  "Argentina": "ar",
  "Algeria": "dz",
  "Austria": "at",
  "Jordan": "jo",
  "Portugal": "pt",
  "DR Congo": "cd",
  "Uzbekistan": "uz",
  "Colombia": "co",
  "England": "gb-eng",
  "Croatia": "hr",
  "Ghana": "gh",
  "Panama": "pa"
};

// Returns a flagcdn URL for a team name, or null for placeholders (W97, L101, etc.)
window.flagUrl = function (team, size) {
  size = size || "w80";
  var iso = window.WC_FLAGS[team];
  if (!iso) return null;
  return "https://flagcdn.com/" + size + "/" + iso + ".png";
};

// Three-letter code used as a compact label / fallback when a flag can't load.
window.teamCode = function (team) {
  if (!team) return "?";
  if (/^[WL]\d+$/.test(team)) return team; // W97, L101 placeholders
  var clean = team.replace(/[^A-Za-z ]/g, "").trim();
  var parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0] + (parts[1][1] || "")).toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
};
