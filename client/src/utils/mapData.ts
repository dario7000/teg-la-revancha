// =============================================================================
// SVG map data for all 72 countries in TEG La Revancha
// ViewBox: 0 0 1600 900 (widescreen planisphere)
//
// Each country has a hand-crafted simplified geographic SVG path arranged
// to form a recognizable world map. Countries within a continent fit together
// like puzzle pieces with small gaps for border visibility.
// =============================================================================

export interface MapCountryData {
  id: string;           // CountryId matching server data exactly
  name: string;         // Display name
  continent: string;    // ContinentId
  path: string;         // SVG path 'd' attribute - simplified geographic shape
  labelX: number;       // X position for country name label
  labelY: number;       // Y position for country name label
  armyX: number;        // X position for army count badge
  armyY: number;        // Y position for army count badge
}

// Keep backward-compatible interface
export interface CountryMapData {
  id: string;
  cx: number;
  cy: number;
  path: string;
  continent: string;
}

// =============================================================================
// AMERICA DEL NORTE (12 countries) - x:50-380, y:50-350
// =============================================================================

const AMERICA_DEL_NORTE: MapCountryData[] = [
  {
    id: 'ALASKA',
    name: 'Alaska',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 55 82 L 60 60 L 85 52 L 115 55 L 130 65 L 125 85 L 140 95 L 135 110 L 110 120 L 85 115 L 60 105 L 50 95 Z',
    labelX: 92,
    labelY: 80,
    armyX: 95,
    armyY: 85,
  },
  {
    id: 'ISLA_VICTORIA',
    name: 'Isla Victoria',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 175 50 L 200 42 L 225 48 L 235 60 L 220 70 L 195 72 L 175 65 Z',
    labelX: 205,
    labelY: 55,
    armyX: 205,
    armyY: 58,
  },
  {
    id: 'GROENLANDIA',
    name: 'Groenlandia',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 340 30 L 365 25 L 395 30 L 410 50 L 405 80 L 390 100 L 370 105 L 350 95 L 335 75 L 330 50 Z',
    labelX: 370,
    labelY: 60,
    armyX: 370,
    armyY: 65,
  },
  {
    id: 'LABRADOR',
    name: 'Labrador',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 300 75 L 320 68 L 338 78 L 345 95 L 335 115 L 315 120 L 295 112 L 290 95 Z',
    labelX: 318,
    labelY: 92,
    armyX: 318,
    armyY: 95,
  },
  {
    id: 'CANADA',
    name: 'Canada',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 135 70 L 170 68 L 173 65 L 195 75 L 220 73 L 240 80 L 275 78 L 298 82 L 293 100 L 288 120 L 275 135 L 240 140 L 200 138 L 165 130 L 140 120 L 132 100 Z',
    labelX: 210,
    labelY: 100,
    armyX: 215,
    armyY: 105,
  },
  {
    id: 'TERRANOVA',
    name: 'Terranova',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 310 118 L 330 112 L 345 120 L 348 135 L 335 145 L 315 142 L 305 130 Z',
    labelX: 328,
    labelY: 128,
    armyX: 328,
    armyY: 130,
  },
  {
    id: 'OREGON',
    name: 'Oregon',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 80 122 L 110 118 L 135 122 L 140 140 L 135 160 L 115 165 L 90 162 L 75 148 L 72 135 Z',
    labelX: 108,
    labelY: 140,
    armyX: 108,
    armyY: 142,
  },
  {
    id: 'CHICAGO',
    name: 'Chicago',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 142 140 L 175 135 L 210 140 L 240 142 L 248 158 L 235 175 L 200 180 L 165 175 L 145 165 L 138 155 Z',
    labelX: 195,
    labelY: 158,
    armyX: 195,
    armyY: 160,
  },
  {
    id: 'NUEVA_YORK',
    name: 'Nueva York',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 250 142 L 278 138 L 303 145 L 310 160 L 300 178 L 275 185 L 252 180 L 242 165 L 245 155 Z',
    labelX: 278,
    labelY: 160,
    armyX: 278,
    armyY: 162,
  },
  {
    id: 'LAS_VEGAS',
    name: 'Las Vegas',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 75 152 L 95 165 L 115 168 L 136 162 L 140 178 L 132 200 L 110 210 L 85 205 L 68 190 L 65 170 Z',
    labelX: 102,
    labelY: 185,
    armyX: 105,
    armyY: 188,
  },
  {
    id: 'CALIFORNIA',
    name: 'California',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 62 195 L 85 208 L 110 215 L 130 205 L 138 220 L 132 250 L 118 270 L 95 280 L 72 275 L 58 255 L 52 230 L 55 210 Z',
    labelX: 95,
    labelY: 245,
    armyX: 98,
    armyY: 248,
  },
  {
    id: 'FLORIDA',
    name: 'Florida',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 142 180 L 168 178 L 200 183 L 240 180 L 260 185 L 278 190 L 285 210 L 272 235 L 248 250 L 220 252 L 195 245 L 170 235 L 148 225 L 135 210 L 135 195 Z',
    labelX: 210,
    labelY: 215,
    armyX: 215,
    armyY: 218,
  },
];

