/**
 * Community Post — UI / Presentation (Revamped)
 * Apple iOS colors, Playfair Display headings, proper English.
 * Matches Home + Fund A design language.
 * Logic stays in post-logic.ts — zero data here.
 */
import { useNavigate } from "react-router-dom";
import { useCommunityPostLogic } from "./post-logic";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../components/hushh-tech-cta/HushhTechCta";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";

/* ── Playfair heading style ── */
const playfair = { fontFamily: "'Playfair Display', serif" };

export default function CommunityPostPage() {
  const navigate = useNavigate();
  const { post, loading, handleBack } = useCommunityPostLogic();

  /* loading state */
  if (loading) {
    return (
      <div
        className="bg-white min-h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-8 h-8 border-2 border-gray-200 border-t-hushh-blue rounded-full animate-spin"
          aria-hidden="true"
        />
        <span className="sr-only">Loading community article</span>
      </div>
    );
  }

  if (!post) return null;

  const PostComponent = post.Component;

  /* ── PDF Post ── */
  if (post.pdfUrl) {
    return (
      <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
        {/* Header */}
        <HushhTechBackHeader
          onBackClick={handleBack}
          rightType="hamburger"
        />

        {/* Desktop: Full-screen iframe */}
        <div className="hidden md:block flex-1">
          <iframe
            src={`${post.pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-[calc(100vh-64px)] border-none"
            title={post.title}
          />
        </div>

        {/* Mobile: Clean card with open/download */}
        <main className="md:hidden px-6 flex-grow max-w-md mx-auto w-full pb-32">
          <section className="pt-8">
            {/* PDF icon */}
            <div className="w-16 h-16 rounded-2xl bg-hushh-blue/5 border border-hushh-blue/20 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-hushh-blue !text-[1.8rem]">
                description
              </span>
            </div>

            {/* title */}
            <h1
              className="text-[2rem] leading-[1.2] font-normal text-black tracking-tight font-serif mb-3"
              style={playfair}
            >
              {post.title}
            </h1>
            <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-10">
              Tap below to view the full PDF document in your browser.
            </p>

            {/* CTAs */}
            <div className="space-y-3">
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={() => window.open(post.pdfUrl, "_blank")}
              >
                Open PDF Document
                <span className="material-symbols-outlined !text-[1.1rem]">
                  open_in_new
                </span>
              </HushhTechCta>

              <a href={post.pdfUrl} download className="block">
                <HushhTechCta variant={HushhTechCtaVariant.WHITE}>
                  Download PDF
                  <span className="material-symbols-outlined !text-[1.1rem]">
                    download
                  </span>
                </HushhTechCta>
              </a>
            </div>
          </section>
        </main>

        {/* Footer Nav */}
        <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
      </div>
    );
  }

  /* ── Regular Post (React component) ── */
  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
      {/* Header */}
      <HushhTechBackHeader
        onBackClick={handleBack}
        rightType="hamburger"
      />

      {/* Post content */}
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-8 py-6 md:py-10 pb-32">
        <PostComponent />
      </main>

      {/* Footer Nav */}
      <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
    </div>
  );
}
