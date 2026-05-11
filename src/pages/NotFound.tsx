import { Link } from 'react-router-dom';
import hushhLogo from '../components/images/Hushhogo.png';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Fund A', to: '/discover-fund-a' },
  { label: 'Community', to: '/community' },
  { label: 'Contact', to: '/contact' },
];

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(38,124,255,0.26),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-center">
          <section className="max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <img
                src={hushhLogo}
                alt="Hushh"
                className="h-8 w-8 rounded-lg object-contain"
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">hushh</p>
                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-white/55">
                  Technologies
                </p>
              </div>
            </div>

            <p className="mt-8 text-xs font-medium uppercase tracking-[0.3em] text-hushh-blue">
              Error 404
            </p>
            <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Page not found.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
              The page you requested does not exist, may have moved, or is no
              longer publicly available.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
              >
                <span>Back to Home</span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                <span>Contact Hushh</span>
                <span className="material-symbols-outlined text-base">
                  support_agent
                </span>
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/40 p-6">
              <p className="text-[5rem] font-semibold leading-none tracking-[-0.08em] text-white/12 sm:text-[7rem]">
                404
              </p>
              <div className="mt-6 space-y-4">
                <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                  Quick links
                </p>
                <div className="grid gap-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 transition hover:border-hushh-blue/50 hover:bg-hushh-blue/10 hover:text-white"
                    >
                      <span>{link.label}</span>
                      <span className="material-symbols-outlined text-base">
                        north_east
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