// =============================================================================
// AMERICA CENTRAL (6 countries) - x:150-350, y:280-450
// =============================================================================

const AMERICA_CENTRAL: MapCountryData[] = [
  {
    id: 'MEXICO',
    name: 'Mexico',
    continent: 'AMERICA_CENTRAL',
    path: 'M 100 280 L 130 275 L 160 282 L 195 290 L 210 310 L 200 335 L 185 350 L 165 355 L 140 348 L 115 335 L 98 310 L 95 295 Z',
    labelX: 152,
    labelY: 315,
    armyX: 155,
    armyY: 318,
  },
  {
    id: 'CUBA',
    name: 'Cuba',
    continent: 'AMERICA_CENTRAL',
    path: 'M 225 310 L 250 305 L 280 310 L 300 318 L 305 330 L 290 338 L 260 335 L 235 328 L 220 320 Z',
    labelX: 265,
    labelY: 320,
    armyX: 265,
    armyY: 322,
  },
  {
    id: 'JAMAICA',
    name: 'Jamaica',
    continent: 'AMERICA_CENTRAL',
    path: 'M 270 345 L 290 340 L 308 345 L 312 355 L 300 362 L 278 360 L 265 355 Z',
    labelX: 290,
    labelY: 352,
    armyX: 290,
    armyY: 353,
  },
  {
    id: 'HONDURAS',
    name: 'Honduras',
    continent: 'AMERICA_CENTRAL',
    path: 'M 170 358 L 200 352 L 225 360 L 230 378 L 218 395 L 195 400 L 175 395 L 162 380 L 160 368 Z',
    labelX: 198,
    labelY: 378,
    armyX: 198,
    armyY: 380,
  },
  {
    id: 'EL_SALVADOR',
    name: 'El Salvador',
    continent: 'AMERICA_CENTRAL',
    path: 'M 155 382 L 170 398 L 195 403 L 200 418 L 188 432 L 165 435 L 148 425 L 140 410 L 142 395 Z',
    labelX: 172,
    labelY: 415,
    armyX: 172,
    armyY: 418,
  },
  {
    id: 'NICARAGUA',
    name: 'Nicaragua',
    continent: 'AMERICA_CENTRAL',
    path: 'M 202 400 L 222 398 L 245 405 L 260 418 L 258 438 L 240 450 L 215 452 L 195 445 L 185 435 L 192 420 Z',
    labelX: 228,
    labelY: 425,
    armyX: 228,
    armyY: 428,
  },
];

// =============================================================================
// AMERICA DEL SUR (8 countries) - x:200-420, y:460-850
// =============================================================================

