import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction, predictPrice, predictSaleProba, recommendedReserve, priceMetrics, accuracy } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID } from '@/lib/staticDataset';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) {
      return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });
    }
    if (datasetId !== STATIC_DATASET_ID) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Only the built-in synthetic dataset is available in this deployment. Set NEXT_PUBLIC_API_URL to use an external API for uploaded datasets.',
        },
        { status: 400 }
      );
    }

    const trained = await loadTrainedSyntheticAuction();

    const yTrue = trained.rows.map((r) => r.final_price);
    const soldTrue = trained.rows.map((r) => r.sold);

    const preds = trained.rows.map((r) => {
      const pred_price = predictPrice(trained.priceModel, {
        carat: r.carat,
        viewings: r.viewings,
        price_index: r.price_index,
        color: r.color,
        clarity: r.clarity,
      });
      const pred_sale_proba = predictSaleProba(trained.saleModel, {
        carat: r.carat,
        viewings: r.viewings,
        price_index: r.price_index,
        color: r.color,
        clarity: r.clarity,
      });
      const recommended_reserve = recommendedReserve(pred_price, pred_sale_proba);

      return {
        lot_id: r.lot_id,
        carat: r.carat,
        color: r.color,
        clarity: r.clarity,
        viewings: r.viewings,
        price_index: r.price_index,
        reserve_price: r.reserve_price,
        final_price: r.final_price,
        sold: r.sold,
        pred_price,
        pred_sale_proba,
        recommended_reserve,
      };
    });

    const metricsPrice = priceMetrics(yTrue, preds.map((p) => p.pred_price));
    const saleAcc = accuracy(soldTrue, preds.map((p) => p.pred_sale_proba));

    const previewRows = preds.slice(0, 10).map((p) => ({
      lot_id: p.lot_id,
      pred_price: p.pred_price,
      pred_sale_proba: p.pred_sale_proba,
      recommended_reserve: p.recommended_reserve,
      actual_final_price: p.final_price,
      actual_sold: p.sold,
    }));

    const csvHeader = [
      'lot_id',
      'carat',
      'color',
      'clarity',
      'viewings',
      'price_index',
      'pred_price',
      'pred_sale_proba',
      'recommended_reserve',
      'actual_final_price',
      'actual_sold',
    ];
    const csvLines = [csvHeader.join(',')];
    for (const p of preds) {
      csvLines.push(
        [
          p.lot_id,
          p.carat,
          p.color,
          p.clarity,
          p.viewings,
          p.price_index,
          p.pred_price,
          p.pred_sale_proba,
          p.recommended_reserve,
          p.final_price,
          p.sold,
        ].join(',')
      );
    }
    const csv = csvLines.join('\n');
    const outputCsvData = Buffer.from(csv, 'utf8').toString('base64');

    return NextResponse.json({
      success: true,
      predictionId: `synthetic-${Date.now()}`,
      metrics: {
        price_r2: metricsPrice.r2,
        price_mae: metricsPrice.mae,
        sale_accuracy: saleAcc,
      },
      previewRows,
      outputCsvData,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Predict failed' }, { status: 500 });
  }
}


