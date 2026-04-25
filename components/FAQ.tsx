// Native <details>/<summary> accordion. Zero JS, accessible, and matches
// the Swiss-tech tone of the rest of the site (thin borders, monochrome,
// notion text tokens). Renders as a server component when imported into
// a server tree; works identically inside client trees.

type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: FaqItem[];
  title?: string;
  eyebrow?: string;
};

export default function FAQ({ items, title = 'Frequently Asked', eyebrow = 'FAQ' }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="bg-[#fcfcfc] border-t border-black/10 px-4 md:px-12 py-16 md:py-24">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
        <div className="lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-black leading-[1.05]">
            {title}
          </h2>
        </div>

        <div className="lg:col-span-8">
          <ul className="border-t border-black/10">
            {items.map((item, i) => (
              <li key={i} className="border-b border-black/10">
                <details className="group">
                  <summary className="flex items-start justify-between gap-6 cursor-pointer list-none py-5 md:py-6 text-left">
                    <span className="text-base md:text-lg font-medium text-black leading-snug">
                      {item.question}
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 w-6 h-6 rounded-full border border-black/15 flex items-center justify-center text-xs text-notion-text-muted transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="pb-6 md:pb-7 -mt-1 pr-10 text-[15px] md:text-base leading-[1.65] text-notion-text-muted">
                    {item.answer}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
