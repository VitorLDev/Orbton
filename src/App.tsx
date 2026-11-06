import { useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardCheck, Clock3, Command, Cpu, Download, Ellipsis,
  FileBarChart, Filter, Gauge, LayoutDashboard, LifeBuoy, Menu, MoreHorizontal,
  Package, Plus, Search, Settings2, ShieldAlert, Sparkles, TrendingUp,
  Wrench, X, Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

type ServiceOrder = {
  id: string;
  title: string;
  asset: string;
  category: string;
  priority: "Crítica" | "Alta" | "Média" | "Baixa";
  status: "Em andamento" | "Aberta" | "Aguardando peças" | "Concluída";
  assigned: string;
  initials: string;
  due: string;
  color: string;
};

type Equipment = {
  name: string;
  code: string;
  sector: string;
  status: string;
  health: number;
  icon: string;
};

const initialOrders: ServiceOrder[] = [
  { id: "OS-2481", title: "Vibração no eixo do motor", asset: "Compressor Atlas Copco", category: "Mecânica", priority: "Crítica", status: "Em andamento", assigned: "Rafael Mendes", initials: "RM", due: "Hoje, 14:30", color: "blue" },
  { id: "OS-2480", title: "Troca de filtro de ar", asset: "Chiller Trane CVHF", category: "Preventiva", priority: "Média", status: "Aberta", assigned: "Ana Costa", initials: "AC", due: "Hoje, 16:00", color: "purple" },
  { id: "OS-2479", title: "Inspeção do sistema elétrico", asset: "Gerador Cummins 500 kVA", category: "Elétrica", priority: "Alta", status: "Aguardando peças", assigned: "Bruno Alves", initials: "BA", due: "Amanhã, 09:00", color: "orange" },
  { id: "OS-2478", title: "Calibração de sensores", asset: "Bomba Grundfos CR 32", category: "Instrumentação", priority: "Baixa", status: "Concluída", assigned: "Camila Rocha", initials: "CR", due: "05 nov, 11:45", color: "green" },
];

const initialAssets: Equipment[] = [
  { name: "Compressor Atlas Copco", code: "CMP-001", sector: "Utilidades", status: "Em manutenção", health: 42, icon: "◉" },
  { name: "Gerador Cummins 500 kVA", code: "GER-003", sector: "Energia", status: "Operacional", health: 78, icon: "ϟ" },
  { name: "Chiller Trane CVHF", code: "CHI-002", sector: "Climatização", status: "Operacional", health: 91, icon: "❄" },
  { name: "Bomba Grundfos CR 32", code: "BOM-014", sector: "Utilidades", status: "Operacional", health: 64, icon: "◌" },
  { name: "Nobreak APC Smart-UPS", code: "UPS-007", sector: "Data center", status: "Operacional", health: 86, icon: "⏚" },
];

const chartData = [
  { month: "Jun", cost: 42800, previous: 48900 },
  { month: "Jul", cost: 36200, previous: 40500 },
  { month: "Ago", cost: 51400, previous: 46700 },
  { month: "Set", cost: 39300, previous: 44600 },
  { month: "Out", cost: 32100, previous: 38900 },
  { month: "Nov", cost: 28450, previous: 35200 },
];

const distribution = [
  { name: "Preventiva", value: 62, color: "#6c7af6" },
  { name: "Corretiva", value: 25, color: "#f49a5b" },
  { name: "Inspeção", value: 13, color: "#35c6a0" },
];

const navGroups: { label?: string; items: { name: string; icon: LucideIcon; badge?: string }[] }[] = [
  { items: [{ name: "Visão geral", icon: LayoutDashboard }] },
  { label: "GESTÃO", items: [
    { name: "Equipamentos", icon: Cpu },
    { name: "Ordens de serviço", icon: ClipboardCheck, badge: "12" },
    { name: "Planos preventivos", icon: CalendarDays },
    { name: "Estoque", icon: Package, badge: "3" },
  ] },
  { label: "INTELIGÊNCIA", items: [
    { name: "Orbton Analytics", icon: Activity },
    { name: "Custos & relatórios", icon: FileBarChart },
  ] },
];

const sectionTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  "Visão geral": { eyebrow: "QUINTA-FEIRA, 6 DE NOVEMBRO", title: "Bom dia, Paulo 👋", description: "Veja o que está acontecendo na sua operação hoje." },
  "Equipamentos": { eyebrow: "GESTÃO DE ATIVOS", title: "Equipamentos", description: "Acompanhe a saúde e a disponibilidade dos seus ativos." },
  "Ordens de serviço": { eyebrow: "CENTRO DE OPERAÇÕES", title: "Ordens de serviço", description: "Acompanhe e gerencie as solicitações de manutenção." },
  "Planos preventivos": { eyebrow: "MANUTENÇÃO PLANEJADA", title: "Planos preventivos", description: "Mantenha seus ativos funcionando com manutenções programadas." },
  "Estoque": { eyebrow: "ALMOXARIFADO", title: "Peças & estoque", description: "Controle a disponibilidade de peças e evite paradas inesperadas." },
  "Orbton Analytics": { eyebrow: "INTELIGÊNCIA PREDITIVA", title: "Orbton Analytics", description: "Transforme dados operacionais em decisões mais inteligentes." },
  "Custos & relatórios": { eyebrow: "DESEMPENHO OPERACIONAL", title: "Custos & relatórios", description: "Tenha clareza sobre os custos e resultados da manutenção." },
};

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function App() {
  const [activePage, setActivePage] = useState("Visão geral");
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    try {
      const saved = localStorage.getItem("orbton-orders");
      return saved ? JSON.parse(saved) as ServiceOrder[] : initialOrders;
    } catch {
      return initialOrders;
    }
  });
  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem("orbton-equipment");
      return saved ? JSON.parse(saved) as Equipment[] : initialAssets;
    } catch {
      return initialAssets;
    }
  });
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Últimos 6 meses");
  const [modal, setModal] = useState<"order" | "asset" | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [formName, setFormName] = useState("");
  const [formAsset, setFormAsset] = useState("");
  const [formSector, setFormSector] = useState("");

  const filteredOrders = useMemo(() => orders.filter((order) =>
    `${order.id} ${order.title} ${order.asset} ${order.assigned}`.toLowerCase().includes(query.toLowerCase()),
  ), [orders, query]);
  const heading = sectionTitles[activePage] ?? sectionTitles["Visão geral"];

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const changePage = (page: string) => {
    setActivePage(page);
    setMobileMenu(false);
  };

  const saveModal = () => {
    if (!formName.trim()) {
      notify("Preencha a descrição para continuar.");
      return;
    }
    if (modal === "order") {
      const nextOrder: ServiceOrder = {
        id: `OS-${2482 + orders.length - initialOrders.length}`,
        title: formName.trim(),
        asset: formAsset || "Equipamento não definido",
        category: "Corretiva",
        priority: "Média",
        status: "Aberta",
        assigned: "A definir",
        initials: "—",
        due: "A definir",
        color: "blue",
      };
      const next = [nextOrder, ...orders];
      setOrders(next);
      localStorage.setItem("orbton-orders", JSON.stringify(next));
      notify("Ordem de serviço criada com sucesso.");
      setActivePage("Ordens de serviço");
    } else {
      const next = [{
        name: formName.trim(),
        code: formAsset.trim() || `ORB-${String(equipment.length + 1).padStart(3, "0")}`,
        sector: formSector.trim() || "Sem setor",
        status: "Operacional",
        health: 100,
        icon: "◉",
      }, ...equipment];
      setEquipment(next);
      localStorage.setItem("orbton-equipment", JSON.stringify(next));
      notify("Equipamento adicionado com sucesso.");
      setActivePage("Equipamentos");
    }
    setFormName("");
    setFormAsset("");
    setFormSector("");
    setModal(null);
  };

  const advanceOrder = (order: ServiceOrder) => {
    const stages: ServiceOrder["status"][] = ["Aberta", "Em andamento", "Aguardando peças", "Concluída"];
    const nextStatus = stages[Math.min(stages.indexOf(order.status) + 1, stages.length - 1)];
    const next = orders.map((item) => item.id === order.id ? { ...item, status: nextStatus } : item);
    setOrders(next);
    localStorage.setItem("orbton-orders", JSON.stringify(next));
    notify(`${order.id} atualizada: ${nextStatus}.`);
  };

  const showDashboard = activePage === "Visão geral";
  const showOrders = activePage === "Ordens de serviço";
  const showAssets = activePage === "Equipamentos";

  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <button className="brand" onClick={() => changePage("Visão geral")} aria-label="Orbton início">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">orbton<span className="brand-period">.</span></span>
        </button>
        <button className="workspace-switch">
          <span className="workspace-avatar">N</span>
          <span className="workspace-label"><strong>Nova Indústria</strong><small>Plano Enterprise</small></span>
          <ChevronDown size={15} />
        </button>
        <div className="sidebar-nav">
          {navGroups.map((group, index) => (
            <div className="nav-group" key={group.label ?? `group-${index}`}>
              {group.label && <div className="nav-caption">{group.label}</div>}
              {group.items.map(({ name, icon: Icon, badge }) => (
                <button key={name} className={`nav-item ${activePage === name ? "nav-active" : ""}`} onClick={() => changePage(name)}>
                  <Icon size={17} strokeWidth={1.8} /><span>{name}</span>
                  {badge && <span className={`nav-badge ${name === "Estoque" ? "badge-warn" : ""}`}>{badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="uptime-card">
            <div className="uptime-top"><span className="uptime-dot" /> Operação saudável <Ellipsis size={15} /></div>
            <div className="uptime-value">98,6<span>%</span></div>
            <div className="uptime-caption">disponibilidade este mês</div>
            <div className="uptime-track"><span /></div>
          </div>
          <button className="nav-item support-item" onClick={() => notify("Nossa equipe entrará em contato em breve.")}><LifeBuoy size={17} /><span>Central de ajuda</span></button>
          <button className="nav-item support-item" onClick={() => notify("Configurações disponíveis em breve.")}><Settings2 size={17} /><span>Configurações</span></button>
          <div className="profile-card">
            <div className="profile-avatar">PL</div>
            <div className="profile-label"><strong>Paulo Lima</strong><small>Administrador</small></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu size={19} /></button><span>Workspace</span><span className="crumb-slash">/</span><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." /><kbd><Command size={10} /> K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notificações" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18} /><i /></button>
            {showNotifications && <div className="notification-popover"><div className="popover-heading"><strong>Notificações</strong><button onClick={() => setShowNotifications(false)}><X size={15} /></button></div><div className="notification-entry"><span className="notification-icon orange"><AlertCircle size={16} /></span><span><b>Estoque baixo</b><small>Filtro de ar · abaixo do mínimo</small><em>há 8 minutos</em></span></div><div className="notification-entry"><span className="notification-icon blue"><CalendarDays size={16} /></span><span><b>Preventiva próxima</b><small>Chiller Trane · vence amanhã</small><em>há 32 minutos</em></span></div><button className="all-notifications" onClick={() => { setShowNotifications(false); changePage("Planos preventivos"); }}>Ver todas as notificações <ArrowRight size={14} /></button></div>}
            <div className="topbar-divider" />
            <div className="topbar-avatar">PL</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow">{heading.eyebrow}</div><h1>{heading.title}</h1><p>{heading.description}</p></div>
            <div className="heading-actions"><button className="button button-secondary" onClick={() => notify("Relatório exportado com sucesso.")}><Download size={15} /> Exportar</button><button className="button button-primary" onClick={() => setModal(showAssets ? "asset" : "order")}><Plus size={16} /> {showAssets ? "Novo equipamento" : "Nova ordem"}</button></div>
          </section>

          {showDashboard && <Dashboard
            orders={filteredOrders}
            assets={equipment}
            period={period}
            setPeriod={setPeriod}
            onNavigate={changePage}
            onAdvance={advanceOrder}
          />}
          {showOrders && <OrdersPage orders={filteredOrders} query={query} setQuery={setQuery} onAdvance={advanceOrder} onNew={() => setModal("order")} />}
          {showAssets && <AssetsPage assets={equipment} query={query} setQuery={setQuery} onNew={() => setModal("asset")} />}
          {!showDashboard && !showOrders && !showAssets && <SecondaryPage page={activePage} onNavigate={changePage} onToast={notify} />}
          <footer className="page-footer"><span>© 2025 Orbton Technologies</span><span><span className="footer-live" /> Todos os sistemas operacionais</span><span>Feito para manter tudo em movimento <span className="footer-heart">✳</span></span></footer>
        </div>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><div className="modal-card"><div className="modal-head"><div><div className="modal-icon"><Wrench size={18} /></div><h2>{modal === "order" ? "Nova ordem de serviço" : "Novo equipamento"}</h2><p>{modal === "order" ? "Registre uma solicitação de manutenção." : "Cadastre um novo ativo na sua operação."}</p></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Fechar"><X size={18} /></button></div><div className="modal-form"><label>{modal === "order" ? "Descrição do problema" : "Nome do equipamento"}<input autoFocus value={formName} onChange={(event) => setFormName(event.target.value)} placeholder={modal === "order" ? "Ex.: Ruído anormal no motor..." : "Ex.: Compressor industrial..."} /></label>{modal === "order" ? <><label>Equipamento<input value={formAsset} onChange={(event) => setFormAsset(event.target.value)} placeholder="Selecione ou informe o equipamento" /></label><div className="form-row"><label>Prioridade<select defaultValue="Média"><option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option></select></label><label>Data prevista<input type="date" /></label></div><label>Solicitante<input placeholder="Nome do responsável" /></label></> : <div className="form-row"><label>Código patrimonial<input value={formAsset} onChange={(event) => setFormAsset(event.target.value)} placeholder="Ex.: CMP-025" /></label><label>Setor responsável<input value={formSector} onChange={(event) => setFormSector(event.target.value)} placeholder="Ex.: Utilidades" /></label></div>}</div><div className="modal-footer"><button className="button button-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="button button-primary" onClick={saveModal}><Plus size={15} /> Criar {modal === "order" ? "ordem" : "equipamento"}</button></div></div></div>}
      {toast && <div className="toast-message"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

function Dashboard({ orders, assets, period, setPeriod, onNavigate, onAdvance }: {
  orders: ServiceOrder[];
  assets: Equipment[];
  period: string;
  setPeriod: (period: string) => void;
  onNavigate: (page: string) => void;
  onAdvance: (order: ServiceOrder) => void;
}) {
  return <>
    <section className="metrics-grid">
      <MetricCard icon={Cpu} label="Total de equipamentos" value={String(248 + Math.max(0, assets.length - initialAssets.length))} change="+12 este mês" tone="blue" trend="up" />
      <MetricCard icon={CheckCircle2} label="Disponibilidade" value="98,6%" change="+2,4% vs. mês anterior" tone="green" trend="up" />
      <MetricCard icon={ClipboardCheck} label="Ordens em aberto" value={String(12 + Math.max(0, orders.length - initialOrders.length))} change="4 aguardando ação" tone="orange" trend="flat" />
      <MetricCard icon={CircleHelp} label="Custo de manutenção" value="R$ 28.450" change="−18,2% vs. mês anterior" tone="violet" trend="down" />
    </section>

    <section className="insight-banner">
      <div className="insight-symbol"><Sparkles size={17} /></div>
      <div className="insight-copy"><span className="insight-label">ORBTON INSIGHTS <span>• ANÁLISE AUTOMÁTICA</span></span><strong>Suas preventivas reduziram as falhas em 23% este trimestre.</strong><span>O Compressor Atlas Copco precisa de atenção: risco de falha elevado detectado.</span></div>
      <button onClick={() => onNavigate("Orbton Analytics")}>Ver análise completa <ArrowRight size={15} /></button>
      <span className="insight-decoration">✳</span>
    </section>

    <section className="charts-grid">
      <div className="panel cost-panel">
        <div className="panel-heading"><div><div className="panel-kicker">VISÃO FINANCEIRA</div><h2>Custos de manutenção</h2><p>Acompanhe os gastos da sua operação ao longo do tempo.</p></div><select className="select-small" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Últimos 6 meses</option><option>Últimos 12 meses</option><option>Este ano</option></select></div>
        <div className="cost-summary"><strong>R$ 226.840</strong><span><span className="trend-pill"><ArrowDownRight size={13} /> 12,8%</span> <small>vs. período anterior</small></span></div>
        <div className="chart-legend"><span><i className="legend-dot current" /> Este período</span><span><i className="legend-dot previous" /> Período anterior</span></div>
        <div className="area-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5572f5" stopOpacity={0.19} /><stop offset="95%" stopColor="#5572f5" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 5" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 11, fontFamily: "DM Sans" }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 10, fontFamily: "DM Sans" }} tickFormatter={(value: number) => `${value / 1000}k`} ticks={[0, 20000, 40000, 60000]} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ border: "1px solid #eceff4", borderRadius: 10, fontFamily: "DM Sans", fontSize: 12 }} /><Area type="monotone" dataKey="previous" stroke="#d7dce6" strokeWidth={2} strokeDasharray="5 5" fill="transparent" /><Area type="monotone" dataKey="cost" stroke="#5b70ef" strokeWidth={2.5} fill="url(#costGradient)" activeDot={{ r: 5, fill: "#5b70ef", stroke: "white", strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="panel distribution-panel">
        <div className="panel-heading"><div><div className="panel-kicker">OPERAÇÃO</div><h2>Manutenções</h2><p>Distribuição por tipo neste mês.</p></div><button className="more-button" onClick={() => onNavigate("Custos & relatórios")} aria-label="Mais opções"><Ellipsis size={19} /></button></div>
        <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} innerRadius={69} outerRadius={88} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4} startAngle={90} endAngle={-270}>{distribution.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: 9, border: "1px solid #eceff4", fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>186</strong><span>total</span></div></div>
        <div className="distribution-legend">{distribution.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div>
        <button className="text-link" onClick={() => onNavigate("Custos & relatórios")}>Ver relatório detalhado <ArrowRight size={14} /></button>
      </div>
    </section>

    <section className="bottom-grid">
      <div className="panel orders-panel">
        <div className="panel-heading compact-heading"><div><div className="panel-kicker">ACOMPANHAMENTO</div><h2>Ordens de serviço <span className="count-chip">{orders.length}</span></h2></div><button className="text-link" onClick={() => onNavigate("Ordens de serviço")}>Ver todas <ArrowRight size={14} /></button></div>
        <div className="orders-table-wrap"><table className="data-table orders-table"><thead><tr><th>ORDEM</th><th>EQUIPAMENTO</th><th>PRIORIDADE</th><th>STATUS</th><th>RESPONSÁVEL</th><th /></tr></thead><tbody>{orders.slice(0, 4).map((order) => <tr key={order.id}><td><button className="order-id" onClick={() => onAdvance(order)}>{order.id}</button><span className="order-title">{order.title}</span></td><td><span className="asset-name">{order.asset}</span><span className="asset-category">{order.category}</span></td><td><PriorityBadge priority={order.priority} /></td><td><StatusBadge status={order.status} /></td><td><div className="assignee"><span className={`assignee-avatar avatar-${order.color}`}>{order.initials}</span>{order.assigned}</div></td><td><button className="row-more" title="Avançar etapa" onClick={() => onAdvance(order)}><Ellipsis size={17} /></button></td></tr>)}</tbody></table>{orders.length === 0 && <div className="empty-state">Nenhuma ordem encontrada.</div>}</div>
      </div>
      <div className="panel critical-panel">
        <div className="panel-heading compact-heading"><div><div className="panel-kicker">ORBTON ANALYTICS <span className="live-tag"><i /> AO VIVO</span></div><h2>Ativos em atenção</h2></div><button className="more-button" onClick={() => onNavigate("Orbton Analytics")} aria-label="Ver análise"><ArrowRight size={16} /></button></div>
        <div className="critical-list">
          <div className="critical-item"><div className="critical-icon critical-red"><Zap size={17} /></div><div className="critical-info"><strong>Compressor Atlas Copco</strong><span>3 falhas · R$ 18.240 em custos</span></div><div className="risk-score risk-high"><span>86</span><small>risco</small></div></div>
          <div className="critical-item"><div className="critical-icon critical-yellow"><Gauge size={17} /></div><div className="critical-info"><strong>Gerador Cummins 500 kVA</strong><span>2 falhas · R$ 12.800 em custos</span></div><div className="risk-score risk-medium"><span>64</span><small>risco</small></div></div>
          <div className="critical-item"><div className="critical-icon critical-blue"><Activity size={17} /></div><div className="critical-info"><strong>Bomba Grundfos CR 32</strong><span>1 falha · R$ 4.320 em custos</span></div><div className="risk-score risk-low"><span>38</span><small>risco</small></div></div>
        </div>
        <button className="analytics-cta" onClick={() => onNavigate("Orbton Analytics")}><span><Sparkles size={14} /> Insights preditivos</span><span>Explorar <ArrowRight size={14} /></span></button>
      </div>
    </section>

    <section className="bottom-grid second-row">
      <div className="panel assets-panel">
        <div className="panel-heading compact-heading"><div><div className="panel-kicker">MONITORAMENTO</div><h2>Saúde dos equipamentos</h2></div><button className="text-link" onClick={() => onNavigate("Equipamentos")}>Ver todos <ArrowRight size={14} /></button></div>
        <div className="asset-health-list">{assets.slice(0, 4).map((asset) => <div className="asset-health-row" key={asset.code}><span className="asset-glyph">{asset.icon}</span><div className="asset-health-name"><strong>{asset.name}</strong><small>{asset.code} <span>·</span> {asset.sector}</small></div><div className="health-bar"><span className={asset.health < 50 ? "health-low" : asset.health < 70 ? "health-mid" : ""} style={{ width: `${asset.health}%` }} /></div><strong className={asset.health < 50 ? "health-number-low" : "health-number"}>{asset.health}%</strong><StatusBadge status={asset.status} /></div>)}</div>
      </div>
      <div className="panel schedule-panel">
        <div className="panel-heading compact-heading"><div><div className="panel-kicker">AGENDA</div><h2>Próximas atividades</h2></div><button className="more-button" onClick={() => onNavigate("Planos preventivos")} aria-label="Ver calendário"><CalendarDays size={16} /></button></div>
        <div className="schedule-list"><div className="schedule-entry"><div className="schedule-date"><strong>07</strong><span>NOV</span></div><div className="schedule-bar schedule-blue" /><div className="schedule-info"><strong>Inspeção do chiller central</strong><span>Preventiva · Climatização</span></div><span className="schedule-time">09:00</span></div><div className="schedule-entry"><div className="schedule-date"><strong>08</strong><span>NOV</span></div><div className="schedule-bar schedule-orange" /><div className="schedule-info"><strong>Troca de óleo do gerador</strong><span>Preventiva · Energia</span></div><span className="schedule-time">14:30</span></div><div className="schedule-entry"><div className="schedule-date"><strong>10</strong><span>NOV</span></div><div className="schedule-bar schedule-green" /><div className="schedule-info"><strong>Calibração de sensores</strong><span>Inspeção · Instrumentação</span></div><span className="schedule-time">10:00</span></div></div>
        <button className="text-link schedule-link" onClick={() => onNavigate("Planos preventivos")}>Abrir calendário <ArrowRight size={14} /></button>
      </div>
    </section>
  </>;
}

function MetricCard({ icon: Icon, label, value, change, tone, trend }: { icon: LucideIcon; label: string; value: string; change: string; tone: string; trend: "up" | "down" | "flat" }) {
  return <div className="metric-card"><div className="metric-top"><span className={`metric-icon metric-${tone}`}><Icon size={17} strokeWidth={2} /></span><button aria-label={`Detalhes: ${label}`} className="metric-more"><Ellipsis size={18} /></button></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-change">{trend === "up" ? <ArrowUpRight size={13} /> : trend === "down" ? <ArrowDownRight size={13} /> : <Clock3 size={12} />}<span className={trend === "down" ? "change-good" : trend === "flat" ? "change-neutral" : ""}>{change}</span></div></div>;
}

function PriorityBadge({ priority }: { priority: ServiceOrder["priority"] }) {
  return <span className={`priority-badge priority-${priority.toLowerCase()}`}><i />{priority}</span>;
}

function StatusBadge({ status }: { status: ServiceOrder["status"] | string }) {
  const className = status === "Em andamento" || status === "Em manutenção" ? "status-progress" : status === "Aberta" ? "status-open" : status === "Aguardando peças" ? "status-waiting" : status === "Concluída" || status === "Operacional" ? "status-done" : "status-neutral";
  return <span className={`status-badge ${className}`}><i />{status}</span>;
}

function OrdersPage({ orders, query, setQuery, onAdvance, onNew }: { orders: ServiceOrder[]; query: string; setQuery: (value: string) => void; onAdvance: (order: ServiceOrder) => void; onNew: () => void }) {
  const [statusFilter, setStatusFilter] = useState("Todas");
  const visible = orders.filter((order) => statusFilter === "Todas" || order.status === statusFilter);
  return <div className="panel page-table-panel"><div className="list-toolbar"><div className="list-stats"><span><i className="stat-dot open-dot" />{orders.filter((item) => item.status !== "Concluída").length} abertas</span><span><i className="stat-dot done-dot" />{orders.filter((item) => item.status === "Concluída").length} concluídas</span></div><div className="list-filters"><label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ordens..." /></label><div className="filter-select-wrap"><Filter size={14} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todas</option><option>Aberta</option><option>Em andamento</option><option>Aguardando peças</option><option>Concluída</option></select></div><button className="button button-primary" onClick={onNew}><Plus size={15} /> Nova ordem</button></div></div><div className="orders-table-wrap"><table className="data-table full-table"><thead><tr><th>ORDEM / DESCRIÇÃO</th><th>EQUIPAMENTO</th><th>PRIORIDADE</th><th>STATUS</th><th>RESPONSÁVEL</th><th>PREVISTA</th><th>AÇÃO</th></tr></thead><tbody>{visible.map((order) => <tr key={order.id}><td><button className="order-id" onClick={() => onAdvance(order)}>{order.id}</button><span className="order-title">{order.title}</span></td><td><span className="asset-name">{order.asset}</span><span className="asset-category">{order.category}</span></td><td><PriorityBadge priority={order.priority} /></td><td><StatusBadge status={order.status} /></td><td><div className="assignee"><span className={`assignee-avatar avatar-${order.color}`}>{order.initials}</span>{order.assigned}</div></td><td className="due-date">{order.due}</td><td><button className="advance-button" onClick={() => onAdvance(order)}>{order.status === "Concluída" ? <Check size={15} /> : <ArrowRight size={15} />}</button></td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state">Nenhuma ordem encontrada com esses filtros.</div>}</div><div className="table-foot"><span>Exibindo {visible.length} de {orders.length} ordens</span><div><button className="pagination-button" disabled><ChevronLeft size={15} /></button><button className="pagination-button active-page">1</button><button className="pagination-button">2</button><button className="pagination-button"><ChevronRight size={15} /></button></div></div></div>;
}

function AssetsPage({ assets, query, setQuery, onNew }: { assets: Equipment[]; query: string; setQuery: (value: string) => void; onNew: () => void }) {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const filtered = assets.filter((asset) =>
    `${asset.name} ${asset.code} ${asset.sector}`.toLowerCase().includes(query.toLowerCase())
    && (statusFilter === "Todos" || asset.status === statusFilter),
  );
  const additionalAssets = Math.max(0, assets.length - initialAssets.length);
  const activeCount = 239 + additionalAssets;
  return <><div className="metrics-grid asset-metrics"><MetricCard icon={Cpu} label="Total de ativos" value={String(248 + additionalAssets)} change="Em 12 setores" tone="blue" trend="flat" /><MetricCard icon={CheckCircle2} label="Operacionais" value={String(activeCount)} change={`${((activeCount / (248 + additionalAssets)) * 100).toFixed(1).replace(".", ",")}% dos ativos`} tone="green" trend="up" /><MetricCard icon={Wrench} label="Em manutenção" value="6" change="2 com prioridade alta" tone="orange" trend="flat" /><MetricCard icon={ShieldAlert} label="Inativos" value="3" change="Requer atenção" tone="violet" trend="flat" /></div><div className="panel page-table-panel"><div className="list-toolbar"><div className="list-stats"><span>Equipamentos cadastrados <b className="count-chip">{248 + additionalAssets}</b></span></div><div className="list-filters"><label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar equipamentos..." /></label><label className="filter-select-wrap"><Filter size={14} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option><option>Operacional</option><option>Em manutenção</option><option>Inativo</option></select></label><button className="button button-primary" onClick={onNew}><Plus size={15} /> Novo equipamento</button></div></div><div className="orders-table-wrap"><table className="data-table full-table"><thead><tr><th>EQUIPAMENTO</th><th>CÓDIGO</th><th>SETOR</th><th>SAÚDE</th><th>STATUS</th><th>ÚLTIMA MANUTENÇÃO</th><th /></tr></thead><tbody>{filtered.map((asset) => <tr key={asset.code}><td><div className="asset-table-name"><span className="asset-glyph">{asset.icon}</span><strong>{asset.name}</strong></div></td><td className="mono-code">{asset.code}</td><td>{asset.sector}</td><td><div className="health-table"><div className="health-bar"><span className={asset.health < 50 ? "health-low" : asset.health < 70 ? "health-mid" : ""} style={{ width: `${asset.health}%` }} /></div>{asset.health}%</div></td><td><StatusBadge status={asset.status} /></td><td className="due-date">04 nov, 2025</td><td><button className="row-more" aria-label="Mais opções"><Ellipsis size={17} /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state">Nenhum equipamento encontrado com esses filtros.</div>}</div></div></>;
}

function SecondaryPage({ page, onNavigate, onToast }: { page: string; onNavigate: (page: string) => void; onToast: (message: string) => void }) {
  if (page === "Orbton Analytics") return <><section className="analytics-overview"><div className="analytics-intro"><div className="analytics-orb"><Sparkles size={25} /></div><div><div className="eyebrow">MOTOR DE INTELIGÊNCIA ORBTON</div><h2>Antecipe o próximo problema.</h2><p>Nossos modelos analisaram 248 ativos e identificaram oportunidades para evitar paradas não planejadas.</p></div></div><div className="analytics-period"><span className="live-tag"><i /> ATUALIZADO AGORA</span><span>Dados dos últimos 90 dias</span></div></section><div className="metrics-grid"><MetricCard icon={TrendingUp} label="Falhas evitadas" value="18" change="+5 este trimestre" tone="green" trend="up" /><MetricCard icon={CircleHelp} label="Economia potencial" value="R$ 84.200" change="Com ações recomendadas" tone="blue" trend="up" /><MetricCard icon={ShieldAlert} label="Ativos em risco" value="7" change="3 precisam de ação imediata" tone="orange" trend="flat" /><MetricCard icon={Gauge} label="MTBF médio" value="486h" change="+14,2% vs. trimestre anterior" tone="violet" trend="up" /></div><div className="bottom-grid"><div className="panel critical-panel analytics-ranking"><div className="panel-heading"><div><div className="panel-kicker">RANKING PREDITIVO</div><h2>Ativos críticos</h2><p>Ordenados por risco de falha e impacto operacional.</p></div><span className="live-tag"><i /> AO VIVO</span></div><div className="critical-list"><div className="critical-item"><span className="rank-number">01</span><div className="critical-icon critical-red"><Zap size={17} /></div><div className="critical-info"><strong>Compressor Atlas Copco</strong><span>3 falhas · 18h parado · R$ 18.240</span></div><div className="risk-score risk-high"><span>86</span><small>risco</small></div></div><div className="critical-item"><span className="rank-number">02</span><div className="critical-icon critical-yellow"><Gauge size={17} /></div><div className="critical-info"><strong>Gerador Cummins 500 kVA</strong><span>2 falhas · 12h parado · R$ 12.800</span></div><div className="risk-score risk-medium"><span>64</span><small>risco</small></div></div><div className="critical-item"><span className="rank-number">03</span><div className="critical-icon critical-blue"><Activity size={17} /></div><div className="critical-info"><strong>Bomba Grundfos CR 32</strong><span>1 falha · 6h parado · R$ 4.320</span></div><div className="risk-score risk-low"><span>38</span><small>risco</small></div></div></div></div><div className="panel analytics-tips"><div className="panel-kicker">AÇÕES RECOMENDADAS</div><h2>O que fazer agora</h2><div className="recommendation"><span className="recommendation-number">1</span><div><strong>Inspecione o Compressor Atlas Copco</strong><p>Vibração acima do padrão sugere desgaste nos rolamentos.</p><button onClick={() => onNavigate("Ordens de serviço")}>Criar ordem de serviço <ArrowRight size={13} /></button></div></div><div className="recommendation"><span className="recommendation-number">2</span><div><strong>Revise o plano do gerador</strong><p>Intervalo preventivo pode ser otimizado em 15%.</p><button onClick={() => onNavigate("Planos preventivos")}>Ver planos preventivos <ArrowRight size={13} /></button></div></div></div></div><div className="analytics-footnote"><Sparkles size={14} /> Insights baseados em histórico de falhas, custos e ciclos de operação dos ativos.</div></>;
  if (page === "Custos & relatórios") return <><div className="metrics-grid"><MetricCard icon={CircleHelp} label="Custo total no mês" value="R$ 28.450" change="−18,2% vs. mês anterior" tone="blue" trend="down" /><MetricCard icon={Wrench} label="Mão de obra" value="R$ 12.300" change="43% dos custos" tone="violet" trend="flat" /><MetricCard icon={Package} label="Peças & materiais" value="R$ 10.850" change="38% dos custos" tone="orange" trend="flat" /><MetricCard icon={TrendingUp} label="MTTR médio" value="2,4h" change="−32 min este mês" tone="green" trend="down" /></div><section className="charts-grid reports-charts"><div className="panel cost-panel"><div className="panel-heading"><div><div className="panel-kicker">ANÁLISE FINANCEIRA</div><h2>Evolução de custos</h2><p>Custos de manutenção preventiva e corretiva.</p></div><button className="button button-secondary" onClick={() => onToast("Relatório exportado com sucesso.")}><Download size={15} /> Exportar</button></div><div className="area-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 16, right: 10, left: -15, bottom: 0 }}><defs><linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5572f5" stopOpacity={0.18} /><stop offset="100%" stopColor="#5572f5" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 5" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 10 }} tickFormatter={(value: number) => `${value / 1000}k`} /><Tooltip formatter={(value) => money(Number(value))} /><Area type="monotone" dataKey="cost" stroke="#5b70ef" strokeWidth={2.5} fill="url(#reportGradient)" /></AreaChart></ResponsiveContainer></div></div><div className="panel report-options"><div className="panel-kicker">RELATÓRIOS DISPONÍVEIS</div><h2>Relatórios rápidos</h2>{["Custos por equipamento", "Custos por setor", "Falhas recorrentes", "Preventivas atrasadas"].map((item) => <button className="report-option" key={item} onClick={() => onToast(`${item} exportado com sucesso.`)}><span><FileBarChart size={16} />{item}</span><Download size={15} /></button>)}</div></section></>;
  if (page === "Planos preventivos") return <><div className="preventive-toolbar"><div className="calendar-toggle"><button className="calendar-arrow" onClick={() => onToast("Exibindo a semana atual.")}><ChevronLeft size={16} /></button><strong>3 – 9 de novembro, 2025</strong><button className="calendar-arrow" onClick={() => onToast("Exibindo a próxima semana.")}><ChevronRight size={16} /></button></div><div className="calendar-views"><button className="selected-view">Semana</button><button onClick={() => onToast("Visualização mensal selecionada.")}>Mês</button><button onClick={() => onToast("Visualização diária selecionada.")}>Dia</button></div></div><div className="calendar-grid"><div className="calendar-header"><span>HORÁRIO</span>{["SEG 03", "TER 04", "QUA 05", "QUI 06", "SEX 07", "SÁB 08", "DOM 09"].map((day) => <span key={day}>{day}</span>)}</div>{["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((hour, row) => <div className="calendar-row" key={hour}><span className="calendar-hour">{hour}</span>{Array.from({ length: 7 }, (_, col) => <div className={`calendar-cell ${row === 1 && col === 4 ? "event-cell" : ""} ${row === 6 && col === 5 ? "event-cell" : ""} ${row === 2 && col === 2 ? "event-cell" : ""}`} key={`${row}-${col}`}>{row === 1 && col === 4 && <button className="calendar-event event-blue" onClick={() => onToast("Inspeção do chiller central · 09:00")}>Inspeção do chiller<small>Preventiva · 09:00</small></button>}{row === 6 && col === 5 && <button className="calendar-event event-orange" onClick={() => onToast("Troca de óleo do gerador · 14:30")}>Troca de óleo<small>Preventiva · 14:30</small></button>}{row === 2 && col === 2 && <button className="calendar-event event-green" onClick={() => onToast("Calibração de sensores · 10:00")}>Calibração<small>Inspeção · 10:00</small></button>}</div>)}</div>)}</div><div className="calendar-legend"><span><i className="event-legend-blue" /> Preventiva</span><span><i className="event-legend-orange" /> Corretiva</span><span><i className="event-legend-green" /> Inspeção</span></div></>;
  if (page === "Estoque") return <><div className="metrics-grid"><MetricCard icon={Package} label="Itens cadastrados" value="186" change="Em 24 categorias" tone="blue" trend="flat" /><MetricCard icon={CheckCircle2} label="Estoque saudável" value="172" change="92,5% dos itens" tone="green" trend="up" /><MetricCard icon={AlertCircle} label="Abaixo do mínimo" value="3" change="Reposição recomendada" tone="orange" trend="flat" /><MetricCard icon={CircleHelp} label="Valor em estoque" value="R$ 84.620" change="Valor total disponível" tone="violet" trend="flat" /></div><div className="panel page-table-panel"><div className="list-toolbar"><div className="list-stats"><span>Itens em estoque <b className="count-chip">186</b></span></div><div className="list-filters"><button className="filter-select-wrap" onClick={() => onToast("Exibindo itens abaixo do estoque mínimo.")}><Filter size={14} /> Estoque baixo</button><button className="button button-primary" onClick={() => onToast("Cadastro de peça iniciado.")}><Plus size={15} /> Nova peça</button></div></div><div className="orders-table-wrap"><table className="data-table full-table"><thead><tr><th>PEÇA</th><th>CÓDIGO</th><th>FORNECEDOR</th><th>DISPONÍVEL</th><th>MÍNIMO</th><th>VALOR UNITÁRIO</th><th>STATUS</th></tr></thead><tbody>{[{ name: "Filtro de ar industrial", code: "FLT-084", supplier: "MaqParts", qty: 4, min: 8, price: "R$ 245,00" }, { name: "Rolamento SKF 6205", code: "ROL-205", supplier: "SKF Brasil", qty: 12, min: 10, price: "R$ 89,90" }, { name: "Correia industrial A-42", code: "COR-042", supplier: "VedaTech", qty: 3, min: 5, price: "R$ 62,50" }, { name: "Óleo lubrificante ISO 68", code: "OLE-068", supplier: "Petrobras", qty: 24, min: 10, price: "R$ 188,00" }].map((item) => <tr key={item.code}><td><div className="asset-table-name"><span className="asset-glyph"><Package size={17} /></span><strong>{item.name}</strong></div></td><td className="mono-code">{item.code}</td><td>{item.supplier}</td><td><strong className={item.qty <= item.min ? "stock-low" : ""}>{item.qty} un.</strong></td><td>{item.min} un.</td><td>{item.price}</td><td><span className={`status-badge ${item.qty <= item.min ? "status-waiting" : "status-done"}`}><i />{item.qty <= item.min ? "Repor" : "Disponível"}</span></td></tr>)}</tbody></table></div></div></>;
  return <div className="panel placeholder-panel"><div className="placeholder-icon"><Settings2 size={24} /></div><div className="eyebrow">PLATAFORMA ORBTON</div><h2>Um centro de controle para sua operação.</h2><p>Estamos preparando este espaço para você. Explore seus equipamentos, ordens de serviço e análises enquanto isso.</p><button className="button button-primary" onClick={() => onNavigate("Visão geral")}>Voltar à visão geral <ArrowRight size={15} /></button></div>;
}

export default App;
