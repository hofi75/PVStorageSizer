import type { en } from './en';

export const hu: Record<keyof typeof en, string> = {
  'errors.unexpectedStatus': 'Váratlan hiba történt ({{status}}).',

  'app.title': 'PVStorageSizer',
  'app.subtitle':
    'Töltsd fel a negyedórás fogyasztási és napelemes termelési adataidat CSV-ben, és a rendszer megkeresi ' +
    'azt az akkumulátor kapacitást, amelynél a hálózatba visszatöltött energia a legkisebb, az akkumulátor ' +
    'kihasználtsága pedig még jó.',

  'upload.consumption.title': '1. Fogyasztási adatok',
  'upload.consumption.description':
    'Elektromos mérőóra negyedórás bontású CSV exportja. Ha a fájl a vételezett és a hálózatba ' +
    'visszatáplált energiát is tartalmazza (egy "típus" oszloppal megkülönböztetve), a rendszer a ' +
    'szűrőben nem választott másik értékből automatikusan levezeti a visszatáplálást is - külön ' +
    'fájlt nem kell feltölteni hozzá.',
  'upload.production.title': '2. Napelemes termelési adatok',
  'upload.production.description': 'Az inverter/monitoring rendszer termelési CSV exportja, ugyanarra a fogyasztási helyre.',
  'upload.dropzoneHint': 'Húzd ide a CSV fájlt, vagy kattints a tallózáshoz',
  'upload.rowCount': '{{count}} sor',
  'upload.processing': 'Feldolgozás…',

  'params.sectionTitle': '3. Szimulációs paraméterek',
  'params.efficiency': 'Kör-hatásfok (%)',
  'params.crate': 'Max töltő/kisütő teljesítmény (C-rate)',
  'params.reserve': 'Minimális töltöttségi szint (%)',
  'params.sweepRange': 'Vizsgált kapacitás tartomány (kWh)',
  'params.sweepStep': 'Lépésköz (kWh)',

  'action.simulate': 'Számítás indítása',
  'action.simulating': 'Számítás…',

  'columnMapper.columnFallback': '{{index}}. oszlop',
  'columnMapper.hasHeader': 'Az első sor fejléc (nem adat)',
  'columnMapper.timestampFormatLabel': 'Időbélyeg formátuma a fájlban',
  'columnMapper.timestampSingle': 'Egy oszlopban (dátum + idő együtt)',
  'columnMapper.timestampSplit': 'Külön dátum és idő oszlopban',
  'columnMapper.timestampCol': 'Időbélyeg oszlop',
  'columnMapper.dateCol': 'Dátum oszlop',
  'columnMapper.timeCol': 'Idő oszlop',
  'columnMapper.timeHint': 'formátum: ÓÓ:PP vagy ÓÓ:PP:MM',
  'columnMapper.alignmentLabel': 'Az időbélyeg az intervallum...',
  'columnMapper.alignmentEnd': 'végét jelöli (pl. "00:15" = 00:00–00:15 közötti adat)',
  'columnMapper.alignmentStart': 'kezdetét jelöli',
  'columnMapper.valueCol': 'Érték oszlop',
  'columnMapper.unitKWh': 'kWh (energia / intervallum)',
  'columnMapper.unitKW': 'kW (átlagteljesítmény)',
  'columnMapper.unitW': 'W (átlagteljesítmény)',
  'columnMapper.filterToggle':
    'Csak bizonyos sorok felhasználása (pl. ha a fájl fogyasztási és termelési adatokat is tartalmaz egy ' +
    '"típus" oszloppal)',
  'columnMapper.filterColLabel': 'Szűrés oszlopa',
  'columnMapper.filterValueLabel': 'Elvárt érték',
  'columnMapper.missingToggle':
    'Van egy "státusz" oszlop, ami jelzi a hiányzó/érvénytelen adatot (pl. "Nincs") - ezeknél egy korábbi ' +
    'nap azonos időpontbeli értékét használjuk',
  'columnMapper.missingColLabel': 'Státusz oszlopa',
  'columnMapper.missingValueLabel': 'Hiányzó adatot jelző érték',

  'results.heroLabel': 'javasolt akkumulátor kapacitás',
  'results.exportReduction': 'Export csökkenés',
  'results.selfConsumption': 'Napi termelés önfogyasztása',
  'results.dailyCycles': 'Átlagos napi ciklusszám',
  'results.nightCoverage': 'Éjszakai fogyasztás fedezettsége',
  'results.metaLine':
    'Elemzett időszak: {{start}} – {{end}} ({{days}} nap) · összesen {{consumption}} kWh fogyasztás, ' +
    '{{production}} kWh termelés',

  'charts.capacity.title1': 'Hálózatba visszatöltött energia csökkenése a tárolás nélküli esethez képest',
  'charts.capacity.title2': 'Akkumulátor kihasználtság (átlagos napi ciklusszám)',
  'charts.capacity.dailyCycleTooltip': 'Napi ciklus',
  'charts.capacity.recommended': 'Javasolt',

  'charts.dailyProfile.title1': 'Átlagos nap: fogyasztás, termelés és töltöttségi szint',
  'charts.dailyProfile.title2': 'Átlagos nap: hálózati csere (behozás felül / visszatöltés alul)',
  'charts.dailyProfile.seriesProduction': 'Termelés',
  'charts.dailyProfile.seriesConsumption': 'Fogyasztás',
  'charts.dailyProfile.seriesSoc': 'Akku töltöttség',
  'charts.dailyProfile.seriesNetGrid': 'Hálózati csere',
  'charts.dailyProfile.import': 'vételezés',
  'charts.dailyProfile.export': 'visszatöltés',

  'charts.monthlyConsumption.title': 'Havi valós háztartási fogyasztás (vételezés + termelés − visszatáplálás)',
  'charts.monthlyConsumption.description':
    'A hálózatból vételezett energia önmagában alábecsüli a tényleges fogyasztást, mert nem tartalmazza a ' +
    'napelemből közvetlenül (hálózat nélkül) elfogyasztott részt.',
  'charts.monthlyConsumption.seriesSelfConsumed': 'Közvetlenül elfogyasztott napelemes energia',
  'charts.monthlyConsumption.seriesGridImport': 'Hálózatból vételezett energia',
  'charts.monthlyConsumption.tooltipLabel': '{{label}} — összesen {{total}} kWh',

  'charts.monthlyNight.title': 'Havi átlagos éjszakai fogyasztás és kezdő akku-töltöttség',
  'charts.monthlyNight.description':
    'Az éjszaka a nap utolsó termelt intervallumától a következő nap első termelt intervallumáig tart.',
  'charts.monthlyNight.seriesConsumption': 'Átlagos éjszakai fogyasztás',
  'charts.monthlyNight.seriesStartSoc': 'Átlagos töltöttség éjszaka elején',
  'charts.monthlyNight.tooltipLabel': '{{label}} ({{count}} éjszaka)',

  'charts.daySelector.title': 'Napi menetrend (kiválasztható nap, órás bontásban)',
  'charts.daySelector.dayLabel': 'Nap',
  'charts.daySelector.description':
    'A fogyasztás mindig lent (negatív), a visszatáplálás és a töltöttség fent (pozitív) látható. Az órán ' +
    'belüli adatok összegezve (töltöttségnél átlagolva) jelennek meg.',
  'charts.daySelector.seriesProduction': 'Aktuális termelés',
  'charts.daySelector.seriesGridExport': 'Aktuális visszatáplálás',
  'charts.daySelector.seriesGridImport': 'Aktuális fogyasztás hálózatról',
  'charts.daySelector.seriesBatteryDischarge': 'Aktuális fogyasztás akkumulátorról',
  'charts.daySelector.seriesTotalConsumption': 'Összes fogyasztás',
  'charts.daySelector.seriesSoc': 'Akkumulátor töltöttség',
};
