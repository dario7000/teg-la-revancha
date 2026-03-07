// =============================================================================
// SVG map data for all 72 countries in TEG La Revancha
// ViewBox: 0 0 2688 1568 (matches background image dimensions)
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
// AMERICA DEL NORTE (12 countries)
// =============================================================================

const AMERICA_DEL_NORTE: MapCountryData[] = [
  {
    id: 'ALASKA',
    name: 'Alaska',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 73 120 L 55 83 L 106 54 L 179 30 L 247 5 L 350 72 L 315 88 L 283 77 L 231 81 L 193 121 L 148 147 L 112 168 L 112 134 Z',
    labelX: 142,
    labelY: 92,
    armyX: 147,
    armyY: 107,
  },
  {
    id: 'ISLA_VICTORIA',
    name: 'Isla Victoria',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 483 31 L 564 31 L 657 50 L 657 79 L 619 86 L 554 104 L 515 102 L 387 103 L 399 68 Z',
    labelX: 534,
    labelY: 67,
    armyX: 537,
    armyY: 80,
  },
  {
    id: 'GROENLANDIA',
    name: 'Groenlandia',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 854 8 L 918 8 L 962 10 L 1047 55 L 1003 96 L 1009 144 L 989 187 L 898 155 L 859 153 L 795 104 L 705 78 L 731 -2 Z',
    labelX: 883,
    labelY: 63,
    armyX: 888,
    armyY: 78,
  },
  {
    id: 'LABRADOR',
    name: 'Labrador',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 647 108 L 712 88 L 740 117 L 798 121 L 803 150 L 739 158 L 684 182 L 596 159 L 593 135 Z',
    labelX: 697,
    labelY: 125,
    armyX: 699,
    armyY: 138,
  },
  {
    id: 'CANADA',
    name: 'Canada',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 144 209 L 120 168 L 245 81 L 305 92 L 343 82 L 388 177 L 489 178 L 415 248 L 333 271 L 260 239 L 198 266 L 149 285 L 131 272 Z',
    labelX: 255,
    labelY: 159,
    armyX: 260,
    armyY: 174,
  },
  {
    id: 'TERRANOVA',
    name: 'Terranova',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 413 254 L 488 183 L 629 172 L 669 205 L 664 237 L 578 276 L 662 318 L 567 386 L 495 387 L 437 332 Z',
    labelX: 522,
    labelY: 280,
    armyX: 524,
    armyY: 293,
  },
  {
    id: 'OREGON',
    name: 'Oregon',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 260 239 L 337 274 L 419 250 L 440 344 L 502 396 L 471 434 L 313 395 L 134 363 L 123 282 Z',
    labelX: 296,
    labelY: 317,
    armyX: 299,
    armyY: 327,
  },
  {
    id: 'CHICAGO',
    name: 'Chicago',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 600 360 L 633 340 L 701 304 L 810 346 L 771 405 L 689 457 L 621 425 L 483 439 L 490 408 L 537 394 Z',
    labelX: 641,
    labelY: 382,
    armyX: 646,
    armyY: 392,
  },
  {
    id: 'NUEVA_YORK',
    name: 'Nueva York',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 726 179 L 855 196 L 939 213 L 945 238 L 989 320 L 824 279 L 878 314 L 831 350 L 709 320 Z',
    labelX: 840,
    labelY: 240,
    armyX: 843,
    armyY: 250,
  },
  {
    id: 'LAS_VEGAS',
    name: 'Las Vegas',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 131 363 L 276 391 L 348 409 L 485 448 L 412 489 L 281 486 L 216 469 L 123 465 L 119 416 Z',
    labelX: 286,
    labelY: 430,
    armyX: 288,
    armyY: 440,
  },
  {
    id: 'CALIFORNIA',
    name: 'California',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 142 549 L 120 463 L 436 490 L 531 523 L 484 553 L 312 552 L 385 631 L 313 635 L 175 524 L 235 636 Z',
    labelX: 265,
    labelY: 520,
    armyX: 270,
    armyY: 530,
  },
  {
    id: 'FLORIDA',
    name: 'Florida',
    continent: 'AMERICA_DEL_NORTE',
    path: 'M 424 484 L 498 448 L 625 424 L 685 467 L 644 498 L 646 542 L 632 549 L 613 507 L 598 517 L 558 500 L 529 519 L 492 502 Z',
    labelX: 546,
    labelY: 463,
    armyX: 551,
    armyY: 473,
  },
];

