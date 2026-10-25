import { ArrowUpRight, Clock3, MapPin, Sparkles } from 'lucide-react'
import { cities, cityById, countries, countryById, journeyDays } from '../data/travelAtlas'
import { buildJourneyEntries } from '../data/journeyChronology'
import type { CityId, CountryId, JourneyDay } from '../types/travel'

type TimelineProps = {
  selectedDayId: string
  selectedCountryId?: CountryId
  onSelectCountry: (countryId: CountryId) => void
  onSelectDay: (day: JourneyDay) => void
  onHoverCity: (cityId?: CityId) => void
}

const orderedEntries = buildJourneyEntries(countries, cities, journeyDays)

export function Timeline({ selectedDayId, selectedCountryId, onSelectDay, onSelectCountry, onHoverCity }: TimelineProps) {
  return (
    <section id="stories" className="journey-view-section journey-timeline-section">
      <div className="journey-section-heading">
        <div>
          <p className="journey-kicker">Latest first</p>
          <h2>Journey timeline</h2>
        </div>
        <div className="journey-order-note">
          <Clock3 aria-hidden="true" />
          <span>Newest memories at the top</span>
        </div>
      </div>

      <div className="journey-timeline-rail">
        {orderedEntries.map((entry, index) => {
          const day = entry.kind === 'city' ? entry.day : undefined
          const city = day ? cityById[day.cityId] : undefined
          const country = countryById[entry.countryId]
          const isSelected = day ? day.id === selectedDayId : country.id === selectedCountryId
          const year = entry.date.slice(0, 4)
          const showYear = index === 0 || orderedEntries[index - 1]?.date.slice(0, 4) !== year

          return (
            <article key={entry.id} className="journey-timeline-entry">
              {showYear ? <div className="journey-year-marker">{year}</div> : null}
              <span
                aria-hidden="true"
                className="journey-timeline-node"
                style={{ '--journey-accent': country.accent } as React.CSSProperties}
              />
              <button
                type="button"
                className="journey-timeline-card journey-timeline-card-compact"
                data-selected={isSelected}
                style={{ '--journey-accent': country.accent } as React.CSSProperties}
                onClick={() => day ? onSelectDay(day) : onSelectCountry(country.id)}
                onMouseEnter={() => onHoverCity(day?.cityId)}
                onMouseLeave={() => onHoverCity(undefined)}
              >
                <span className="journey-timeline-date">
                  <span>{entry.date}</span>
                  {import.meta.env.MODE !== 'public' ? <span>{country.flagCode?.toUpperCase()}</span> : country.flagCode ? (
                    <span className="journey-timeline-flag" aria-hidden="true">
                      <img
                        alt=""
                        src={`https://flagcdn.com/w80/${country.flagCode}.png`}
                      />
                    </span>
                  ) : (
                    <span>{country.flag ?? '•'}</span>
                  )}
                </span>

                <span className="journey-timeline-copy">
                  <span className="journey-timeline-place">
                    <MapPin aria-hidden="true" />
                    <strong>{city ? city.nameZh : country.nameEn}</strong>
                    <span>{city ? city.nameEn : country.nameZh}</span>
                  </span>
                  <span className="journey-timeline-country-line">
                    {city ? <><strong>{country.nameZh}</strong><span>{country.nameEn}</span></> : <span>Country-level visit</span>}
                  </span>
                </span>

                <span className="journey-timeline-open" aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </button>
            </article>
          )
        })}
      </div>

      <div className="journey-public-note">
        <Sparkles aria-hidden="true" />
        <span>Public view · travel records are presented as concise memory notes.</span>
      </div>
    </section>
  )
}
