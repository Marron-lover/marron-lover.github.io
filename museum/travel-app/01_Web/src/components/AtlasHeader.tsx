export type AtlasPage = 'map' | 'journey' | 'about'

type AtlasHeaderProps = {
  activePage: AtlasPage
  onPageChange: (page: AtlasPage) => void
}

const navItems: { id: AtlasPage; label: string }[] = [
  { id: 'map', label: 'Map' },
  { id: 'journey', label: 'Journey' },
]

export function AtlasHeader({ activePage, onPageChange }: AtlasHeaderProps) {
  const museum = import.meta.env.MODE !== 'public'
  const local = import.meta.env.DEV && import.meta.env.MODE === 'personal'
  const preview = import.meta.env.VITE_GALLERY_PREVIEW === 'true'
  return (
    <header
      className="atlas-app-header cesium-lab-title hero-glass-layer absolute left-[50vw] top-4 z-50 w-[min(760px,calc(100vw-32px))] -translate-x-1/2 px-6 py-4 text-center sm:px-8"
      data-page="map"
      data-active-page={activePage}
    >
      <div><h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
        {import.meta.env.VITE_GALLERY_FIXTURE === 'true' ? 'Local publication test' : museum ? 'The World Cabinet' : 'StarMap'}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white sm:text-base">
        {museum ? 'Places, memories, and the things they leave behind.' : 'Map the places you have visited and turn every journey into a story you can revisit.'}
      </p>
      {museum && <div className="gallery-map-links"><a href={local ? 'https://marron-lover.github.io/exhibit/world-cabinet/' : '/exhibit/world-cabinet/'}>← Back to Gallery</a>{local && <a href="/__travelatlas/review">Review & export</a>}{preview && <a href="/__travelatlas/review">Back to review</a>}<a href="?view=list">List view</a></div>}</div>
      <nav
        className="atlas-tabs mx-auto mt-4 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/50 p-1 text-sm font-medium text-slate-500 shadow-sm backdrop-blur-xl"
        aria-label="Primary navigation"
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPageChange(item.id)}
            aria-current={activePage === item.id ? 'page' : undefined}
            className={`rounded-full px-4 py-2 transition ${
              activePage === item.id
                ? 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]'
                : 'hover:bg-white/70 hover:text-slate-950'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {import.meta.env.VITE_GALLERY_FIXTURE==='true' && <p className="gallery-fixture-banner" role="status">Local test: synthetic visit and sculpture images. Excluded from publication.</p>}
    </header>
  )
}