const AMERICA_DEL_SUR: MapCountryData[] = [
  {
    id: 'COLOMBIA',
    name: 'Colombia',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 215 462 L 240 455 L 268 460 L 285 475 L 290 498 L 278 515 L 258 520 L 235 518 L 218 505 L 210 485 Z',
    labelX: 252,
    labelY: 490,
    armyX: 255,
    armyY: 492,
  },
  {
    id: 'VENEZUELA',
    name: 'Venezuela',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 290 462 L 315 458 L 345 465 L 365 480 L 370 500 L 355 518 L 330 525 L 300 520 L 288 505 L 285 480 Z',
    labelX: 328,
    labelY: 490,
    armyX: 330,
    armyY: 492,
  },
  {
    id: 'BRASIL',
    name: 'Brasil',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 295 522 L 330 518 L 358 522 L 385 535 L 410 555 L 420 580 L 415 615 L 400 645 L 375 665 L 345 675 L 315 670 L 290 655 L 275 630 L 268 600 L 270 570 L 278 545 Z',
    labelX: 345,
    labelY: 595,
    armyX: 348,
    armyY: 598,
  },
  {
    id: 'BOLIVIA',
    name: 'Bolivia',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 235 522 L 260 518 L 280 525 L 292 545 L 285 570 L 275 595 L 258 605 L 238 600 L 222 585 L 218 560 L 225 540 Z',
    labelX: 255,
    labelY: 562,
    armyX: 258,
    armyY: 565,
  },
  {
    id: 'PARAGUAY',
    name: 'Paraguay',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 270 600 L 290 595 L 312 600 L 322 618 L 315 640 L 295 652 L 272 648 L 258 632 L 255 615 Z',
    labelX: 290,
    labelY: 622,
    armyX: 290,
    armyY: 625,
  },
  {
    id: 'URUGUAY',
    name: 'Uruguay',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 325 648 L 348 642 L 368 650 L 378 668 L 372 688 L 355 698 L 335 695 L 320 682 L 318 665 Z',
    labelX: 348,
    labelY: 672,
    armyX: 350,
    armyY: 675,
  },
  {
    id: 'CHILE',
    name: 'Chile',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 218 600 L 238 605 L 248 625 L 252 648 L 248 675 L 242 705 L 235 740 L 228 770 L 220 800 L 210 830 L 198 845 L 185 840 L 180 815 L 188 780 L 195 745 L 200 710 L 205 675 L 210 645 L 215 620 Z',
    labelX: 215,
    labelY: 730,
    armyX: 218,
    armyY: 735,
  },
  {
    id: 'ARGENTINA',
    name: 'Argentina',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 250 648 L 270 652 L 298 658 L 320 665 L 335 680 L 340 705 L 332 735 L 320 765 L 305 790 L 285 810 L 262 825 L 240 830 L 225 818 L 228 785 L 232 755 L 238 720 L 242 690 L 245 668 Z',
    labelX: 285,
    labelY: 740,
    armyX: 288,
    armyY: 745,
  },
];

// =============================================================================
// EUROPA (16 countries) - x:600-900, y:50-340
// =============================================================================