// =============================================================================
// AMERICA CENTRAL (6 countries)
// =============================================================================

const AMERICA_CENTRAL: MapCountryData[] = [
  {
    id: 'MEXICO',
    name: 'Mexico',
    continent: 'AMERICA_CENTRAL',
    path: 'M 327 571 L 317 552 L 478 549 L 475 659 L 432 758 L 388 724 L 353 689 L 383 641 L 376 606 L 352 589 Z',
    labelX: 422,
    labelY: 643,
    armyX: 427,
    armyY: 653,
  },
  {
    id: 'CUBA',
    name: 'Cuba',
    continent: 'AMERICA_CENTRAL',
    path: 'M 630 566 L 757 578 L 839 612 L 878 660 L 824 681 L 730 619 L 631 613 L 564 572 Z',
    labelX: 767,
    labelY: 605,
    armyX: 772,
    armyY: 612,
  },
  {
    id: 'JAMAICA',
    name: 'Jamaica',
    continent: 'AMERICA_CENTRAL',
    path: 'M 716 745 L 709 679 L 818 761 L 895 772 L 836 825 L 759 824 L 742 774 Z',
    labelX: 776,
    labelY: 765,
    armyX: 779,
    armyY: 770,
  },
  {
    id: 'HONDURAS',
    name: 'Honduras',
    continent: 'AMERICA_CENTRAL',
    path: 'M 450 710 L 472 682 L 519 677 L 516 646 L 563 650 L 598 698 L 491 772 L 433 761 Z',
    labelX: 494,
    labelY: 712,
    armyX: 497,
    armyY: 719,
  },
  {
    id: 'EL_SALVADOR',
    name: 'El Salvador',
    continent: 'AMERICA_CENTRAL',
    path: 'M 523 754 L 569 721 L 599 691 L 659 761 L 654 792 L 591 781 L 529 792 L 499 775 Z',
    labelX: 564,
    labelY: 751,
    armyX: 569,
    armyY: 758,
  },
  {
    id: 'NICARAGUA',
    name: 'Nicaragua',
    continent: 'AMERICA_CENTRAL',
    path: 'M 499 790 L 575 784 L 655 792 L 647 841 L 628 881 L 546 891 L 501 874 L 503 837 Z',
    labelX: 567,
    labelY: 834,
    armyX: 572,
    armyY: 841,
  },
];

// =============================================================================
// AMERICA DEL SUR (8 countries)
// =============================================================================

const AMERICA_DEL_SUR: MapCountryData[] = [
  {
    id: 'COLOMBIA',
    name: 'Colombia',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 365 1147 L 283 1091 L 454 904 L 650 885 L 612 1005 L 560 1008 L 534 1050 L 482 1044 L 456 1092 L 400 1107 Z',
    labelX: 465,
    labelY: 981,
    armyX: 470,
    armyY: 991,
  },
  {
    id: 'VENEZUELA',
    name: 'Venezuela',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 640 918 L 666 892 L 721 918 L 718 956 L 819 1030 L 744 1070 L 680 1042 L 612 1006 L 626 961 L 646 943 Z',
    labelX: 695,
    labelY: 987,
    armyX: 700,
    armyY: 997,
  },
  {
    id: 'BRASIL',
    name: 'Brasil',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 540 1052 L 573 999 L 747 1069 L 813 1035 L 961 1145 L 921 1214 L 837 1276 L 796 1313 L 711 1293 L 688 1282 L 735 1213 L 683 1181 L 632 1174 L 586 1149 L 461 1137 L 452 1094 L 488 1051 Z',
    labelX: 745,
    labelY: 1126,
    armyX: 750,
    armyY: 1141,
  },
  {
    id: 'BOLIVIA',
    name: 'Bolivia',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 477 1171 L 471 1138 L 592 1153 L 630 1174 L 611 1185 L 578 1287 L 534 1267 L 507 1288 L 493 1245 L 493 1213 Z',
    labelX: 541,
    labelY: 1206,
    armyX: 546,
    armyY: 1216,
  },
  {
    id: 'PARAGUAY',
    name: 'Paraguay',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 631 1177 L 683 1182 L 735 1217 L 686 1283 L 640 1320 L 640 1287 L 589 1271 L 599 1233 L 610 1193 Z',
    labelX: 654,
    labelY: 1224,
    armyX: 659,
    armyY: 1234,
  },
  {
    id: 'URUGUAY',
    name: 'Uruguay',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 657 1326 L 705 1297 L 798 1316 L 788 1373 L 756 1370 L 736 1394 L 662 1398 L 641 1366 Z',
    labelX: 705,
    labelY: 1347,
    armyX: 710,
    armyY: 1354,
  },
  {
    id: 'CHILE',
    name: 'Chile',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 469 1145 L 479 1182 L 488 1215 L 494 1248 L 495 1264 L 502 1273 L 505 1291 L 525 1278 L 526 1353 L 560 1412 L 567 1489 L 608 1571 L 575 1552 L 544 1496 L 506 1454 L 484 1379 L 414 1292 L 370 1138 L 400 1112 L 451 1093 Z',
    labelX: 464,
    labelY: 1272,
    armyX: 469,
    armyY: 1287,
  },
  {
    id: 'ARGENTINA',
    name: 'Argentina',
    continent: 'AMERICA_DEL_SUR',
    path: 'M 637 1288 L 637 1320 L 691 1282 L 705 1296 L 660 1326 L 637 1363 L 662 1400 L 655 1441 L 622 1468 L 637 1571 L 606 1569 L 565 1490 L 561 1424 L 528 1352 L 526 1273 L 574 1285 L 590 1273 Z',
    labelX: 593,
    labelY: 1384,
    armyX: 598,
    armyY: 1399,
  },
];

