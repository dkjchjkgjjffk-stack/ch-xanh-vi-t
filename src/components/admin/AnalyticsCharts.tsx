type Point = { name: string; value: number };
type Props = { daily: { date: string; views: number }[]; regions: Point[]; pages: Point[]; devices: Point[] };

function Bars({ title, data }: { title: string; data: Point[] }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <section className="card p-4">
    <h2 className="mb-4 text-base font-bold">{title}</h2>
    {data.length ? <div className="space-y-3">{data.slice(0, 8).map((item) => <div key={item.name}>
      <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate">{item.name}</span><strong>{new Intl.NumberFormat("vi-VN").format(item.value)}</strong></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: ((item.value / max) * 100) + "%" }} /></div>
    </div>)}</div> : <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
  </section>;
}

export function AnalyticsCharts({ daily, regions, pages, devices }: Props) {
  const max = Math.max(1, ...daily.map((item) => item.views));
  const points = daily.map((item, index) => (index * 600 / Math.max(1, daily.length - 1)) + "," + (130 - item.views / max * 110)).join(" ");
  return <div className="mb-5 grid gap-4 lg:grid-cols-2">
    <section className="card p-4 lg:col-span-2">
      <h2 className="mb-3 text-base font-bold">Xu hướng lượt xem theo ngày</h2>
      {daily.some((item) => item.views > 0) ? <div className="w-full">
        <svg viewBox="0 0 620 150" role="img" aria-label="Biểu đồ đường lượt xem theo ngày" className="h-48 w-full overflow-visible">
          <line x1="8" y1="130" x2="612" y2="130" stroke="currentColor" opacity=".2" />
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {daily.map((item, index) => <g key={item.date}><circle cx={index * 600 / Math.max(1, daily.length - 1)} cy={130 - item.views / max * 110} r="3.5" fill="currentColor" /><text x={index * 600 / Math.max(1, daily.length - 1)} y="148" fontSize="10" textAnchor="middle" fill="currentColor">{item.date}</text></g>)}
        </svg>
      </div> : <p className="text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng thời gian này.</p>}
    </section>
    <Bars title="Khu vực / thành phố" data={regions} />
    <Bars title="Trang được xem nhiều" data={pages} />
    <Bars title="Thiết bị truy cập" data={devices} />
  </div>;
}