const EUROPA: MapCountryData[] = [
  {
    id: 'ISLANDIA',
    name: 'Islandia',
    continent: 'EUROPA',
    path: 'M 565 58 L 585 50 L 610 55 L 620 68 L 612 80 L 590 85 L 570 78 L 560 68 Z',
    labelX: 590,
    labelY: 67,
    armyX: 590,
    armyY: 68,
  },
  {
    id: 'IRLANDA',
    name: 'Irlanda',
    continent: 'EUROPA',
    path: 'M 605 118 L 618 110 L 632 115 L 638 130 L 630 142 L 615 145 L 602 138 L 600 128 Z',
    labelX: 618,
    labelY: 128,
    armyX: 618,
    armyY: 130,
  },
  {
    id: 'GRAN_BRETAÑA',
    name: 'Gran Bretaña',
    continent: 'EUROPA',
    path: 'M 640 100 L 652 92 L 665 98 L 670 115 L 668 135 L 660 148 L 648 152 L 638 145 L 635 128 L 636 112 Z',
    labelX: 652,
    labelY: 122,
    armyX: 654,
    armyY: 125,
  },
  {
    id: 'NORUEGA',
    name: 'Noruega',
    continent: 'EUROPA',
    path: 'M 690 55 L 705 50 L 722 58 L 728 72 L 725 92 L 718 110 L 710 125 L 698 130 L 688 120 L 685 100 L 682 80 L 685 65 Z',
    labelX: 705,
    labelY: 88,
    armyX: 708,
    armyY: 90,
  },
  {
    id: 'FINLANDIA',
    name: 'Finlandia',
    continent: 'EUROPA',
    path: 'M 730 55 L 748 50 L 768 58 L 775 75 L 772 98 L 765 118 L 752 128 L 738 122 L 730 105 L 728 85 L 725 68 Z',
    labelX: 752,
    labelY: 88,
    armyX: 752,
    armyY: 90,
  },
  {
    id: 'PORTUGAL',
    name: 'Portugal',
    continent: 'EUROPA',
    path: 'M 618 265 L 628 258 L 635 268 L 636 290 L 632 310 L 625 325 L 615 330 L 608 318 L 610 295 L 612 278 Z',
    labelX: 622,
    labelY: 295,
    armyX: 624,
    armyY: 298,
  },
  {
    id: 'ESPAÑA',
    name: 'España',
    continent: 'EUROPA',
    path: 'M 635 255 L 660 248 L 688 252 L 700 265 L 698 288 L 685 308 L 665 318 L 642 320 L 632 305 L 630 280 L 632 265 Z',
    labelX: 665,
    labelY: 282,
    armyX: 668,
    armyY: 285,
  },
  {
    id: 'FRANCIA',
    name: 'Francia',
    continent: 'EUROPA',
    path: 'M 648 195 L 670 188 L 695 195 L 705 210 L 702 235 L 695 250 L 680 255 L 660 252 L 645 245 L 638 228 L 640 210 Z',
    labelX: 672,
    labelY: 222,
    armyX: 675,
    armyY: 225,
  },
  {
    id: 'ALEMANIA',
    name: 'Alemania',
    continent: 'EUROPA',
    path: 'M 700 155 L 720 148 L 740 155 L 748 172 L 745 192 L 735 205 L 718 210 L 702 205 L 695 190 L 692 172 Z',
    labelX: 720,
    labelY: 180,
    armyX: 722,
    armyY: 182,
  },
  {
    id: 'POLONIA',
    name: 'Polonia',
    continent: 'EUROPA',
    path: 'M 748 145 L 770 140 L 795 148 L 802 165 L 798 185 L 785 195 L 765 198 L 750 192 L 742 178 L 742 160 Z',
    labelX: 772,
    labelY: 168,
    armyX: 775,
    armyY: 170,
  },
  {
    id: 'BIELORRUSIA',
    name: 'Bielorrusia',
    continent: 'EUROPA',
    path: 'M 800 120 L 822 115 L 845 122 L 855 140 L 850 160 L 838 172 L 818 175 L 800 170 L 792 155 L 795 138 Z',
    labelX: 825,
    labelY: 145,
    armyX: 828,
    armyY: 148,
  },
  {
    id: 'UCRANIA',
    name: 'Ucrania',
    continent: 'EUROPA',
    path: 'M 842 170 L 865 165 L 892 172 L 905 190 L 900 212 L 888 228 L 868 232 L 848 225 L 835 210 L 835 190 Z',
    labelX: 870,
    labelY: 198,
    armyX: 872,
    armyY: 200,
  },
  {
    id: 'CROACIA',
    name: 'Croacia',
    continent: 'EUROPA',
    path: 'M 738 210 L 758 205 L 778 212 L 785 228 L 778 245 L 762 252 L 742 248 L 732 235 L 732 222 Z',
    labelX: 758,
    labelY: 228,
    armyX: 760,
    armyY: 230,
  },
  {
    id: 'SERBIA',
    name: 'Serbia',
    continent: 'EUROPA',
    path: 'M 785 218 L 808 212 L 830 220 L 838 238 L 832 258 L 815 268 L 795 265 L 782 252 L 778 238 Z',
    labelX: 808,
    labelY: 240,
    armyX: 810,
    armyY: 242,
  },
  {
    id: 'ALBANIA',
    name: 'Albania',
    continent: 'EUROPA',
    path: 'M 758 255 L 778 250 L 800 258 L 808 275 L 800 295 L 782 302 L 762 298 L 752 282 L 752 268 Z',
    labelX: 780,
    labelY: 278,
    armyX: 782,
    armyY: 280,
  },
  {
    id: 'ITALIA',
    name: 'Italia',
    continent: 'EUROPA',
    path: 'M 710 245 L 725 238 L 740 245 L 748 260 L 745 278 L 738 298 L 728 318 L 718 330 L 705 328 L 700 310 L 702 288 L 705 268 Z',
    labelX: 722,
    labelY: 285,
    armyX: 724,
    armyY: 288,
  },
];

// =============================================================================
// ASIA (16 countries) - x:900-1400, y:50-500
// =============================================================================

