import type { en } from './en';

export const de: Record<keyof typeof en, string> = {
  'errors.unexpectedStatus': 'Ein unerwarteter Fehler ist aufgetreten ({{status}}).',

  'app.title': 'PVStorageSizer',
  'app.subtitle':
    'Lade deine viertelstündlichen Verbrauchs- und Solarertragsdaten als CSV hoch, und die App ermittelt ' +
    'die Batteriekapazität, die die ins Netz eingespeiste Energie minimiert und dabei eine gute ' +
    'Batterieauslastung beibehält.',

  'upload.consumption.title': '1. Verbrauchsdaten',
  'upload.consumption.description':
    'CSV-Export deines Stromzählers in 15-Minuten-Auflösung. Enthält die Datei auch die ins Netz ' +
    'eingespeiste Energie (unterschieden durch eine "Typ"-Spalte), leitet die App die Einspeisereihe ' +
    'automatisch aus dem im Filter nicht gewählten anderen Wert ab - dafür ist keine separate Datei nötig.',
  'upload.production.title': '2. Solarertragsdaten',
  'upload.production.description':
    'CSV-Export der Ertragsdaten deines Wechselrichters/Monitoring-Systems, für denselben Standort.',
  'upload.dropzoneHint': 'CSV-Datei hierher ziehen oder klicken zum Durchsuchen',
  'upload.rowCount': '{{count}} Zeilen',
  'upload.processing': 'Verarbeitung…',

  'params.sectionTitle': '3. Simulationsparameter',
  'params.efficiency': 'Round-Trip-Wirkungsgrad (%)',
  'params.crate': 'Max. Lade-/Entladeleistung (C-Rate)',
  'params.reserve': 'Mindestladezustand (%)',
  'params.sweepRange': 'Zu prüfender Kapazitätsbereich (kWh)',
  'params.sweepStep': 'Schrittweite (kWh)',

  'action.simulate': 'Simulation starten',
  'action.simulating': 'Berechnung…',

  'columnMapper.columnFallback': 'Spalte {{index}}',
  'columnMapper.hasHeader': 'Erste Zeile ist eine Kopfzeile (keine Daten)',
  'columnMapper.timestampFormatLabel': 'Zeitstempelformat in der Datei',
  'columnMapper.timestampSingle': 'Eine Spalte (Datum + Uhrzeit zusammen)',
  'columnMapper.timestampSplit': 'Getrennte Datums- und Uhrzeitspalten',
  'columnMapper.timestampCol': 'Zeitstempelspalte',
  'columnMapper.dateCol': 'Datumsspalte',
  'columnMapper.timeCol': 'Uhrzeitspalte',
  'columnMapper.timeHint': 'Format: HH:mm oder HH:mm:ss',
  'columnMapper.alignmentLabel': 'Der Zeitstempel markiert … des Intervalls',
  'columnMapper.alignmentEnd': 'das Ende (z. B. "00:15" = Daten für 00:00–00:15)',
  'columnMapper.alignmentStart': 'den Anfang',
  'columnMapper.valueCol': 'Wertspalte',
  'columnMapper.unitKWh': 'kWh (Energie / Intervall)',
  'columnMapper.unitKW': 'kW (Durchschnittsleistung)',
  'columnMapper.unitW': 'W (Durchschnittsleistung)',
  'columnMapper.filterToggle':
    'Nur bestimmte Zeilen verwenden (z. B. wenn die Datei sowohl Verbrauchs- als auch Erzeugungsdaten mit ' +
    'einer "Typ"-Spalte enthält)',
  'columnMapper.filterColLabel': 'Filterspalte',
  'columnMapper.filterValueLabel': 'Erforderlicher Wert',
  'columnMapper.missingToggle':
    'Es gibt eine "Status"-Spalte, die fehlende/ungültige Daten markiert (z. B. "Keine") - für diese ' +
    'Zeilen wird der Wert derselben Tageszeit vom Vortag verwendet',
  'columnMapper.missingColLabel': 'Statusspalte',
  'columnMapper.missingValueLabel': 'Wert, der fehlende Daten markiert',

  'results.heroLabel': 'empfohlene Batteriekapazität',
  'results.exportReduction': 'Reduzierung der Einspeisung',
  'results.selfConsumption': 'Eigenverbrauch der Tageserzeugung',
  'results.dailyCycles': 'Durchschnittliche tägliche Zyklenzahl',
  'results.nightCoverage': 'Deckung des nächtlichen Verbrauchs',
  'results.metaLine':
    'Analysierter Zeitraum: {{start}} – {{end}} ({{days}} Tage) · insgesamt {{consumption}} kWh Verbrauch, ' +
    '{{production}} kWh Erzeugung',

  'charts.capacity.title1': 'Reduzierung der ins Netz eingespeisten Energie gegenüber keinem Speicher',
  'charts.capacity.title2': 'Batterieauslastung (durchschnittliche tägliche Zyklenzahl)',
  'charts.capacity.dailyCycleTooltip': 'Tägliche Zyklen',
  'charts.capacity.recommended': 'Empfohlen',

  'charts.dailyProfile.title1': 'Durchschnittstag: Verbrauch, Erzeugung und Ladezustand',
  'charts.dailyProfile.title2': 'Durchschnittstag: Netzaustausch (Bezug oben / Einspeisung unten)',
  'charts.dailyProfile.seriesProduction': 'Erzeugung',
  'charts.dailyProfile.seriesConsumption': 'Verbrauch',
  'charts.dailyProfile.seriesSoc': 'Batterieladung',
  'charts.dailyProfile.seriesNetGrid': 'Netzaustausch',
  'charts.dailyProfile.import': 'Bezug',
  'charts.dailyProfile.export': 'Einspeisung',

  'charts.monthlyConsumption.title': 'Monatlicher realer Haushaltsverbrauch (Bezug + Erzeugung − Einspeisung)',
  'charts.monthlyConsumption.description':
    'Die allein aus dem Netz bezogene Energie unterschätzt den tatsächlichen Verbrauch, da sie den direkt ' +
    'aus der Solaranlage (ohne das Netz) verbrauchten Anteil nicht enthält.',
  'charts.monthlyConsumption.seriesSelfConsumed': 'Direkt selbst verbrauchte Solarenergie',
  'charts.monthlyConsumption.seriesGridImport': 'Aus dem Netz bezogene Energie',
  'charts.monthlyConsumption.tooltipLabel': '{{label}} — insgesamt {{total}} kWh',

  'charts.monthlyNight.title': 'Monatlicher durchschnittlicher Nachtverbrauch und Ladezustand zu Nachtbeginn',
  'charts.monthlyNight.description':
    'Die Nacht reicht vom letzten erzeugten Intervall eines Tages bis zum ersten erzeugten Intervall des ' +
    'nächsten Tages.',
  'charts.monthlyNight.seriesConsumption': 'Durchschnittlicher Nachtverbrauch',
  'charts.monthlyNight.seriesStartSoc': 'Durchschnittliche Ladung zu Nachtbeginn',
  'charts.monthlyNight.tooltipLabel': '{{label}} ({{count}} Nächte)',

  'charts.daySelector.title': 'Tagesverlauf (Tag wählbar, stündliche Auflösung)',
  'charts.daySelector.dayLabel': 'Tag',
  'charts.daySelector.description':
    'Verbrauch wird immer unten (negativ) angezeigt, Einspeisung und Ladezustand oben (positiv). Werte ' +
    'innerhalb einer Stunde werden summiert (beim Ladezustand gemittelt).',
  'charts.daySelector.seriesProduction': 'Aktuelle Erzeugung',
  'charts.daySelector.seriesGridExport': 'Aktuelle Einspeisung',
  'charts.daySelector.seriesGridImport': 'Aktueller Netzbezug',
  'charts.daySelector.seriesBatteryDischarge': 'Aktueller Verbrauch aus Batterie',
  'charts.daySelector.seriesTotalConsumption': 'Gesamtverbrauch',
  'charts.daySelector.seriesSoc': 'Batterieladezustand',
};