// =============================================================================
// EUROPA (16 countries)
// =============================================================================

const EUROPA: MapCountryData[] = [
  {
    id: 'ISLANDIA',
    name: 'Islandia',
    continent: 'EUROPA',
    path: 'M 1152 230 L 1213 174 L 1370 191 L 1342 249 L 1319 341 L 1239 321 L 1096 305 L 1119 266 Z',
    labelX: 1240,
    labelY: 236,
    armyX: 1243,
    armyY: 246,
  },
  {
    id: 'IRLANDA',
    name: 'Irlanda',
    continent: 'EUROPA',
    path: 'M 1248 412 L 1291 385 L 1354 355 L 1344 445 L 1312 455 L 1241 499 L 1158 473 L 1208 423 Z',
    labelX: 1277,
    labelY: 410,
    armyX: 1279,
    armyY: 420,
  },
  {
    id: 'GRAN_BRETAÑA',
    name: 'Gran Bretaña',
    continent: 'EUROPA',
    path: 'M 1345 404 L 1386 332 L 1474 405 L 1435 467 L 1432 513 L 1367 521 L 1300 562 L 1262 541 L 1372 448 Z',
    labelX: 1395,
    labelY: 451,
    armyX: 1400,
    armyY: 464,
  },
  {
    id: 'NORUEGA',
    name: 'Noruega',
    continent: 'EUROPA',
    path: 'M 1502 182 L 1564 140 L 1674 157 L 1634 213 L 1587 232 L 1569 316 L 1487 371 L 1497 299 L 1427 335 L 1449 256 Z',
    labelX: 1555,
    labelY: 220,
    armyX: 1560,
    armyY: 232,
  },
  {
    id: 'FINLANDIA',
    name: 'Finlandia',
    continent: 'EUROPA',
    path: 'M 1635 216 L 1673 156 L 1748 167 L 1693 238 L 1782 304 L 1743 340 L 1695 324 L 1643 321 L 1623 263 L 1594 235 Z',
    labelX: 1661,
    labelY: 236,
    armyX: 1666,
    armyY: 248,
  },
  {
    id: 'PORTUGAL',
    name: 'Portugal',
    continent: 'EUROPA',
    path: 'M 1166 646 L 1210 645 L 1298 651 L 1233 691 L 1235 843 L 1160 823 L 1165 770 L 1157 730 Z',
    labelX: 1205,
    labelY: 730,
    armyX: 1207,
    armyY: 740,
  },
  {
    id: 'ESPAÑA',
    name: 'España',
    continent: 'EUROPA',
    path: 'M 1235 698 L 1290 665 L 1384 662 L 1473 730 L 1448 763 L 1452 819 L 1350 845 L 1307 841 L 1238 841 L 1232 759 Z',
    labelX: 1347,
    labelY: 733,
    armyX: 1352,
    armyY: 745,
  },
  {
    id: 'FRANCIA',
    name: 'Francia',
    continent: 'EUROPA',
    path: 'M 1400 582 L 1369 556 L 1475 506 L 1514 524 L 1476 548 L 1529 607 L 1474 731 L 1388 663 L 1401 619 Z',
    labelX: 1442,
    labelY: 609,
    armyX: 1446,
    armyY: 619,
  },
  {
    id: 'ALEMANIA',
    name: 'Alemania',
    continent: 'EUROPA',
    path: 'M 1483 497 L 1584 394 L 1648 398 L 1646 491 L 1597 547 L 1619 611 L 1523 596 L 1512 558 Z',
    labelX: 1572,
    labelY: 501,
    armyX: 1575,
    armyY: 511,
  },
  {
    id: 'POLONIA',
    name: 'Polonia',
    continent: 'EUROPA',
    path: 'M 1657 399 L 1804 389 L 1844 573 L 1813 631 L 1734 715 L 1725 601 L 1779 516 L 1656 493 Z',
    labelX: 1784,
    labelY: 472,
    armyX: 1789,
    armyY: 482,
  },
  {
    id: 'BIELORRUSIA',
    name: 'Bielorrusia',
    continent: 'EUROPA',
    path: 'M 1838 127 L 1861 263 L 1867 326 L 1803 394 L 1737 370 L 1786 306 L 1695 239 L 1764 157 Z',
    labelX: 1785,
    labelY: 266,
    armyX: 1790,
    armyY: 276,
  },
  {
    id: 'UCRANIA',
    name: 'Ucrania',
    continent: 'EUROPA',
    path: 'M 1926 335 L 1990 413 L 1897 480 L 1840 508 L 1806 397 L 1873 328 L 1846 117 L 1958 156 Z',
    labelX: 1894,
    labelY: 350,
    armyX: 1899,
    armyY: 360,
  },
  {
    id: 'CROACIA',
    name: 'Croacia',
    continent: 'EUROPA',
    path: 'M 1664 607 L 1703 581 L 1722 609 L 1727 752 L 1647 739 L 1642 683 L 1604 651 L 1609 615 Z',
    labelX: 1677,
    labelY: 646,
    armyX: 1682,
    armyY: 656,
  },
  {
    id: 'SERBIA',
    name: 'Serbia',
    continent: 'EUROPA',
    path: 'M 1633 534 L 1648 497 L 1772 518 L 1728 593 L 1707 584 L 1661 605 L 1602 581 L 1600 547 Z',
    labelX: 1691,
    labelY: 523,
    armyX: 1696,
    armyY: 533,
  },
  {
    id: 'ALBANIA',
    name: 'Albania',
    continent: 'EUROPA',
    path: 'M 1836 499 L 1906 486 L 1943 522 L 1914 698 L 1841 786 L 1803 771 L 1813 635 L 1838 587 Z',
    labelX: 1869,
    labelY: 599,
    armyX: 1874,
    armyY: 606,
  },
  {
    id: 'ITALIA',
    name: 'Italia',
    continent: 'EUROPA',
    path: 'M 1496 689 L 1532 592 L 1561 632 L 1601 619 L 1592 676 L 1649 782 L 1604 794 L 1563 831 L 1543 736 Z',
    labelX: 1575,
    labelY: 704,
    armyX: 1580,
    armyY: 714,
  },
];