const ASIA: MapCountryData[] = [
  {
    id: 'SIBERIA',
    name: 'Siberia',
    continent: 'ASIA',
    path: 'M 920 52 L 970 45 L 1030 50 L 1080 58 L 1120 65 L 1140 80 L 1130 100 L 1095 108 L 1050 112 L 1000 108 L 955 102 L 925 92 L 915 75 Z',
    labelX: 1030,
    labelY: 78,
    armyX: 1032,
    armyY: 80,
  },
  {
    id: 'CHUKCHI',
    name: 'Chukchi',
    continent: 'ASIA',
    path: 'M 1145 55 L 1175 48 L 1210 52 L 1235 62 L 1240 82 L 1228 98 L 1205 105 L 1180 100 L 1158 90 L 1148 75 Z',
    labelX: 1195,
    labelY: 75,
    armyX: 1198,
    armyY: 78,
  },
  {
    id: 'KAMCHATKA',
    name: 'Kamchatka',
    continent: 'ASIA',
    path: 'M 1242 68 L 1268 60 L 1290 68 L 1298 85 L 1295 108 L 1285 128 L 1270 138 L 1252 132 L 1242 115 L 1238 95 Z',
    labelX: 1268,
    labelY: 100,
    armyX: 1270,
    armyY: 102,
  },
  {
    id: 'CHECHENIA',
    name: 'Chechenia',
    continent: 'ASIA',
    path: 'M 910 108 L 935 102 L 960 108 L 975 125 L 972 148 L 958 165 L 938 168 L 918 162 L 905 145 L 905 125 Z',
    labelX: 940,
    labelY: 138,
    armyX: 942,
    armyY: 140,
  },
  {
    id: 'RUSIA',
    name: 'Rusia',
    continent: 'ASIA',
    path: 'M 965 110 L 1000 105 L 1040 112 L 1065 125 L 1070 148 L 1058 170 L 1035 180 L 1000 178 L 975 172 L 960 155 L 958 135 Z',
    labelX: 1015,
    labelY: 142,
    armyX: 1018,
    armyY: 145,
  },
  {
    id: 'CHINA',
    name: 'China',
    continent: 'ASIA',
    path: 'M 1070 130 L 1110 125 L 1155 132 L 1185 148 L 1200 172 L 1195 200 L 1175 225 L 1145 238 L 1110 235 L 1080 225 L 1060 205 L 1055 178 L 1058 155 Z',
    labelX: 1130,
    labelY: 180,
    armyX: 1132,
    armyY: 182,
  },
  {
    id: 'COREA',
    name: 'Corea',
    continent: 'ASIA',
    path: 'M 1205 175 L 1225 168 L 1245 178 L 1250 198 L 1242 218 L 1225 228 L 1208 222 L 1200 205 L 1200 190 Z',
    labelX: 1225,
    labelY: 198,
    armyX: 1228,
    armyY: 200,
  },
  {
    id: 'JAPON',
    name: 'Japon',
    continent: 'ASIA',
    path: 'M 1270 145 L 1288 138 L 1305 148 L 1310 168 L 1305 195 L 1295 218 L 1280 228 L 1265 222 L 1260 200 L 1258 175 Z',
    labelX: 1285,
    labelY: 182,
    armyX: 1288,
    armyY: 185,
  },
  {
    id: 'TURQUIA',
    name: 'Turquia',
    continent: 'ASIA',
    path: 'M 910 225 L 938 218 L 968 225 L 980 242 L 975 262 L 958 275 L 935 278 L 915 272 L 905 255 L 905 240 Z',
    labelX: 942,
    labelY: 248,
    armyX: 945,
    armyY: 250,
  },
  {
    id: 'ISRAEL',
    name: 'Israel',
    continent: 'ASIA',
    path: 'M 912 280 L 928 275 L 942 282 L 945 298 L 938 312 L 922 318 L 910 310 L 906 295 Z',
    labelX: 928,
    labelY: 298,
    armyX: 928,
    armyY: 298,
  },
  {
    id: 'IRAK',
    name: 'Irak',
    continent: 'ASIA',
    path: 'M 948 275 L 972 268 L 995 278 L 1005 298 L 998 320 L 980 332 L 958 328 L 945 312 L 942 295 Z',
    labelX: 975,
    labelY: 300,
    armyX: 978,
    armyY: 302,
  },
  {
    id: 'IRAN',
    name: 'Iran',
    continent: 'ASIA',
    path: 'M 1000 265 L 1028 258 L 1058 268 L 1072 288 L 1068 315 L 1050 335 L 1025 342 L 1002 335 L 990 315 L 992 290 Z',
    labelX: 1032,
    labelY: 300,
    armyX: 1035,
    armyY: 302,
  },
  {
    id: 'ARABIA',
    name: 'Arabia',
    continent: 'ASIA',
    path: 'M 948 335 L 975 328 L 1000 338 L 1015 358 L 1010 385 L 995 405 L 972 412 L 948 405 L 935 388 L 935 362 Z',
    labelX: 975,
    labelY: 370,
    armyX: 978,
    armyY: 372,
  },
  {
    id: 'INDIA',
    name: 'India',
    continent: 'ASIA',
    path: 'M 1055 285 L 1085 278 L 1115 290 L 1130 315 L 1125 348 L 1112 380 L 1095 405 L 1072 415 L 1050 405 L 1040 378 L 1038 348 L 1042 318 Z',
    labelX: 1085,
    labelY: 348,
    armyX: 1088,
    armyY: 350,
  },
  {
    id: 'VIETNAM',
    name: 'Vietnam',
    continent: 'ASIA',
    path: 'M 1140 275 L 1162 268 L 1182 278 L 1190 298 L 1185 325 L 1178 352 L 1168 378 L 1152 388 L 1138 378 L 1135 350 L 1132 320 L 1135 295 Z',
    labelX: 1162,
    labelY: 328,
    armyX: 1165,
    armyY: 330,
  },
  {
    id: 'MALASIA',
    name: 'Malasia',
    continent: 'ASIA',
    path: 'M 1160 392 L 1185 385 L 1210 395 L 1222 415 L 1218 440 L 1200 458 L 1178 462 L 1158 452 L 1148 435 L 1150 415 Z',
    labelX: 1188,
    labelY: 425,
    armyX: 1190,
    armyY: 428,
  },
];

