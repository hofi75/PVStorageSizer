// Source of truth for translation keys - hu.ts and de.ts must provide the same keys
// (checked at dev-time in context.tsx).
export const en = {
  'errors.unexpectedStatus': 'An unexpected error occurred ({{status}}).',

  'app.title': 'PVStorageSizer',
  'app.subtitle':
    'Upload your quarter-hourly consumption and solar production data as CSV, and the app finds the ' +
    'battery capacity that minimizes energy exported to the grid while keeping battery utilization reasonable.',

  'upload.grid.title': '1. Grid data',
  'upload.grid.description':
    'CSV export from your electricity meter, in 15-minute resolution. This can be grid usage only, or a ' +
    'single file with both grid usage and grid backfeed readings distinguished by a "type" column (e.g. ' +
    '"Vételezett"/"Visszatáplált") - the app automatically detects both and derives the backfeed series ' +
    'from it, ignoring any other row types; no separate file needed for that.',
  'upload.production.title': '2. Solar production data',
  'upload.production.description':
    "CSV export from your inverter/monitoring system's production data, for the same site.",
  'upload.dropzoneHint': 'Drag a CSV file here, or click to browse',
  'upload.rowCount': '{{count}} rows',
  'upload.processing': 'Processing…',

  'params.sectionTitle': '3. Simulation parameters',
  'params.efficiency': 'Round-trip efficiency (%)',
  'params.crate': 'Max charge/discharge power (C-rate)',
  'params.reserve': 'Minimum state of charge (%)',
  'params.sweepRange': 'Capacity range to test (kWh)',
  'params.sweepStep': 'Step size (kWh)',

  'action.simulate': 'Run simulation',
  'action.simulating': 'Calculating…',

  'columnMapper.columnFallback': 'Column {{index}}',
  'columnMapper.hasHeader': 'First row is a header (not data)',
  'columnMapper.timestampFormatLabel': 'Timestamp format in the file',
  'columnMapper.timestampSingle': 'Single column (date + time together)',
  'columnMapper.timestampSplit': 'Separate date and time columns',
  'columnMapper.timestampCol': 'Timestamp column',
  'columnMapper.dateCol': 'Date column',
  'columnMapper.timeCol': 'Time column',
  'columnMapper.timeHint': 'format: HH:mm or HH:mm:ss',
  'columnMapper.alignmentLabel': "The timestamp marks the interval's…",
  'columnMapper.alignmentEnd': 'end (e.g. "00:15" = data for 00:00–00:15)',
  'columnMapper.alignmentStart': 'start',
  'columnMapper.valueCol': 'Value column',
  'columnMapper.unitKWh': 'kWh (energy / interval)',
  'columnMapper.unitKW': 'kW (average power)',
  'columnMapper.unitW': 'W (average power)',
  'columnMapper.filterToggle':
    'Only use certain rows (e.g. if the file contains both grid usage and grid backfeed data with a ' +
    '"type" column)',
  'columnMapper.filterColLabel': 'Filter column',
  'columnMapper.filterValueLabel': 'Required value',
  'columnMapper.filterValueLabelGridUsage': 'Value meaning grid usage',
  'columnMapper.gridBackfeedValueLabel': 'Value meaning grid backfeed (optional)',
  'columnMapper.gridBackfeedNoneOption': '— not present in this file —',
  'columnMapper.missingToggle':
    'There\'s a "status" column marking missing/invalid data (e.g. "None") - for those rows, use the ' +
    'same time-of-day value from a previous day',
  'columnMapper.missingColLabel': 'Status column',
  'columnMapper.missingValueLabel': 'Value marking missing data',

  'results.heroLabel': 'recommended battery capacity',
  'results.selectedHeroLabel': 'selected battery capacity',
  'results.capacitySelectLabel': 'Battery capacity',
  'results.resetToRecommended': 'Reset to recommended',
  'results.recalculating': 'Recalculating…',
  'results.exportReduction': 'Export reduction',
  'results.selfConsumption': 'Self-consumption of daily production',
  'results.dailyCycles': 'Average daily cycle count',
  'results.nightCoverage': 'Night consumption coverage',
  'results.metaLine':
    'Analyzed period: {{start}} – {{end}} ({{days}} days) · total {{consumption}} kWh consumption, ' +
    '{{production}} kWh production',

  'charts.capacity.title1': 'Reduction in grid-exported energy vs. no storage',
  'charts.capacity.title2': 'Battery utilization (average daily cycle count)',
  'charts.capacity.dailyCycleTooltip': 'Daily cycles',
  'charts.capacity.recommended': 'Recommended',

  'charts.dailyProfile.title1': 'Average day: consumption, production, and state of charge',
  'charts.dailyProfile.title2': 'Average day: grid exchange (import above / export below)',
  'charts.dailyProfile.seriesProduction': 'Production',
  'charts.dailyProfile.seriesConsumption': 'Consumption',
  'charts.dailyProfile.seriesSoc': 'Battery charge',
  'charts.dailyProfile.seriesNetGrid': 'Grid exchange',
  'charts.dailyProfile.import': 'import',
  'charts.dailyProfile.export': 'export',

  'charts.monthlyConsumption.title': 'Monthly real household consumption (import + production − export)',
  'charts.monthlyConsumption.description':
    "Energy imported from the grid alone underestimates actual consumption, since it doesn't include the " +
    'share consumed directly from solar (without touching the grid).',
  'charts.monthlyConsumption.seriesSelfConsumed': 'Directly self-consumed solar energy',
  'charts.monthlyConsumption.seriesGridImport': 'Energy imported from the grid',
  'charts.monthlyConsumption.tooltipLabel': '{{label}} — total {{total}} kWh',

  'charts.monthlyNight.title': 'Monthly average night consumption and starting battery charge',
  'charts.monthlyNight.description':
    "Night spans from a day's last produced interval to the next day's first produced interval.",
  'charts.monthlyNight.seriesConsumption': 'Average night consumption',
  'charts.monthlyNight.seriesStartSoc': 'Average charge at start of night',
  'charts.monthlyNight.tooltipLabel': '{{label}} ({{count}} nights)',

  'charts.daySelector.title': 'Daily schedule (select a day, hourly breakdown)',
  'charts.daySelector.dayLabel': 'Day',
  'charts.daySelector.description':
    'Consumption is always shown below (negative), export and state of charge above (positive). Values ' +
    'within an hour are summed (averaged for state of charge).',
  'charts.daySelector.seriesProduction': 'Current production',
  'charts.daySelector.seriesGridExport': 'Current export',
  'charts.daySelector.seriesGridImport': 'Current grid consumption',
  'charts.daySelector.seriesBatteryDischarge': 'Current consumption from battery',
  'charts.daySelector.seriesTotalConsumption': 'Total consumption',
  'charts.daySelector.seriesSoc': 'Battery state of charge',
  'charts.daySelector.summaryConsumption': 'Total consumption',
  'charts.daySelector.summaryProduction': 'Total production',
  'charts.daySelector.summaryGridImport': 'Total grid import',
  'charts.daySelector.summaryGridExport': 'Total grid export',
  'charts.daySelector.summaryBatteryUsage': 'Total battery usage',
} as const;
