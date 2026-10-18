import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LISTINGS } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";

export const Route = createFileRoute("/cho/$id")({
  loader: ({ params }) => {
    const l = LISTINGS.find((x) => x.id === params.id);
    if (!l) throw notFound();
    return l;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Tin đăng"} — Chợ Xanh Việt` },
      { name: "description", content: loaderData ? `${loaderData.crop} · ${loaderData.quantity} · ${loaderData.province}` : "Chi tiết tin đăng" },
      { property: "og:title", content: loaderData?.title ?? "Tin đăng" },
      { property: "og:description", content: loaderData ? `${loaderData.crop} tại ${loaderData.province}` : "Chi tiết tin đăng" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const l = Route.useLoaderData();
  const rows: [string, string][] = [["Loại nông sản", l.crop], ["Số lượng", l.quantity], ["Giá dự kiến", l.price], ["Địa phương", l.province], ["Ngày đăng", new Date(l.postedAt).toLocaleDateString("vi-VN")]];
  return (
    <Page>
      <Link to="/cho" className="font-semibold text-primary">← Chợ nông sản</Link>
      <SampleNotice>Đây là TIN MẪU, số điện thoại không có thật.</SampleNotice>
      <div className="card flex aspect-video items-center justify-center bg-secondary text-8xl">{l.icon}</div>
      <span className={`chip ${l.type === "ban" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}>{l.type === "ban" ? "Cần bán" : "Cần mua"}</span>
      <h1 className="text-2xl font-bold">{l.title}</h1>
      <dl className="card divide-y">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 p-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
      </dl>
      <p>{l.description}</p>
      <section className="card space-y-2 p-4">
        <h2 className="text-lg font-bold">Liên hệ</h2>
        <p className="font-semibold">{l.contactName}</p>
        <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn-primary w-full">📞 Gọi {l.phone}</a>
        <a href={`https://zalo.me/${l.phone.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline w-full">💬 Nhắn Zalo</a>
      </section>
    </Page>
  );
}
