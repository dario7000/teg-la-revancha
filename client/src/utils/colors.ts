// Continent fill colors (used as background tint for country shapes)
export const CONTINENT_COLORS: Record<string, string> = {
  AMERICA_DEL_NORTE: '#6B7280', // gray
  AMERICA_CENTRAL: '#EAB308',   // yellow
  AMERICA_DEL_SUR: '#991B1B',   // dark red
  EUROPA: '#4B5563',            // darker gray
  ASIA: '#78716C',              // olive
  AFRICA: '#F9A8D4',            // pink
  OCEANIA: '#6EE7B7',           // light green
};

// Lighter continent tints for map background regions
export const CONTINENT_BG_COLORS: Record<string, string> = {
  AMERICA_DEL_NORTE: '#9CA3AF',
  AMERICA_CENTRAL: '#FDE047',
  AMERICA_DEL_SUR: '#DC2626',
  EUROPA: '#6B7280',
  ASIA: '#A8A29E',
  AFRICA: '#FBCFE8',
  OCEANIA: '#A7F3D0',
};

// Player colors used to paint owned territories
export const PLAYER_COLORS: Record<string, string> = {
  WHITE: '#F7FAFC',
  BLACK: '#2D3748',
  RED: '#E53E3E',
  BLUE: '#3182CE',
  YELLOW: '#ECC94B',
  GREEN: '#38A169',
};

// Readable display names for continents
export const CONTINENT_DISPLAY_NAMES: Record<string, string> = {
  AMERICA_DEL_NORTE: 'America del Norte',
  AMERICA_CENTRAL: 'America Central',
  AMERICA_DEL_SUR: 'America del Sur',
  EUROPA: 'Europa',
  ASIA: 'Asia',
  AFRICA: 'Africa',
  OCEANIA: 'Oceania',
};

// Human-readable country names (replace underscores, handle special chars)
export function getCountryDisplayName(id: string): string {
  const names: Record<string, string> = {
    ALASKA: 'Alaska',
    ISLA_VICTORIA: 'Isla Victoria',
    GROENLANDIA: 'Groenlandia',
    LABRADOR: 'Labrador',
    CANADA: 'Canadá',
    TERRANOVA: 'Terranova',
    NUEVA_YORK: 'Nueva York',
    OREGON: 'Oregon',
    CHICAGO: 'Chicago',
    LAS_VEGAS: 'Las Vegas',
    FLORIDA: 'Florida',
    CALIFORNIA: 'California',
    MEXICO: 'México',
    CUBA: 'Cuba',
    JAMAICA: 'Jamaica',
    HONDURAS: 'Honduras',
    EL_SALVADOR: 'El Salvador',
    NICARAGUA: 'Nicaragua',
    VENEZUELA: 'Venezuela',
    COLOMBIA: 'Colombia',
    BRASIL: 'Brasil',
    BOLIVIA: 'Bolivia',
    PARAGUAY: 'Paraguay',
    ARGENTINA: 'Argentina',
    CHILE: 'Chile',
    URUGUAY: 'Uruguay',
    ISLANDIA: 'Islandia',
    IRLANDA: 'Irlanda',
    'GRAN_BRETAÑA': 'Gran Bretaña',
    NORUEGA: 'Noruega',
    FINLANDIA: 'Finlandia',
    BIELORRUSIA: 'Bielorrusia',
    UCRANIA: 'Ucrania',
    POLONIA: 'Polonia',
    ALBANIA: 'Albania',
    ALEMANIA: 'Alemania',
    SERBIA: 'Serbia',
    CROACIA: 'Croacia',
    ITALIA: 'Italia',
    FRANCIA: 'Francia',
    'ESPAÑA': 'España',
    PORTUGAL: 'Portugal',
    SIBERIA: 'Siberia',
    CHECHENIA: 'Chechenia',
    RUSIA: 'Rusia',
    CHINA: 'China',
    CHUKCHI: 'Chukchi',
    KAMCHATKA: 'Kamchatka',
    JAPON: 'Japón',
    COREA: 'Corea',
    IRAN: 'Irán',
    IRAK: 'Irak',
    ISRAEL: 'Israel',
    TURQUIA: 'Turquía',
    ARABIA: 'Arabia',
    INDIA: 'India',
    VIETNAM: 'Vietnam',
    MALASIA: 'Malasia',
    SAHARA: 'Sahara',
    EGIPTO: 'Egipto',
    ETIOPIA: 'Etiopía',
    NIGERIA: 'Nigeria',
    ANGOLA: 'Angola',
    MAURITANIA: 'Mauritania',
    SUDAFRICA: 'Sudáfrica',
    MADAGASCAR: 'Madagascar',
    SUMATRA: 'Sumatra',
    FILIPINAS: 'Filipinas',
    TONGA: 'Tonga',
    AUSTRALIA: 'Australia',
    TASMANIA: 'Tasmania',
    NUEVA_ZELANDA: 'Nueva Zelanda',
  };
  return names[id] || id.replace(/_/g, ' ');
}
