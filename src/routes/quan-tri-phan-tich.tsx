import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";

type EventRow = {
  id: number; visitor_id: string; session_id: string; event_type: string;
  page_path: string; page_title: string | null; referrer_host: string | null;
  device_type: string; browser: string; operating_system: string;
  screen_width: number | null; screen_height: number | null;
  language: string | null; timezone: string | null; country_code: string | null; country_name: string | null; region: string | null; city: string | null; event_label: string | null; created_at: string;
};
const deviceNames: Record<string,string> = {mobile:"Điện thoại",tablet:"Máy tính bảng",desktop:"Máy tính",unknown:"Khác"};
const fmt = (n:number) => new Intl.NumberFormat("vi-VN").format(n);
const pct = (n:number,total:number) => total ? Math.round(n*100/total)+"%" : "0%";

export const Route = createFileRoute("/quan-tri-phan-tich")({
  head: () => ({ meta: [{ title: "Phân tích truy cập — Hải Tây Phát" }] }),
  component: AnalyticsAdmin,
});
function AnalyticsAdmin() {
  const [checking,setChecking] = useState(true);
  const [authorized,setAuthorized] = useState(false);
  const [events,setEvents] = useState<EventRow[]>([]);
  const [period,setPeriod] = useState("7");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const since = new Date(Date.now() - Number(period)*86400000).toISOString();
      const {data,error:queryError} = await supabase.from("website_analytics_events").select("*").gte("created_at",since).order("created_at",{ascending:false}).limit(10000);
      if(queryError) throw queryError;
      setEvents((data ?? []) as EventRow[]);
    } catch(e) { setError(e instanceof Error ? e.message : "Không tải được dữ liệu."); }
    finally { setLoading(false); }
  },[period]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const {data,error:authError} = await supabase.auth.getUser();
        if(authError || !data.user) return;
        const {data:isAdmin,error:roleError} = await supabase.rpc("has_role",{_user_id:data.user.id,_role:"admin"});
        if(roleError) throw roleError;
        if(!active) return;
        setAuthorized(Boolean(isAdmin));
        if(isAdmin) await load();
      } catch(e) { if(active) setError(e instanceof Error ? e.message : "Không kiểm tra được quyền."); }
      finally { if(active) setChecking(false); }
    })();
    return () => {active=false;};
  },[load]);
  const views = useMemo(()=>events.filter(e=>e.event_type==="page_view"),[events]);
  const visitors = useMemo(()=>new Set(views.map(e=>e.visitor_id)).size,[views]);
  const sessions = useMemo(()=>new Set(views.map(e=>e.session_id)).size,[views]);
  const devices = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{a[e.device_type]=(a[e.device_type]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]),[views]);
  const browsers = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{a[e.browser]=(a[e.browser]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]),[views]);
  const systems = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{a[e.operating_system]=(a[e.operating_system]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]),[views]);
  const pages = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{a[e.page_path]=(a[e.page_path]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,12),[views]);
  const sources = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{const k=e.referrer_host||"Truy cập trực tiếp / không rõ";a[k]=(a[k]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,10),[views]);
  const regions = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{const k=[e.city,e.region,e.country_name].filter(Boolean).join(", ")||"Chưa xác định";a[k]=(a[k]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,20),[views]);
  const countries = useMemo(()=>Object.entries(views.reduce<Record<string,number>>((a,e)=>{const k=e.country_name||"Chưa xác định";a[k]=(a[k]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,10),[views]);
  const clicks = useMemo(()=>events.filter(e=>e.event_type==="click").slice(0,30),[events]);
  const exportCsv = () => {
    const rows=[["Thời gian","Loại sự kiện","Trang","Thiết bị","Trình duyệt","Hệ điều hành","Quốc gia","Tỉnh/tiểu bang","Thành phố","Nguồn","Nhãn bấm"],...events.map(e=>[new Date(e.created_at).toLocaleString("vi-VN"),e.event_type,e.page_path,deviceNames[e.device_type]||e.device_type,e.browser,e.operating_system,e.country_name||"",e.region||"",e.city||"",e.referrer_host||"",e.event_label||""])];
    const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    const a=document.createElement("a");a.href=url;a.download="hai-tay-phat-analytics.csv";a.click();URL.revokeObjectURL(url);
  };
  return <Page title="Phân tích khách truy cập">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Thiết bị, hệ điều hành, trình duyệt, trang được xem và lượt bấm của khách vãng lai.</p><p className="mt-1 text-xs text-muted-foreground">Không thu thập tên, số điện thoại hay nội dung nhập biểu mẫu. Vị trí được ước lượng từ IP qua Cloudflare; có thể sai khi dùng VPN hoặc mạng di động.</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/quan-tri" className="btn-outline">Quản trị</Link><button className="btn-outline" onClick={()=>void load()} disabled={loading}>{loading?"Đang tải…":"Làm mới"}</button><button className="btn-primary" onClick={exportCsv} disabled={!events.length}>Xuất CSV</button></div>
    </div>
    {checking ? <div className="card p-5">Đang kiểm tra quyền quản trị…</div> : !authorized ? <section className="card space-y-3 p-5"><h2 className="font-bold">Không có quyền truy cập</h2><p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản được cấp quyền admin để xem số liệu.</p><Link to="/tai-khoan" className="btn-primary">Đăng nhập</Link></section> : <>
      {error && <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2"><label htmlFor="analytics-period" className="text-sm font-medium">Khoảng thời gian</label><select id="analytics-period" className="field w-auto" value={period} onChange={e=>setPeriod(e.target.value)}><option value="1">24 giờ</option><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="90">90 ngày</option></select></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><p className="text-sm text-muted-foreground">Lượt xem trang</p><p className="mt-1 text-2xl font-bold">{fmt(views.length)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted-foreground">Khách riêng biệt*</p><p className="mt-1 text-2xl font-bold">{fmt(visitors)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted-foreground">Phiên truy cập</p><p className="mt-1 text-2xl font-bold">{fmt(sessions)}</p></div>
        <div className="card p-4"><p className="text-sm text-muted-foreground">Lượt bấm ghi nhận</p><p className="mt-1 text-2xl font-bold">{fmt(events.filter(e=>e.event_type==="click").length)}</p></div>
      </div>
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Panel title="Thiết bị" rows={devices.map(([k,n])=>[deviceNames[k]||k,n,pct(n,views.length)])}/>
        <Panel title="Trình duyệt" rows={browsers.map(([k,n])=>[k,n,pct(n,views.length)])}/>
        <Panel title="Hệ điều hành" rows={systems.map(([k,n])=>[k,n,pct(n,views.length)])}/>
        <Panel title="Trang được xem nhiều" rows={pages.map(([k,n])=>[k,n,pct(n,views.length)])}/>
        <Panel title="Khu vực / thành phố" rows={regions.map(([k,n])=>[k,n,pct(n,views.length)])}/>
        <Panel title="Quốc gia" rows={countries.map(([k,n])=>[k,n,pct(n,views.length)])}/>
        <Panel title="Nguồn truy cập" rows={sources.map(([k,n])=>[k,n,pct(n,views.length)])}/>
        <Panel title="Độ phân giải màn hình" rows={Object.entries(views.reduce<Record<string,number>>((a,e)=>{const k=e.screen_width&&e.screen_height?`${e.screen_width}×${e.screen_height}`:"Không rõ";a[k]=(a[k]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>[k,n,pct(n,views.length)])}/>
      </div>
      <section className="card mb-5 p-4"><h2 className="mb-3 text-lg font-bold">Lượt bấm gần đây</h2>{clicks.length? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Thời gian</th><th className="p-2">Trang</th><th className="p-2">Nội dung bấm</th><th className="p-2">Thiết bị</th></tr></thead><tbody>{clicks.map(e=><tr key={e.id} className="border-t border-border"><td className="p-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString("vi-VN")}</td><td className="p-2">{e.page_path}</td><td className="p-2">{e.event_label}</td><td className="p-2">{deviceNames[e.device_type]||e.device_type}</td></tr>)}</tbody></table></div>:<p className="text-sm text-muted-foreground">Chưa có lượt bấm nào được ghi nhận.</p>}</section>
      <p className="text-xs text-muted-foreground">* Một khách được nhận diện bằng mã ngẫu nhiên trên trình duyệt; xóa dữ liệu trình duyệt hoặc dùng thiết bị khác có thể tạo mã mới. Vị trí chỉ là ước lượng theo IP, không phải GPS hay địa chỉ nhà. Dữ liệu chỉ có từ khi chức năng được triển khai.</p>
    </>}
  </Page>;
}
function Panel({title,rows}:{title:string;rows:(string|number)[][]}) {
 return <section className="card p-4"><h2 className="mb-3 text-base font-bold">{title}</h2>{rows.length?<div className="space-y-3">{rows.map((r,i)=><div key={String(r[0])} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 break-words">{r[0]}</span><span className="shrink-0 text-right font-semibold">{fmt(Number(r[1]))} <span className="text-muted-foreground font-normal">({r[2]})</span></span></div>)}</div>:<p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}</section>;
}