// =============================================================================
// AFRICA (8 countries) - x:600-850, y:350-750
// =============================================================================

const AFRICA: MapCountryData[] = [
  {
    id: 'SAHARA',
    name: 'Sahara',
    continent: 'AFRICA',
    path: 'M 620 355 L 660 345 L 710 350 L 755 358 L 785 375 L 790 405 L 775 430 L 745 445 L 705 448 L 665 442 L 635 425 L 618 400 L 615 375 Z',
    labelX: 705,
    labelY: 395,
    armyX: 708,
    armyY: 398,
  },
  {
    id: 'EGIPTO',
    name: 'Egipto',
    continent: 'AFRICA',
    path: 'M 790 355 L 815 348 L 842 358 L 855 378 L 850 405 L 838 425 L 818 432 L 798 428 L 788 410 L 785 385 Z',
    labelX: 822,
    labelY: 390,
    armyX: 825,
    armyY: 392,
  },
  {
    id: 'MAURITANIA',
    name: 'Mauritania',
    continent: 'AFRICA',
    path: 'M 610 410 L 635 402 L 660 408 L 672 428 L 675 455 L 668 480 L 650 498 L 628 502 L 610 492 L 602 470 L 600 445 L 605 425 Z',
    labelX: 638,
    labelY: 455,
    armyX: 640,
    armyY: 458,
  },
  {
    id: 'NIGERIA',
    name: 'Nigeria',
    continent: 'AFRICA',
    path: 'M 675 445 L 710 438 L 745 448 L 768 465 L 772 492 L 758 518 L 735 530 L 705 528 L 680 515 L 668 492 L 668 468 Z',
    labelX: 722,
    labelY: 488,
    armyX: 725,
    armyY: 490,
  },
  {
    id: 'ETIOPIA',
    name: 'Etiopia',
    continent: 'AFRICA',
    path: 'M 775 435 L 802 428 L 832 438 L 848 458 L 845 485 L 830 508 L 808 518 L 785 512 L 770 495 L 768 468 Z',
    labelX: 810,
    labelY: 475,
    armyX: 812,
    armyY: 478,
  },
  {
    id: 'ANGOLA',
    name: 'Angola',
    continent: 'AFRICA',
    path: 'M 660 510 L 695 502 L 730 510 L 752 528 L 755 558 L 742 585 L 718 598 L 688 595 L 665 578 L 652 555 L 652 530 Z',
    labelX: 708,
    labelY: 552,
    armyX: 710,
    armyY: 555,
  },
  {
    id: 'SUDAFRICA',
    name: 'Sudafrica',
    continent: 'AFRICA',
    path: 'M 680 600 L 715 592 L 748 602 L 770 625 L 775 655 L 762 685 L 740 705 L 712 712 L 685 705 L 665 682 L 658 655 L 662 628 Z',
    labelX: 720,
    labelY: 652,
    armyX: 722,
    armyY: 655,
  },
  {
    id: 'MADAGASCAR',
    name: 'Madagascar',
    continent: 'AFRICA',
    path: 'M 835 555 L 852 548 L 868 558 L 872 580 L 868 608 L 858 632 L 845 642 L 832 635 L 828 610 L 830 582 Z',
    labelX: 850,
    labelY: 595,
    armyX: 852,
    armyY: 598,
  },
];

// =============================================================================
// OCEANIA (6 countries) - x:1200-1550, y:500-850
// =============================================================================