// =============================================================================
// ASIA (16 countries)
// =============================================================================

const ASIA: MapCountryData[] = [
  {
    id: 'SIBERIA',
    name: 'Siberia',
    continent: 'ASIA',
    path: 'M 2032 53 L 2022 17 L 2136 18 L 2170 39 L 2160 147 L 2121 143 L 2079 139 L 2024 131 L 2013 105 L 2006 74 L 2011 57 Z',
    labelX: 2089,
    labelY: 63,
    armyX: 2094,
    armyY: 76,
  },
  {
    id: 'CHUKCHI',
    name: 'Chukchi',
    continent: 'ASIA',
    path: 'M 2223 66 L 2290 50 L 2375 54 L 2477 43 L 2552 91 L 2401 120 L 2364 166 L 2301 181 L 2199 136 L 2222 108 Z',
    labelX: 2365,
    labelY: 94,
    armyX: 2370,
    armyY: 107,
  },
  {
    id: 'KAMCHATKA',
    name: 'Kamchatka',
    continent: 'ASIA',
    path: 'M 2253 194 L 2383 158 L 2406 119 L 2563 93 L 2545 191 L 2421 216 L 2448 372 L 2325 377 L 2288 261 L 2243 239 Z',
    labelX: 2413,
    labelY: 240,
    armyX: 2418,
    armyY: 253,
  },
  {
    id: 'CHECHENIA',
    name: 'Chechenia',
    continent: 'ASIA',
    path: 'M 2019 131 L 2141 147 L 2174 172 L 2178 216 L 2208 260 L 2197 289 L 2103 248 L 2010 170 Z',
    labelX: 2145,
    labelY: 191,
    armyX: 2150,
    armyY: 203,
  },
  {
    id: 'RUSIA',
    name: 'Rusia',
    continent: 'ASIA',
    path: 'M 2101 251 L 2145 359 L 2138 535 L 2122 607 L 2075 563 L 2036 417 L 1940 352 L 1958 132 Z',
    labelX: 2031,
    labelY: 310,
    armyX: 2036,
    armyY: 322,
  },
  {
    id: 'CHINA',
    name: 'China',
    continent: 'ASIA',
    path: 'M 2277 258 L 2316 337 L 2303 534 L 2194 605 L 2242 714 L 2124 617 L 2138 519 L 2110 445 L 2152 369 L 2100 263 L 2197 289 Z',
    labelX: 2214,
    labelY: 368,
    armyX: 2219,
    armyY: 381,
  },
  {
    id: 'JAPON',
    name: 'Japon',
    continent: 'ASIA',
    path: 'M 2530 348 L 2527 296 L 2614 324 L 2638 373 L 2607 472 L 2552 567 L 2529 582 L 2535 508 L 2526 469 L 2561 411 Z',
    labelX: 2576,
    labelY: 428,
    armyX: 2581,
    armyY: 440,
  },
  {
    id: 'COREA',
    name: 'Corea',
    continent: 'ASIA',
    path: 'M 2296 412 L 2327 373 L 2454 374 L 2510 477 L 2461 650 L 2384 651 L 2373 579 L 2309 542 Z',
    labelX: 2409,
    labelY: 512,
    armyX: 2412,
    armyY: 522,
  },
  {
    id: 'TURQUIA',
    name: 'Turquia',
    continent: 'ASIA',
    path: 'M 2007 677 L 2032 557 L 2082 569 L 2149 636 L 2237 708 L 2183 829 L 2080 772 L 2108 679 Z',
    labelX: 2140,
    labelY: 666,
    armyX: 2144,
    armyY: 679,
  },
  {
    id: 'ISRAEL',
    name: 'Israel',
    continent: 'ASIA',
    path: 'M 1951 738 L 2000 672 L 2090 682 L 2122 816 L 2026 809 L 1962 895 L 1916 856 L 1964 801 Z',
    labelX: 2023,
    labelY: 770,
    armyX: 2026,
    armyY: 780,
  },
  {
    id: 'IRAK',
    name: 'Irak',
    continent: 'ASIA',
    path: 'M 1826 797 L 1919 691 L 1935 550 L 2038 564 L 2012 659 L 1950 737 L 1967 802 L 1913 861 Z',
    labelX: 1947,
    labelY: 667,
    armyX: 1952,
    armyY: 677,
  },
  {
    id: 'IRAN',
    name: 'Iran',
    continent: 'ASIA',
    path: 'M 1992 556 L 1965 531 L 1909 493 L 1901 461 L 1982 421 L 2032 425 L 2071 561 L 2033 560 Z',
    labelX: 1993,
    labelY: 464,
    armyX: 1998,
    armyY: 474,
  },
  {
    id: 'ARABIA',
    name: 'Arabia',
    continent: 'ASIA',
    path: 'M 2000 845 L 2030 811 L 2128 824 L 2161 885 L 2067 967 L 2035 926 L 2013 902 L 1975 896 Z',
    labelX: 2065,
    labelY: 846,
    armyX: 2070,
    armyY: 856,
  },
  {
    id: 'INDIA',
    name: 'India',
    continent: 'ASIA',
    path: 'M 2213 736 L 2289 692 L 2314 743 L 2355 763 L 2360 812 L 2283 934 L 2242 936 L 2206 906 L 2221 844 L 2195 829 Z',
    labelX: 2272,
    labelY: 820,
    armyX: 2277,
    armyY: 833,
  },
  {
    id: 'VIETNAM',
    name: 'Vietnam',
    continent: 'ASIA',
    path: 'M 2378 652 L 2472 654 L 2519 719 L 2577 855 L 2532 908 L 2493 903 L 2428 828 L 2371 801 L 2333 747 Z',
    labelX: 2450,
    labelY: 757,
    armyX: 2455,
    armyY: 767,
  },
  {
    id: 'MALASIA',
    name: 'Malasia',
    continent: 'ASIA',
    path: 'M 2191 610 L 2271 584 L 2307 537 L 2373 581 L 2374 646 L 2328 746 L 2289 694 L 2248 712 Z',
    labelX: 2319,
    labelY: 615,
    armyX: 2324,
    armyY: 625,
  },
];

