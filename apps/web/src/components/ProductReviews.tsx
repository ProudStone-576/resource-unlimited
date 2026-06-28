'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { RatingSummary, DisplayReview } from '@/lib/catalog';
import { StarRating } from './StarRating';

// ─────────────────────────────────────────────────────────────────────────────
// Product reviews: summary + distribution bars + review cards + submit form.
// Displayed reviews are placeholders (see lib/catalog.ts TODO); submitted
// reviews are real — they go through the contact API into the sales inbox
// for moderation until a Review model exists.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  sku: string;
  productName: string;
  accent: string;
  rating: RatingSummary;
  reviews: DisplayReview[];
}

function ReviewForm({ sku, productName, accent, onDone }: {
  sku: string; productName: string; accent: string; onDone: () => void;
}) {
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    try {
      await api.createContact({
        name,
        email,
        subject: `Product review (${stars}★): ${productName} [${sku}]`,
        message: `Rating: ${stars}/5\nTitle: ${title}\n\n${body}`,
        source: 'product-review',
      });
      setState('done');
      setTimeout(onDone, 2500);
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="rounded-2xl border-2 border-[#10B981] bg-[#10B981]/10 p-6 text-center">
        <p className="font-display text-lg font-black text-[#1A1A2E]">Thank you! 🎉</p>
        <p className="mt-1 text-sm text-[#1A1A2E]/65">
          Your review was submitted and will appear after moderation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* star picker */}
      <div>
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A2E]/55">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className="text-2xl transition-transform hover:scale-125"
              style={{ color: n <= (hover || stars) ? accent : 'rgba(26,26,46,0.18)' }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-11 rounded-xl border-2 border-[#1A1A2E]/20 bg-white px-3 text-sm text-[#1A1A2E] outline-none transition-colors focus:border-[#1A1A2E]"
        />
        <input
          required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (not published)"
          className="h-11 rounded-xl border-2 border-[#1A1A2E]/20 bg-white px-3 text-sm text-[#1A1A2E] outline-none transition-colors focus:border-[#1A1A2E]"
        />
      </div>
      <input
        required value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Review headline (e.g. “Exactly like the proof”)"
        className="h-11 w-full rounded-xl border-2 border-[#1A1A2E]/20 bg-white px-3 text-sm text-[#1A1A2E] outline-none transition-colors focus:border-[#1A1A2E]"
      />
      <textarea
        required value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="What did you order? How was the print quality, delivery, support?"
        rows={4}
        className="w-full rounded-xl border-2 border-[#1A1A2E]/20 bg-white px-3 py-2.5 text-sm text-[#1A1A2E] outline-none transition-colors focus:border-[#1A1A2E]"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === 'busy'}
          className="rounded-full border-2 border-[#1A1A2E] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E] disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {state === 'busy' ? 'Submitting…' : 'Submit review'}
        </button>
        {state === 'error' && (
          <p className="text-xs font-bold text-[#EC008C]">Could not submit — try again.</p>
        )}
      </div>
      <p className="text-[10px] text-[#1A1A2E]/40">
        Reviews are moderated before publishing. We never publish your email address.
      </p>
    </form>
  );
}

export function ProductReviews({ sku, productName, accent, rating, reviews }: Props) {
  const [writing, setWriting] = useState(false);

  return (
    <section id="reviews" className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-6 xl:px-8">
        <div className="mb-8">
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#EC008C]">
            Customer reviews
          </p>
          <h2 className="font-display text-3xl font-black text-[#1A1A2E]">
            What buyers say
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">

          {/* ── Summary panel ─────────────────────────────────────── */}
          <div className="sticker-flat h-fit p-6">
            <div className="flex items-end gap-3">
              <span className="font-display text-5xl font-black text-[#1A1A2E]">{rating.avg}</span>
              <div className="pb-1.5">
                <StarRating value={rating.avg} size={16} color={accent} />
                <p className="mt-0.5 text-[11px] text-[#1A1A2E]/55">{rating.count} ratings</p>
              </div>
            </div>

            {/* distribution bars */}
            <div className="mt-5 space-y-2">
              {rating.dist.map((pct, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-7 text-[11px] font-bold text-[#1A1A2E]/60">{5 - i}★</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full border border-[#1A1A2E]/15 bg-[#1A1A2E]/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  </div>
                  <span className="w-9 text-right text-[11px] tabular-nums text-[#1A1A2E]/50">{pct}%</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWriting((w) => !w)}
              className="mt-6 w-full rounded-full border-2 border-[#1A1A2E] bg-[#FFD200] py-2.5 text-[11px] font-black uppercase tracking-widest text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
            >
              {writing ? 'Close form' : '✍️ Write a review'}
            </button>
            <p className="mt-3 text-center text-[10px] text-[#1A1A2E]/45">
              Ordered this product? Your feedback helps other buyers.
            </p>
          </div>

          {/* ── Review list + form ────────────────────────────────── */}
          <div className="space-y-4">
            {writing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticker-flat p-6"
                style={{ borderTop: `6px solid ${accent}` }}
              >
                <h3 className="mb-4 font-display text-lg font-black text-[#1A1A2E]">
                  Review “{productName}”
                </h3>
                <ReviewForm sku={sku} productName={productName} accent={accent} onDone={() => setWriting(false)} />
              </motion.div>
            )}

            {reviews.map((r, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="sticker-flat p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#1A1A2E] font-display text-sm font-black text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {r.author.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-black text-[#1A1A2E]">{r.author}</p>
                    <p className="text-[10px] text-[#1A1A2E]/45">{r.location} · {r.date}</p>
                  </div>
                  {r.verified && (
                    <span className="ml-auto rounded-full border-2 border-[#10B981] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#10B981]">
                      ✓ Verified buyer
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <StarRating value={r.rating} color={accent} />
                  <h4 className="font-display text-sm font-black text-[#1A1A2E]">{r.title}</h4>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#1A1A2E]/65">{r.body}</p>

                <p className="mt-3 text-[10px] font-semibold text-[#1A1A2E]/40">
                  {r.helpful} people found this helpful
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