const OCEANIA: MapCountryData[] = [
  {
    id: 'SUMATRA',
    name: 'Sumatra',
    continent: 'OCEANIA',
    path: 'M 1210 510 L 1235 502 L 1258 512 L 1265 535 L 1258 558 L 1240 572 L 1218 568 L 1205 548 L 1205 528 Z',
    labelX: 1235,
    labelY: 538,
    armyX: 1238,
    armyY: 540,
  },
  {
    id: 'FILIPINAS',
    name: 'Filipinas',
    continent: 'OCEANIA',
    path: 'M 1310 480 L 1332 472 L 1352 482 L 1358 502 L 1350 525 L 1335 538 L 1315 535 L 1305 518 L 1302 498 Z',
    labelX: 1330,
    labelY: 508,
    armyX: 1332,
    armyY: 510,
  },
  {
    id: 'TONGA',
    name: 'Tonga',
    continent: 'OCEANIA',
    path: 'M 1445 515 L 1465 508 L 1482 518 L 1488 535 L 1480 552 L 1462 558 L 1445 550 L 1440 535 Z',
    labelX: 1465,
    labelY: 535,
    armyX: 1465,
    armyY: 535,
  },
  {
    id: 'AUSTRALIA',
    name: 'Australia',
    continent: 'OCEANIA',
    path: 'M 1248 600 L 1295 588 L 1348 595 L 1400 608 L 1435 630 L 1450 662 L 1445 700 L 1425 732 L 1392 752 L 1350 762 L 1305 758 L 1268 742 L 1245 718 L 1232 688 L 1230 655 L 1238 628 Z',
    labelX: 1345,
    labelY: 675,
    armyX: 1348,
    armyY: 678,
  },
  {
    id: 'TASMANIA',
    name: 'Tasmania',
    continent: 'OCEANIA',
    path: 'M 1388 772 L 1412 765 L 1432 775 L 1438 795 L 1428 812 L 1408 818 L 1390 812 L 1382 795 Z',
    labelX: 1410,
    labelY: 792,
    armyX: 1412,
    armyY: 795,
  },
  {
    id: 'NUEVA_ZELANDA',
    name: 'Nueva Zelanda',
    continent: 'OCEANIA',
    path: 'M 1490 700 L 1510 692 L 1530 702 L 1538 722 L 1532 748 L 1522 775 L 1508 795 L 1490 800 L 1480 785 L 1478 758 L 1480 730 Z',
    labelX: 1510,
    labelY: 748,
    armyX: 1512,
    armyY: 750,
  },
];

// =============================================================================
// Combined MAP_COUNTRIES array (all 72 countries)
// =============================================================================

export const MAP_COUNTRIES: MapCountryData[] = [
  ...AMERICA_DEL_NORTE,
  ...AMERICA_CENTRAL,
  ...AMERICA_DEL_SUR,
  ...EUROPA,
  ...ASIA,
  ...AFRICA,
  ...OCEANIA,
];

// =============================================================================
// Backward-compatible MAP_DATA (Record<string, CountryMapData>)
// The existing components use MAP_DATA[id].cx, MAP_DATA[id].cy, .path, .continent
// =============================================================================

export const MAP_DATA: Record<string, CountryMapData> = {};
for (const c of MAP_COUNTRIES) {
  MAP_DATA[c.id] = {
    id: c.id,
    cx: c.armyX,
    cy: c.armyY,
    path: c.path,
    continent: c.continent,
  };
}

// =============================================================================
// Sea / bridge connections (dotted lines across water)
// =============================================================================

export interface BridgeConnection {
  from: string;
  to: string;
}

export const BRIDGE_CONNECTIONS: BridgeConnection[] = [
  // N.America <-> Asia (across the top / Bering Strait)
  { from: 'ALASKA', to: 'CHUKCHI' },
  // N.America <-> Europe
  { from: 'GROENLANDIA', to: 'ISLANDIA' },
  // N.America <-> C.America
  { from: 'CALIFORNIA', to: 'MEXICO' },
  { from: 'FLORIDA', to: 'MEXICO' },
  // C.America <-> S.America
  { from: 'NICARAGUA', to: 'COLOMBIA' },
  { from: 'NICARAGUA', to: 'VENEZUELA' },
  // S.America <-> Africa
  { from: 'URUGUAY', to: 'MAURITANIA' },
  { from: 'BRASIL', to: 'SAHARA' },
  { from: 'BRASIL', to: 'NIGERIA' },
  // Europe <-> Africa
  { from: 'ESPAÑA', to: 'SAHARA' },
  { from: 'PORTUGAL', to: 'SAHARA' },
  // Asia <-> Africa
  { from: 'TURQUIA', to: 'EGIPTO' },
  { from: 'ISRAEL', to: 'EGIPTO' },
  // Europe <-> Asia
  { from: 'FINLANDIA', to: 'SIBERIA' },
  { from: 'UCRANIA', to: 'RUSIA' },
  { from: 'UCRANIA', to: 'CHECHENIA' },
  { from: 'SERBIA', to: 'TURQUIA' },
  // Asia <-> Oceania
  { from: 'MALASIA', to: 'SUMATRA' },
  { from: 'MALASIA', to: 'FILIPINAS' },
  // S.America <-> Oceania
  { from: 'CHILE', to: 'AUSTRALIA' },
];

