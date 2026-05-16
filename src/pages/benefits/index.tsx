import React from "react";
import { Check } from "lucide-react";

/** Matches `src/pages/home/ui.tsx` hero `h1` */
const playfair = { fontFamily: "'Playfair Display', serif" };
const featureRowClassName = "flex items-start gap-3.5";
const featureIconClassName = "mt-[3px] h-5 w-5 shrink-0 text-hushh-blue";

const BenefitsPage: React.FC = () => {
  return (
    <div
      data-page="benefits"
      className="bg-white antialiased text-gray-900 selection:bg-hushh-blue selection:text-white"
    >
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:px-8">
        {/* Hero — compact; same copy as before */}
        <header className="mx-auto max-w-3xl py-6 text-center sm:py-8 md:py-10">
          <h1
            className="mb-3 text-[2.75rem] font-normal leading-[1.1] tracking-tight text-black font-serif sm:text-[3.25rem] lg:text-[4rem]"
            style={playfair}
          >
            World-Class Benefits <br /> for World-Class{" "}
            <span className="text-gray-400 italic font-light">Talent</span>
          </h1>
          <p className="mx-auto max-w-3xl text-sm font-light leading-relaxed text-gray-500 sm:text-base">
            We believe that exceptional people deserve exceptional benefits. Our comprehensive package is
            designed to support your professional growth, personal wellbeing, and financial future.
          </p>
        </header>

        <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
          {/* Compensation & Investment Opportunities */}
          <section className="rounded-2xl border border-gray-200/60 bg-ios-gray-bg p-5 transition-colors hover:border-hushh-blue/30 sm:p-6">
            <div className="mb-4 flex flex-col items-center gap-2 text-center sm:mb-5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:text-left">
              <span className="text-2xl sm:text-3xl" aria-hidden>
                💰
              </span>
              <h2
                className="text-2xl font-medium tracking-tight text-black sm:text-3xl"
                style={playfair}
              >
                Compensation & Investment Opportunities
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 md:gap-y-3">
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Competitive base salaries benchmarked to top-tier firms
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Access to proprietary investment strategies
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Performance-based bonuses tied to individual and company success
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  401(k) with generous company matching
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Equity participation in company growth
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Financial planning and investment advisory services
                </p>
              </li>
            </ul>
          </section>

          {/* Health, Wellness & Family Support */}
          <section className="rounded-2xl border border-gray-200/60 bg-ios-gray-bg p-5 transition-colors hover:border-hushh-blue/30 sm:p-6">
            <div className="mb-4 flex flex-col items-center gap-2 text-center sm:mb-5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:text-left">
              <span className="text-2xl sm:text-3xl" aria-hidden>
                🏥
              </span>
              <h2
                className="text-2xl font-medium tracking-tight text-black sm:text-3xl"
                style={playfair}
              >
                Health, Wellness & Family Support
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 md:gap-y-3">
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Premium health, dental, and vision insurance (100% company paid)
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Generous parental leave policies
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Mental health and wellness programs
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Childcare assistance and family support services
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  On-site fitness facilities and wellness stipend
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Comprehensive life and disability insurance
                </p>
              </li>
            </ul>
          </section>

          {/* Work-Life, Growth & Giving Back */}
          <section className="rounded-2xl border border-gray-200/60 bg-ios-gray-bg p-5 transition-colors hover:border-hushh-blue/30 sm:p-6">
            <div className="mb-4 flex flex-col items-center gap-2 text-center sm:mb-5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:text-left">
              <span className="text-2xl sm:text-3xl" aria-hidden>
                🌱
              </span>
              <h2
                className="text-2xl font-medium tracking-tight text-black sm:text-3xl"
                style={playfair}
              >
                Work-Life, Growth & Giving Back
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 md:gap-y-3">
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Flexible work arrangements and remote work options
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Conference attendance and continuing education support
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Unlimited PTO policy with minimum usage requirements
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Internal mentorship and leadership development programs
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Sabbatical opportunities for long-term employees
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Charitable giving matching program
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Professional development budget ($10,000+ annually)
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Volunteer time off for community service
                </p>
              </li>
            </ul>
          </section>

          {/* Perks, Culture & Quality of Life */}
          <section className="rounded-2xl border border-gray-200/60 bg-ios-gray-bg p-5 transition-colors hover:border-hushh-blue/30 sm:p-6">
            <div className="mb-4 flex flex-col items-center gap-2 text-center sm:mb-5 sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:text-left">
              <span className="text-2xl sm:text-3xl" aria-hidden>
                🎯
              </span>
              <h2
                className="text-2xl font-medium tracking-tight text-black sm:text-3xl"
                style={playfair}
              >
                Perks, Culture & Quality of Life
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2 md:gap-y-3">
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  State-of-the-art office spaces with premium amenities
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Team events, retreats, and cultural activities
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Catered meals and premium coffee/snacks
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Innovation time for personal projects
                </p>
              </li>
            </ul>
          </section>

          {/* Why Join Hushh Technologies? — home-style CTA card + primary black button */}
          <section className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200/60 bg-ios-gray-bg p-6 text-center transition-colors hover:border-hushh-blue/30 sm:p-8">
            <h2
              className="mb-3 text-xl font-medium tracking-tight text-black sm:mb-4 sm:text-3xl md:text-4xl"
              style={playfair}
            >
              Why Join Hushh Technologies?
            </h2>
            <p className="mb-6 text-sm font-light leading-relaxed text-gray-500 sm:mb-8 sm:text-base md:text-lg">
              At Hushh Technologies, you'll be part of a team that's revolutionizing the investment industry
              through cutting-edge AI and quantitative methods. You'll work alongside brilliant minds, solve
              complex challenges, and directly impact the future of finance while enjoying unparalleled benefits
              and growth opportunities.
            </p>
            <a
              href="/career"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-black bg-black px-6 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-200 ease-out hover:-translate-y-px hover:bg-black/90 hover:shadow-xl active:translate-y-0 active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
            >
              View Open Positions
            </a>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BenefitsPage;
