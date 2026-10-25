import type { City, Country, CountryId, JourneyDay } from '../types/travel.ts'

export type JourneyEntry = {
  id: string
  date: string
  endDate: string
  countryId: CountryId
} & ({ kind: 'city'; day: JourneyDay } | { kind: 'country' })

export type JourneyYearGroup = {
  year: number
  countries: {
    countryId: CountryId
    startDate: string
    endDate: string
    cityIds: string[]
    countryVisits: JourneyEntry[]
  }[]
}

// Keep the supplied precision: a month remains YYYY-MM throughout the views.
const datedVisit = (date: string) => /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(date)

export function buildJourneyEntries(countries: Country[], cities: City[], days: JourneyDay[]): JourneyEntry[] {
  const countryIds = new Set(countries.map((country) => country.id))
  const citiesById = new Map(cities.map((city) => [city.id, city]))
  const entries: JourneyEntry[] = days.flatMap((day) => {
    const city = citiesById.get(day.cityId)
    if (!city || !day.countryId || !countryIds.has(day.countryId) || !datedVisit(day.date)) return []
    const record = city.records?.find((item) => item.id === day.id)
    return [{ kind: 'city', id: day.id, date: day.date,
      endDate: record?.end_date || record?.start_date || day.date,
      countryId: day.countryId, day }]
  })

  for (const country of countries) {
    // Standalone country facts have their own date and never acquire a city record.
    if (country.cityIds.length || country.records?.length || !datedVisit(country.visitedDateRange)) continue
    if (country.visitStatus === 'wishlist') continue
    entries.push({ kind: 'country', id: `country-visit:${country.id}`, countryId: country.id,
      date: country.visitedDateRange, endDate: country.visitedDateRange })
  }
  return entries.sort((left, right) => `${right.date}-${right.id}`.localeCompare(`${left.date}-${left.id}`))
}

export function groupJourneyEntriesByYear(entries: JourneyEntry[]): JourneyYearGroup[] {
  const years = new Map<number, Map<CountryId, JourneyYearGroup['countries'][number]>>()
  for (const entry of [...entries].sort((left, right) => left.date.localeCompare(right.date))) {
    const year = Number(entry.date.slice(0, 4))
    const countries = years.get(year) ?? new Map()
    const group = countries.get(entry.countryId) ?? {
      countryId: entry.countryId, startDate: entry.date, endDate: entry.endDate,
      cityIds: [], countryVisits: [],
    }
    if (entry.date < group.startDate) group.startDate = entry.date
    if (entry.endDate > group.endDate) group.endDate = entry.endDate
    if (entry.kind === 'city') {
      if (!group.cityIds.includes(entry.day.cityId)) group.cityIds.push(entry.day.cityId)
    } else group.countryVisits.push(entry)
    countries.set(entry.countryId, group)
    years.set(year, countries)
  }
  return [...years].map(([year, countries]) => ({ year,
    countries: [...countries.values()].sort((left, right) => left.startDate.localeCompare(right.startDate)),
  })).sort((left, right) => right.year - left.year)
}