// Sea connections with SVG path data for drawing curved lines
export const SEA_CONNECTIONS: { from: string; to: string; path: string }[] = [
  {
    from: 'ALASKA',
    to: 'KAMCHATKA',
    path: 'M 95 85 Q 700 -40 1270 102',
  },
  {
    from: 'GROENLANDIA',
    to: 'ISLANDIA',
    path: 'M 370 65 Q 480 45 590 68',
  },
  {
    from: 'BRASIL',
    to: 'NIGERIA',
    path: 'M 410 580 Q 520 520 725 490',
  },
  {
    from: 'CHILE',
    to: 'AUSTRALIA',
    path: 'M 218 735 Q 700 880 1345 678',
  },
  {
    from: 'ESPAÑA',
    to: 'SAHARA',
    path: 'M 668 285 Q 680 325 708 398',
  },
  {
    from: 'MAURITANIA',
    to: 'URUGUAY',
    path: 'M 640 458 Q 520 540 350 675',
  },
];

// =============================================================================
// Continent colors
// =============================================================================

export const CONTINENT_COLORS: Record<string, string> = {
  AMERICA_DEL_NORTE: '#4a6741',  // dark green
  AMERICA_CENTRAL: '#7a6a2a',    // dark gold
  AMERICA_DEL_SUR: '#6a4a2a',    // brown
  EUROPA: '#3a4a7a',             // dark blue
  AFRICA: '#7a5a2a',             // dark orange
  ASIA: '#6a3a3a',               // dark red
  OCEANIA: '#3a6a6a',            // dark teal
};

// =============================================================================
// Continent labels (position for continent name text on the map)
// =============================================================================

export const CONTINENT_LABELS: { id: string; name: string; x: number; y: number }[] = [
  { id: 'AMERICA_DEL_NORTE', name: 'America del Norte', x: 200, y: 42 },
  { id: 'AMERICA_CENTRAL', name: 'America Central', x: 210, y: 295 },
  { id: 'AMERICA_DEL_SUR', name: 'America del Sur', x: 300, y: 455 },
  { id: 'EUROPA', name: 'Europa', x: 740, y: 48 },
  { id: 'ASIA', name: 'Asia', x: 1100, y: 42 },
  { id: 'AFRICA', name: 'Africa', x: 730, y: 340 },
  { id: 'OCEANIA', name: 'Oceania', x: 1360, y: 478 },
];

// =============================================================================
// Continent background regions (convex hull around countries per continent)
// =============================================================================

export interface ContinentRegion {
  id: string;
  path: string;
}

function computeConvexHullPath(data: MapCountryData[], padding: number): string {
  if (data.length === 0) return '';

  // Collect bounding points from each country's armyX/armyY with padding
  const points: [number, number][] = [];
  for (const c of data) {
    points.push([c.armyX - padding, c.armyY - padding]);
    points.push([c.armyX + padding, c.armyY - padding]);
    points.push([c.armyX - padding, c.armyY + padding]);
    points.push([c.armyX + padding, c.armyY + padding]);
  }

  const hull = convexHull(points);
  if (hull.length < 3) return '';

  const parts = hull.map((p, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${cmd} ${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  });
  return parts.join(' ') + ' Z';
}

function convexHull(points: [number, number][]): [number, number][] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length <= 1) return sorted;

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export const CONTINENT_REGIONS: ContinentRegion[] = [
  { id: 'AMERICA_DEL_NORTE', path: computeConvexHullPath(AMERICA_DEL_NORTE, 40) },
  { id: 'AMERICA_CENTRAL', path: computeConvexHullPath(AMERICA_CENTRAL, 35) },
  { id: 'AMERICA_DEL_SUR', path: computeConvexHullPath(AMERICA_DEL_SUR, 40) },
  { id: 'EUROPA', path: computeConvexHullPath(EUROPA, 35) },
  { id: 'ASIA', path: computeConvexHullPath(ASIA, 35) },
  { id: 'AFRICA', path: computeConvexHullPath(AFRICA, 38) },
  { id: 'OCEANIA', path: computeConvexHullPath(OCEANIA, 40) },
];