// =============================================================================
// AFRICA (8 countries)
// =============================================================================

const AFRICA: MapCountryData[] = [
  {
    id: 'SAHARA',
    name: 'Sahara',
    continent: 'AFRICA',
    path: 'M 1260 916 L 1350 869 L 1574 856 L 1465 948 L 1457 1112 L 1354 1159 L 1251 1124 L 1217 1045 Z',
    labelX: 1336,
    labelY: 996,
    armyX: 1341,
    armyY: 1006,
  },
  {
    id: 'EGIPTO',
    name: 'Egipto',
    continent: 'AFRICA',
    path: 'M 1568 868 L 1665 908 L 1711 903 L 1789 933 L 1799 966 L 1847 1019 L 1470 986 L 1470 945 Z',
    labelX: 1645,
    labelY: 945,
    armyX: 1650,
    armyY: 957,
  },
  {
    id: 'MAURITANIA',
    name: 'Mauritania',
    continent: 'AFRICA',
    path: 'M 1714 1158 L 1815 1164 L 1900 1196 L 1783 1315 L 1764 1261 L 1687 1259 L 1667 1232 L 1710 1200 Z',
    labelX: 1816,
    labelY: 1216,
    armyX: 1820,
    armyY: 1226,
  },
  {
    id: 'NIGERIA',
    name: 'Nigeria',
    continent: 'AFRICA',
    path: 'M 1348 1166 L 1453 1115 L 1629 1105 L 1716 1162 L 1662 1234 L 1603 1270 L 1530 1227 L 1370 1234 Z',
    labelX: 1545,
    labelY: 1172,
    armyX: 1548,
    armyY: 1182,
  },
  {
    id: 'ETIOPIA',
    name: 'Etiopia',
    continent: 'AFRICA',
    path: 'M 1468 987 L 1697 1009 L 1854 1023 L 1873 1060 L 1697 1136 L 1624 1102 L 1459 1113 L 1462 1047 Z',
    labelX: 1626,
    labelY: 1056,
    armyX: 1631,
    armyY: 1066,
  },
  {
    id: 'ANGOLA',
    name: 'Angola',
    continent: 'AFRICA',
    path: 'M 1764 1094 L 1818 1086 L 1889 1054 L 1968 1091 L 1886 1185 L 1813 1159 L 1708 1158 L 1692 1137 Z',
    labelX: 1825,
    labelY: 1115,
    armyX: 1830,
    armyY: 1128,
  },
  {
    id: 'SUDAFRICA',
    name: 'Sudafrica',
    continent: 'AFRICA',
    path: 'M 1602 1268 L 1656 1232 L 1695 1260 L 1764 1262 L 1782 1321 L 1735 1378 L 1741 1474 L 1674 1440 L 1655 1327 L 1616 1306 Z',
    labelX: 1702,
    labelY: 1298,
    armyX: 1707,
    armyY: 1310,
  },
  {
    id: 'MADAGASCAR',
    name: 'Madagascar',
    continent: 'AFRICA',
    path: 'M 1892 1268 L 1949 1187 L 1992 1211 L 1977 1282 L 1937 1315 L 1889 1367 L 1789 1399 L 1766 1364 L 1839 1307 Z',
    labelX: 1889,
    labelY: 1289,
    armyX: 1894,
    armyY: 1302,
  },
];

