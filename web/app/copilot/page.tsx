'use client';

import { FormEvent, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Copy,
  FileDown,
  Info,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const prompts = [
  'Summarise the key reserve-price risks',
  'Prepare a pricing committee brief',
  'Which lots need commercial review?',
  'Explain the demand outlook in plain language',
];

const welcome = `I can help the auction team interpret the current simulated portfolio.

Ask me to explain reserve exceptions, summarise demand, prepare committee talking points, or turn model outputs into a concise management brief. I will use only the portfolio context shown alongside this conversation.`;

function CopilotContent() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(welcome);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<'introduction' | 'ai' | 'statistical fallback'>('introduction');

  const ask = async (input: string) => {
    const clean = input.trim();
    if (!clean || isLoading) return;
    setQuestion(clean);
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Unable to generate a brief');
      setAnswer(data.answer);
      setSource(data.mode === 'ai' ? 'ai' : 'statistical fallback');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to contact Auction Copilot');
    } finally {
      setIsLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };

  const copyAnswer = async () => {
    await navigator.clipboard.writeText(answer);
    toast.success('Brief copied');
  };

  const downloadAnswer = () => {
    const content = `ODC Auction Copilot Decision Brief\nGenerated: ${new Date().toLocaleString()}\nData: Simulated auction portfolio\n\nQuestion\n${question || 'Introduction'}\n\nResponse\n${answer}\n\nGovernance note\nDecision support only. All pricing and reserve decisions require authorised human review.`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ODC-auction-brief-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Auction Copilot"
      subtitle="Grounded decision support for pricing and auction preparation"
      actions={
        <button type="button" className="btn-secondary" onClick={downloadAnswer}>
          <FileDown className="h-4 w-4" />
          Export brief
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card flex min-h-[650px] flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold">ODC Auction Copilot</h1>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">Beta</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Uses portfolio context and model outputs; it does not change reserves or approve decisions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 px-5 py-6 sm:px-8">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-3xl rounded-2xl rounded-tl-sm bg-slate-100 px-5 py-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reviewing auction signals…
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-sm leading-7 text-slate-700">{answer}</div>
                )}
                {!isLoading && source !== 'introduction' ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {source === 'ai' ? 'AI-generated' : 'Statistical fallback'}
                    </span>
                    <span>·</span>
                    <span>Grounded in simulated portfolio</span>
                    <button type="button" onClick={copyAnswer} className="ml-auto inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-950">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested questions</div>
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void ask(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <label htmlFor="copilot-question" className="sr-only">Ask Auction Copilot</label>
            <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10">
              <textarea
                id="copilot-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void ask(question);
                  }
                }}
                rows={2}
                maxLength={800}
                placeholder="Ask about reserves, demand, risk, or the committee brief…"
                className="min-h-[48px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button type="submit" disabled={!question.trim() || isLoading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send question">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="h-3 w-3" />
              Check outputs against source data and commercial judgement before use.
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="section-title">Context available</h2>
            <p className="section-subtitle">The assistant is intentionally limited to these approved signals.</p>
            <div className="mt-5 space-y-3">
              {[
                ['Portfolio', '500 simulated lots'],
                ['Forecast revenue', '$1.64m'],
                ['Expected clearance', '89.6%'],
                ['Reserve exceptions', '18 lots'],
                ['Demand signal', '11.8 avg. viewings'],
                ['Model status', 'Demo baseline'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-blue-950">
              <ShieldCheck className="h-4 w-4" />
              Responsible use
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-blue-900/80">
              <li>• Recommendations are advisory, never automatic.</li>
              <li>• Every answer states the data scope used.</li>
              <li>• Pricing approval remains with authorised staff.</li>
              <li>• Production should add ODC market and buyer data.</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default function CopilotPage() {
  return (
    <ProtectedRoute>
      <CopilotContent />
    </ProtectedRoute>
  );
}
