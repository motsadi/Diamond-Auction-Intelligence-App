import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const portfolioContext = `
Current data scope: simulated ODC auction portfolio, not production records.
Portfolio: 500 lots.
Expected sold lots: 448 (89.6% clearance).
Forecast revenue: approximately USD 1.64 million.
Average buyer viewings per lot: 11.8.
Current review queue: 18 reserve exceptions, including 3 high-priority exceptions.
Observed demo signal: interest is strongest for lots above 3 carats.
Priority examples:
- ODC-0421: 3.79 ct, D/VS1, 13 viewings, USD 3,455 reserve, USD 5,230 forecast, 91% sale chance.
- ODC-0438: 4.78 ct, J/VVS2, 16 viewings, USD 4,473 reserve, USD 6,118 forecast, 87% sale chance.
- ODC-0444: 3.19 ct, D/VS1, 23 viewings, USD 3,079 reserve, USD 5,190 forecast, 95% sale chance; requires commercial review because of the large reserve-to-forecast gap.
- ODC-0459: 1.20 ct, D/VVS1, 2 viewings, USD 1,263 reserve, USD 1,529 forecast, 58% sale chance; watch-list due to weak demand.
The forecasting baseline uses lot attributes, viewings, and a market price index. Outputs are decision support and require human approval.
`;

function fallbackAnswer(question: string) {
  const lower = question.toLowerCase();

  if (lower.includes('committee') || lower.includes('brief') || lower.includes('summar')) {
    return `Pricing committee brief

1. Portfolio outlook — The simulated 500-lot portfolio indicates approximately 89.6% clearance and USD 1.64m forecast revenue.
2. Demand — Buyer interest is strongest for lots above 3 ct. ODC-0444 has 23 viewings and a 95% estimated sale chance.
3. Reserve decisions — Review 18 exceptions before approval. ODC-0444 has the largest visible upside to reserve and needs commercial validation rather than an automatic increase.
4. Downside watch — ODC-0459 has only 2 viewings and a 58% sale chance. Consider a conservative reserve or targeted buyer engagement.
5. Governance — Validate model suggestions against current market intelligence and obtain authorised committee sign-off.

Data note: this brief uses simulated portfolio signals and should not be treated as a production valuation.`;
  }

  if (lower.includes('risk') || lower.includes('exception') || lower.includes('review')) {
    return `The immediate risk is concentrated in reserve exceptions rather than the overall portfolio.

• Review ODC-0459 first: 2 viewings and a 58% sale chance indicate weak demand and elevated no-sale risk.
• Validate ODC-0444 commercially: its USD 5,190 forecast is materially above the USD 3,079 reserve. A model gap this large should be checked for grading, data-entry, and buyer-interest effects.
• Do not apply a portfolio-wide reserve uplift. Stronger demand in lots above 3 ct does not imply the same policy for lower-interest categories.
• Keep the 18 exceptions in an auditable approval queue and record the reason for every override.

Data note: these are simulated statistical signals; authorised staff must approve any pricing action.`;
  }

  if (lower.includes('demand') || lower.includes('buyer')) {
    return `Demand is healthy at portfolio level but uneven by lot.

The simulated portfolio averages 11.8 viewings per lot and implies 89.6% clearance. Larger lots above 3 ct show the strongest interest in the current review sample. ODC-0444 is the clearest high-intent example with 23 viewings and a 95% sale chance, while ODC-0459 is the main weak-demand exception with 2 viewings and a 58% sale chance.

Recommended action: prioritise targeted buyer outreach for low-viewing lots, preserve pricing discipline for high-intent lots, and assess demand by comparable grade and size rather than using one portfolio average.

Data note: buyer identities and production bidding histories are not yet included.`;
  }

  return `Based on the simulated portfolio, focus the next decision session on the 18 reserve exceptions.

The overall outlook is positive—approximately 89.6% clearance and USD 1.64m forecast revenue—but the model should be used to rank reviews, not set reserves automatically. Start with ODC-0459 because demand is weak, then validate the unusually large reserve-to-forecast gap on ODC-0444. Record each committee override so the forecasting and reporting modules can learn from actual decisions.

For a more specific answer, ask about reserve risk, demand, priority lots, or a pricing committee brief.

Data note: this response is grounded only in simulated auction signals.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = typeof body?.question === 'string' ? body.question.trim() : '';

    if (!question) {
      return NextResponse.json({ message: 'A question is required.' }, { status: 400 });
    }
    if (question.length > 800) {
      return NextResponse.json({ message: 'Question must be 800 characters or fewer.' }, { status: 400 });
    }

    try {
      const result = await generateText({
        model: 'openai/gpt-5.4-mini',
        system: `You are the Okavango Diamond Company Auction Copilot. Write concise, commercially useful decision support for diamond auction staff moving from Excel-based pricing to an auditable system.

Use only the supplied portfolio context. Never invent buyer identities, market data, valuations, or production results. Distinguish model evidence from commercial judgement. Give concrete actions and always end with a one-sentence data limitation. Do not recommend fully automated pricing or approval.

${portfolioContext}`,
        prompt: question,
      });

      return NextResponse.json({ answer: result.text, mode: 'ai' });
    } catch (error) {
      console.warn('Auction Copilot gateway unavailable; using statistical fallback.', error);
      return NextResponse.json({ answer: fallbackAnswer(question), mode: 'fallback' });
    }
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }
}