// =============================================================================
// OCEANIA (6 countries)
// =============================================================================

const OCEANIA: MapCountryData[] = [
  {
    id: 'SUMATRA',
    name: 'Sumatra',
    continent: 'OCEANIA',
    path: 'M 2160 1109 L 2220 996 L 2275 1006 L 2280 1058 L 2288 1126 L 2114 1210 L 2109 1149 L 2122 1128 Z',
    labelX: 2196,
    labelY: 1095,
    armyX: 2201,
    armyY: 1107,
  },
  {
    id: 'FILIPINAS',
    name: 'Filipinas',
    continent: 'OCEANIA',
    path: 'M 2366 1001 L 2421 989 L 2487 1009 L 2527 1031 L 2516 1064 L 2491 1088 L 2436 1062 L 2337 1060 L 2308 1048 L 2322 1023 Z',
    labelX: 2429,
    labelY: 1038,
    armyX: 2433,
    armyY: 1050,
  },
  {
    id: 'TONGA',
    name: 'Tonga',
    continent: 'OCEANIA',
    path: 'M 2536 1046 L 2595 1066 L 2685 1068 L 2669 1107 L 2678 1158 L 2615 1186 L 2609 1164 L 2556 1146 L 2545 1098 Z',
    labelX: 2614,
    labelY: 1114,
    armyX: 2619,
    armyY: 1126,
  },
  {
    id: 'AUSTRALIA',
    name: 'Australia',
    continent: 'OCEANIA',
    path: 'M 2342 1122 L 2438 1125 L 2468 1104 L 2539 1155 L 2563 1197 L 2525 1290 L 2518 1330 L 2463 1389 L 2389 1384 L 2279 1369 L 2126 1307 L 2135 1277 L 2196 1210 L 2293 1152 Z',
    labelX: 2377,
    labelY: 1237,
    armyX: 2382,
    armyY: 1252,
  },
  {
    id: 'TASMANIA',
    name: 'Tasmania',
    continent: 'OCEANIA',
    path: 'M 2351 1430 L 2418 1414 L 2485 1433 L 2521 1461 L 2479 1497 L 2420 1501 L 2385 1485 L 2291 1463 Z',
    labelX: 2433,
    labelY: 1463,
    armyX: 2438,
    armyY: 1475,
  },
  {
    id: 'NUEVA_ZELANDA',
    name: 'Nueva Zelanda',
    continent: 'OCEANIA',
    path: 'M 2430 1532 L 2457 1573 L 2366 1581 L 2286 1569 L 2216 1549 L 2168 1527 L 2199 1482 L 2255 1477 L 2334 1518 L 2385 1530 Z',
    labelX: 2330,
    labelY: 1530,
    armyX: 2335,
    armyY: 1542,
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
  // N.America <-> Asia (Bering Strait)
  { from: 'ALASKA', to: 'CHUKCHI' },
  { from: 'ALASKA', to: 'KAMCHATKA' },
  // N.America <-> Europe
  { from: 'GROENLANDIA', to: 'ISLANDIA' },
  // N.America <-> C.America
  { from: 'LAS_VEGAS', to: 'MEXICO' },
  { from: 'CALIFORNIA', to: 'MEXICO' },
  { from: 'FLORIDA', to: 'MEXICO' },
  { from: 'FLORIDA', to: 'CUBA' },
  // N.America <-> Oceania (Pacific bridge)
  { from: 'CALIFORNIA', to: 'TONGA' },
  { from: 'CALIFORNIA', to: 'FILIPINAS' },
  // C.America <-> S.America
  { from: 'EL_SALVADOR', to: 'COLOMBIA' },
  { from: 'NICARAGUA', to: 'COLOMBIA' },
  { from: 'NICARAGUA', to: 'VENEZUELA' },
  // S.America <-> Africa
  { from: 'URUGUAY', to: 'MAURITANIA' },
  { from: 'BRASIL', to: 'NIGERIA' },
  { from: 'BRASIL', to: 'SAHARA' },
  // Europe <-> Africa
  { from: 'ESPAÑA', to: 'SAHARA' },
  { from: 'POLONIA', to: 'EGIPTO' },
  // Europe <-> Asia
  { from: 'UCRANIA', to: 'RUSIA' },
  // Asia <-> Africa
  { from: 'IRAK', to: 'EGIPTO' },
  { from: 'ISRAEL', to: 'EGIPTO' },
  // Asia <-> Oceania
  { from: 'INDIA', to: 'SUMATRA' },
  { from: 'MALASIA', to: 'SUMATRA' },
  { from: 'MALASIA', to: 'FILIPINAS' },
  // S.America <-> Oceania
  { from: 'CHILE', to: 'AUSTRALIA' },
];

// Sea connections with SVG path data for drawing curved lines
export const SEA_CONNECTIONS: { from: string; to: string; path: string }[] = [
  {
    // Alaska (armyX:147, armyY:107) -> Kamchatka (armyX:2418, armyY:253)
    // Arc across the top of the map via the Bering Strait
    from: 'ALASKA',
    to: 'KAMCHATKA',
    path: 'M 147 107 Q 1283 -150 2418 253',
  },
  {
    // Groenlandia (armyX:888, armyY:78) -> Islandia (armyX:1243, armyY:246)
    // Crosses the North Atlantic
    from: 'GROENLANDIA',
    to: 'ISLANDIA',
    path: 'M 888 78 Q 1030 110 1243 246',
  },
  {
    // Brasil (armyX:750, armyY:1141) -> Nigeria (armyX:1548, armyY:1182)
    // Crosses the South Atlantic
    from: 'BRASIL',
    to: 'NIGERIA',
    path: 'M 750 1141 Q 1149 1080 1548 1182',
  },
  {
    // Brasil (armyX:750, armyY:1141) -> Sahara (armyX:1341, armyY:1006)
    // Crosses the mid-Atlantic
    from: 'BRASIL',
    to: 'SAHARA',
    path: 'M 750 1141 Q 1046 980 1341 1006',
  },
  {
    // Chile (armyX:469, armyY:1287) -> Australia (armyX:2382, armyY:1252)
    // Long arc across the South Pacific
    from: 'CHILE',
    to: 'AUSTRALIA',
    path: 'M 469 1287 Q 1426 1550 2382 1252',
  },
  {
    // España (armyX:1352, armyY:745) -> Sahara (armyX:1341, armyY:1006)
    // Short hop across the Strait of Gibraltar / Western Mediterranean
    from: 'ESPAÑA',
    to: 'SAHARA',
    path: 'M 1352 745 Q 1300 875 1341 1006',
  },
  {
    // Mauritania (armyX:1820, armyY:1226) -> Uruguay (armyX:710, armyY:1354)
    // Crosses the South Atlantic (Africa to South America)
    from: 'MAURITANIA',
    to: 'URUGUAY',
    path: 'M 1820 1226 Q 1265 1380 710 1354',
  },
  {
    // California (armyX:270, armyY:530) -> Filipinas (armyX:2433, armyY:1050)
    // Long arc across the Pacific
    from: 'CALIFORNIA',
    to: 'FILIPINAS',
    path: 'M 270 530 Q 1350 1200 2433 1050',
  },
  {
    // California (armyX:270, armyY:530) -> Tonga (armyX:2619, armyY:1126)
    // Long arc across the Pacific
    from: 'CALIFORNIA',
    to: 'TONGA',
    path: 'M 270 530 Q 1440 1250 2619 1126',
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
  { id: 'AMERICA_DEL_NORTE', name: 'America del Norte', x: 496, y: 274 },
  { id: 'AMERICA_CENTRAL', name: 'America Central', x: 603, y: 726 },
  { id: 'AMERICA_DEL_SUR', name: 'America del Sur', x: 613, y: 1202 },
  { id: 'EUROPA', name: 'Europa', x: 1565, y: 491 },
  { id: 'ASIA', name: 'Asia', x: 2220, y: 500 },
  { id: 'AFRICA', name: 'Africa', x: 1678, y: 1147 },
  { id: 'OCEANIA', name: 'Oceania', x: 2401, y: 1259 },
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
  { id: 'AMERICA_DEL_NORTE', path: computeConvexHullPath(AMERICA_DEL_NORTE, 70) },
  { id: 'AMERICA_CENTRAL', path: computeConvexHullPath(AMERICA_CENTRAL, 65) },
  { id: 'AMERICA_DEL_SUR', path: computeConvexHullPath(AMERICA_DEL_SUR, 70) },
  { id: 'EUROPA', path: computeConvexHullPath(EUROPA, 65) },
  { id: 'ASIA', path: computeConvexHullPath(ASIA, 65) },
  { id: 'AFRICA', path: computeConvexHullPath(AFRICA, 70) },
  { id: 'OCEANIA', path: computeConvexHullPath(OCEANIA, 75) },
];
