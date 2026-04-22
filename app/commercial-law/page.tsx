export default function CommercialLawPage() {
  const content = [
    { label: '代表責任者', value: '朴施穏' },
    { label: '所在地', value: '〒156-0053 東京都世田谷区桜3-9-24' },
    { label: '電話番号', value: '09012954319' },
    { label: 'メールアドレス', value: 'shionpark06@gmail.com' },
    { label: '販売価格', value: '各プランの購入ページにて表示する価格' },
    { label: '商品代金以外の必要料金', value: 'インターネット接続時の通信料等の通信費用はお客様負担となります。' },
    { label: '代金の支払時期', value: 'クレジットカード決済時（ご利用のカード会社の引き落とし日）' },
    { label: '代金の支払方法', value: 'クレジットカード決済 (Stripe)' },
    { label: '商品の引渡時期', value: '決済完了後、直ちにご利用いただけます。' },
    { label: '返品・不良品・キャンセルについて', value: 'デジタルコンテンツの性質上、返品またはキャンセルはお受けできません。解約はいつでも設定画面より可能で、次回更新日以降の請求が停止されます。' },
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-32 md:pt-40 pb-16 md:pb-24 px-5 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight mb-12 md:mb-16">特定商取引法に基づく表記</h1>

        <div className="space-y-6 md:space-y-8 text-[0.95rem] md:text-lg text-gray-600 leading-relaxed border-t border-black/10 pt-8">
          {content.map((item, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-2 md:gap-8 border-b border-black/5 pb-6 md:pb-8 last:border-0">
              <div className="font-medium text-black">{item.label}</div>
              <div className="whitespace-pre-wrap leading-relaxed">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
