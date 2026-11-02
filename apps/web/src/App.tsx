import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Crosshair,
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  List,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { api, IS_DEMO } from './api';
import { ThemeToggle } from './theme';
import {
  Avatar,
  Emblem,
  Logo,
  MissionArt,
  Modal,
  Progress,
  ProjectCard,
  StatusBadge,
  ValueIcon,
} from './components';
import { AuthScreen, ProjectDetail, ProjectForm, UserForm } from './forms';
import {
  dueLabel,
  filterProjects,
  isOverdue,
  Project,
  STATUS,
  Status,
  User,
  VALUES,
} from './domain';

type Page = 'overview' | 'projects' | 'heroes' | 'values';
type Dialog =
  | { type: 'create' }
  | { type: 'edit'; project: Project }
  | { type: 'detail'; project: Project }
  | { type: 'user'; user?: User }
  | { type: 'help' }
  | null;
type DeleteTarget = { type: 'project'; item: Project } | { type: 'user'; item: User } | null;
const PAGE_NAMES: Record<Page, string> = {
  overview: 'Visão geral',
  projects: 'Projetos',
  heroes: 'Heróis',
  values: 'Nossos valores',
};
export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState<Page>('overview');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [sort, setSort] = useState('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [remove, setRemove] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const admin = user?.role === 'admin';
  async function authenticate() {
    setAuthError('');
    setUser(undefined);
    try {
      setUser(await api.me());
    } catch (e) {
      setAuthError((e as Error).message);
    }
  }
  useEffect(() => {
    void authenticate();
    const expired = () => {
      setUser(null);
      setDialog(null);
      setFeedback('Sua sessão expirou. Entre novamente.');
    };
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, []);
  async function loadData(actor: User) {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all([
        api.projects(),
        actor.role === 'admin' ? api.users() : Promise.resolve([actor]),
      ]);
      setProjects(results[0]);
      setUsers(results[1]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setOwner('');
    setStatus('');
    setSearch('');
    setPage('overview');
    if (user) void loadData(user);
  }, [user?.id]);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(''), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);
  async function logout() {
    try {
      await api.logout();
      setUser(null);
      setDialog(null);
      setMenu(false);
      setNotifications(false);
      setProjects([]);
      setUsers([]);
    } catch (e) {
      setFeedback((e as Error).message);
    }
  }
  function navigate(next: Page) {
    setPage(next);
    setMenu(false);
    setSearch('');
    setStatus('');
    setOwner('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function changed() {
    if (user) await loadData(user);
    setFeedback('Missão atualizada. Vamos em frente!');
  }
  async function userChanged(saved: User) {
    const actor = saved.id === user?.id ? saved : user;
    if (saved.id === user?.id) setUser(saved);
    if (actor) await loadData(actor);
    setFeedback('Perfil salvo com sucesso.');
  }
  function askRemove(target: DeleteTarget) {
    setDeleteError('');
    setDialog(null);
    setRemove(target);
  }
  async function confirmRemove() {
    if (!remove) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (remove.type === 'project') await api.deleteProject(remove.item.id);
      else await api.deleteUser(remove.item.id);
      setRemove(null);
      setDialog(null);
      if (user) await loadData(user);
      setFeedback(remove.type === 'project' ? 'Projeto excluído.' : 'Herói removido da equipe.');
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  if (authError)
    return (
      <div className="full-state">
        <ThemeToggle className="standalone-theme-toggle" showLabel />
        <Logo />
        <h2>Não conseguimos abrir a central.</h2>
        <p>{authError}</p>
        <button className="button button-primary" onClick={authenticate}>
          Tentar novamente
        </button>
      </div>
    );
  if (user === undefined)
    return (
      <div className="full-state">
        <ThemeToggle className="standalone-theme-toggle" showLabel />
        <Logo />
        <LoaderCircle className="spin" />
        <p>Preparando sua central de missões…</p>
      </div>
    );
  if (user === null)
    return (
      <>
        <AuthScreen onLogin={setUser} />
        {feedback && (
          <div className="toast" role="status">
            {feedback}
          </div>
        )}
      </>
    );
  const active = projects.filter((p) => p.status === 'em_andamento').length;
  const done = projects.filter((p) => p.status === 'concluido').length;
  const pending = projects.filter((p) => p.status === 'pendente').length;
  const completeGoals = projects.reduce((s, p) => s + p.goals.filter((g) => g.completed).length, 0);
  const totalGoals = projects.reduce((s, p) => s + p.goals.length, 0);
  const filtered = filterProjects(projects, status, owner, search).sort((a, b) =>
    sort === 'progress'
      ? b.progress - a.progress
      : sort === 'due'
        ? (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
        : b.createdAt.localeCompare(a.createdAt),
  );
  const visible = page === 'overview' ? filtered.slice(0, 6) : filtered;
  const overdue = projects.filter(isOverdue);
  const valueStats = VALUES.map((v) => {
    const goals = projects.flatMap((p) => p.goals).filter((g) => g.value === v.key);
    return {
      ...v,
      total: goals.length,
      done: goals.filter((g) => g.completed).length,
      percent: goals.length
        ? Math.round((goals.filter((g) => g.completed).length / goals.length) * 100)
        : 0,
    };
  });
  return (
    <div className="app-shell">
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button mobile-close"
            aria-label="Fechar menu"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace">
          <div className="workspace-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <b>Central de missões</b>
            <span>Workspace HeroForce</span>
          </div>
          <span className="workspace-status" title="Workspace ativo" />
        </div>
        <span className="nav-label">SEU UNIVERSO</span>
        <nav aria-label="Navegação principal">
          {(
            [
              { key: 'overview', label: 'Visão geral', icon: LayoutDashboard },
              { key: 'projects', label: 'Projetos', icon: FolderKanban },
              ...(admin ? [{ key: 'heroes', label: 'Heróis', icon: Users }] : []),
              { key: 'values', label: 'Nossos valores', icon: Crosshair },
            ] as const
          ).map((item) => (
            <button
              className={page === item.key ? 'active' : ''}
              key={item.key}
              onClick={() => navigate(item.key as Page)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.key === 'projects' && <b>{projects.length}</b>}
              {page === item.key && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="team-callout">
            <div className="callout-icon">
              <Sparkles size={19} />
            </div>
            <strong>
              Grandes poderes.
              <br />
              Grandes possibilidades.
            </strong>
            <p>Nossos valores são o que nos torna uma equipe extraordinária.</p>
            <button onClick={() => navigate('values')}>
              Conheça nosso DNA
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="help-nav" onClick={() => setDialog({ type: 'help' })}>
            <CircleHelp size={18} />
            Guia da central
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-user">
            <button onClick={() => setDialog({ type: 'user', user })} className="profile-button">
              <Avatar user={user} />
              <span>
                <strong>{user.name}</strong>
                <small>{admin ? 'Administrador' : 'Herói'}</small>
              </span>
            </button>
            <button
              className="icon-button logout"
              title="Sair da conta"
              aria-label="Sair da conta"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              WORKSPACE <span>/</span>
              <strong>{PAGE_NAMES[page]}</strong>
            </span>
          </div>
          <div className="topbar-tools">
            <ThemeToggle />
            <div className="global-search">
              <Search size={17} />
              <input
                aria-label="Buscar projetos ou heróis"
                placeholder="Buscar no seu universo…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (page === 'values') setPage('projects');
                }}
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Limpar busca"
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              className="icon-button top-help"
              aria-label="Abrir guia da central"
              onClick={() => setDialog({ type: 'help' })}
            >
              <CircleHelp size={19} />
            </button>
            <div className="notification-wrap">
              <button
                className={`icon-button ${notifications ? 'is-selected' : ''}`}
                aria-label={`Notificações: ${overdue.length} projetos com prazo vencido`}
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {overdue.length > 0 && <i className="notification-dot" />}
              </button>
              {notifications && (
                <div className="notifications">
                  <strong>Radar de missões</strong>
                  <span>
                    {overdue.length
                      ? `${overdue.length} missão(ões) precisam de atenção.`
                      : 'Tudo sob controle por aqui.'}
                  </span>
                  {overdue.length ? (
                    overdue.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setNotifications(false);
                          setDialog({ type: 'detail', project: p });
                        }}
                      >
                        <Clock3 size={17} />
                        <span>
                          <b>{p.name}</b>
                          <small>Prazo vencido · {dueLabel(p.dueDate)}</small>
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <p>
                      <ShieldCheck size={30} />
                      Nenhum projeto com prazo vencido.
                      <br />
                      Continue fazendo acontecer.
                    </p>
                  )}
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            <button
              className="avatar-button"
              aria-label="Editar meu perfil"
              onClick={() => setDialog({ type: 'user', user })}
            >
              <Avatar user={user} size="sm" />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {page === 'overview'
                  ? 'SUA CENTRAL DE GRANDES FEITOS'
                  : page === 'projects'
                    ? 'IDEIAS QUE MOVEM O MUNDO'
                    : page === 'heroes'
                      ? 'PODERES DIFERENTES. UM SÓ PROPÓSITO.'
                      : 'O QUE NOS TORNA EXTRAORDINÁRIOS'}
              </span>
              <h1>
                {page === 'overview' ? `Olá, ${user.name.split(' ')[0]}` : PAGE_NAMES[page]}
                {page === 'overview' && <span className="greeting-spark">✳</span>}
              </h1>
              <p>
                {page === 'overview'
                  ? 'Sua equipe tem o poder. Aqui, ele vira impacto.'
                  : page === 'projects'
                    ? 'Acompanhe cada missão, do primeiro passo ao próximo grande feito.'
                    : page === 'heroes'
                      ? 'Conheça as pessoas por trás de cada missão.'
                      : 'Seis valores. Infinitas maneiras de fazer a diferença.'}
              </p>
            </div>
            <div className="heading-actions">
              {IS_DEMO && (
                <span className="demo-badge">
                  <span />
                  Demonstração
                </span>
              )}
              {admin && page !== 'values' && (
                <button
                  className="button button-primary"
                  onClick={() =>
                    setDialog(page === 'heroes' ? { type: 'user' } : { type: 'create' })
                  }
                >
                  <Plus size={17} />
                  {page === 'heroes' ? 'Adicionar herói' : 'Novo projeto'}
                </button>
              )}
            </div>
          </div>
          {IS_DEMO && (
            <div className="demo-note">
              Ambiente demonstrativo · alterações ficam salvas neste navegador.
              <button onClick={logout}>
                Trocar perfil <ArrowUpRight size={12} />
              </button>
            </div>
          )}
          {error && (
            <div className="data-error" role="alert">
              <span>{error}</span>
              <button className="button button-secondary" onClick={() => loadData(user)}>
                Tentar novamente
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-panel" role="status">
              <LoaderCircle className="spin" />
              <span>Buscando suas missões…</span>
            </div>
          ) : (
            <>
              {page === 'overview' && (
                <>
                  <section className="welcome-banner">
                    <div className="welcome-copy">
                      <span className="banner-label">
                        <Zap size={13} fill="currentColor" />O PRÓXIMO NÍVEL É COLETIVO
                      </span>
                      <h2>
                        Grandes feitos.
                        <br />
                        Começam por aqui.
                      </h2>
                      <p>
                        Cada projeto é uma missão. Cada meta, uma conquista.
                        <br />
                        Juntos, a gente vai além do extraordinário.
                      </p>
                      <button onClick={() => navigate('projects')}>
                        Vamos fazer acontecer
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    <MissionArt />
                    <span className="banner-edition">HEROFORCE / INICIATIVA 01</span>
                  </section>
                  <section className="stats-grid" aria-label="Resumo das missões">
                    {[
                      {
                        label: 'Total de projetos',
                        value: projects.length,
                        icon: FolderKanban,
                        className: 'neutral',
                        note: 'Missões no seu radar',
                      },
                      {
                        label: 'Em andamento',
                        value: active,
                        icon: Zap,
                        className: 'blue',
                        note: 'Ideias ganhando vida',
                      },
                      {
                        label: 'Concluídos',
                        value: done,
                        icon: CheckCircle2,
                        className: 'green',
                        note: 'Impactos que já são reais',
                      },
                      {
                        label: admin ? 'Heróis na equipe' : 'Metas concluídas',
                        value: admin ? users.length : completeGoals,
                        icon: admin ? Users : Target,
                        className: 'amber',
                        note: admin
                          ? 'Poderes que se complementam'
                          : `de ${totalGoals} metas nas suas missões`,
                      },
                    ].map((s) => (
                      <article className="stat-card" key={s.label}>
                        <div>
                          <span>{s.label}</span>
                          <span className={`stat-icon ${s.className}`}>
                            <s.icon size={17} />
                          </span>
                        </div>
                        <strong>{s.value.toString().padStart(2, '0')}</strong>
                        <small>{s.note}</small>
                      </article>
                    ))}
                  </section>
                </>
              )}
              {(page === 'overview' || page === 'projects') && (
                <div className={page === 'overview' ? 'dashboard-columns' : 'projects-full'}>
                  <section className="projects-section">
                    <div className="section-heading">
                      <div>
                        <h2>
                          {page === 'overview' ? 'Missões em foco' : 'Todas as missões'}
                          <span>{projects.length}</span>
                        </h2>
                        <p>
                          {page === 'overview'
                            ? 'O próximo grande impacto está em construção.'
                            : 'Organize, acompanhe e celebre cada entrega.'}
                        </p>
                      </div>
                      {page === 'overview' && (
                        <button className="text-button" onClick={() => navigate('projects')}>
                          Ver todos
                          <ArrowUpRight size={15} />
                        </button>
                      )}
                    </div>
                    <div className="project-tabs" role="tablist" aria-label="Status dos projetos">
                      {[
                        { key: '', label: 'Todos', count: projects.length },
                        { key: 'em_andamento', label: 'Em andamento', count: active },
                        { key: 'pendente', label: 'Pendentes', count: pending },
                        { key: 'concluido', label: 'Concluídos', count: done },
                      ].map((t) => (
                        <button
                          role="tab"
                          aria-selected={status === t.key}
                          className={status === t.key ? 'selected' : ''}
                          key={t.key}
                          onClick={() => setStatus(t.key)}
                        >
                          {t.label}
                          <span>{t.count}</span>
                        </button>
                      ))}
                    </div>
                    <div className="filter-row">
                      <div className="filter-selects">
                        {admin && (
                          <label className="select-with-icon">
                            <Users size={14} />
                            <select
                              aria-label="Filtrar por herói"
                              value={owner}
                              onChange={(e) => setOwner(e.target.value)}
                            >
                              <option value="">Todos os heróis</option>
                              {users.map((u) => (
                                <option value={u.id} key={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={13} />
                          </label>
                        )}
                        <label className="select-with-icon sort-select">
                          <ArrowDownUp size={14} />
                          <select
                            aria-label="Ordenar projetos"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                          >
                            <option value="recent">Mais recentes</option>
                            <option value="due">Prazo mais próximo</option>
                            <option value="progress">Maior progresso</option>
                          </select>
                          <ChevronDown size={13} />
                        </label>
                      </div>
                      <div className="view-switch" aria-label="Visualização">
                        <button
                          className={view === 'grid' ? 'selected' : ''}
                          onClick={() => setView('grid')}
                          aria-label="Visualizar em cartões"
                          aria-pressed={view === 'grid'}
                        >
                          <LayoutGrid size={15} />
                        </button>
                        <button
                          className={view === 'list' ? 'selected' : ''}
                          onClick={() => setView('list')}
                          aria-label="Visualizar em lista"
                          aria-pressed={view === 'list'}
                        >
                          <List size={17} />
                        </button>
                      </div>
                    </div>
                    {visible.length ? (
                      view === 'grid' ? (
                        <div className="projects-grid">
                          {visible.map((p) => (
                            <ProjectCard
                              key={p.id}
                              project={p}
                              admin={admin}
                              onOpen={() => setDialog({ type: 'detail', project: p })}
                              onEdit={() => setDialog({ type: 'edit', project: p })}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="table-scroll">
                          <table className="project-table">
                            <thead>
                              <tr>
                                <th>Missão</th>
                                <th>Status</th>
                                <th>Responsável</th>
                                <th>Progresso</th>
                                <th>Prazo</th>
                                <th>
                                  <span className="sr-only">Abrir</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {visible.map((p) => (
                                <tr key={p.id}>
                                  <td>
                                    <button
                                      onClick={() => setDialog({ type: 'detail', project: p })}
                                    >
                                      <Emblem character={p.owner.character} small />
                                      <b>{p.name}</b>
                                    </button>
                                  </td>
                                  <td>
                                    <StatusBadge status={p.status} />
                                  </td>
                                  <td>
                                    <span className="table-owner">
                                      <Avatar user={p.owner} size="xs" />
                                      {p.owner.name}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="table-progress">
                                      <span>{p.progress}%</span>
                                      <Progress value={p.progress} label={false} />
                                    </div>
                                  </td>
                                  <td className={isOverdue(p) ? 'overdue' : ''}>
                                    {dueLabel(p.dueDate)}
                                  </td>
                                  <td>
                                    <button
                                      className="icon-button"
                                      aria-label={`Abrir ${p.name}`}
                                      onClick={() => setDialog({ type: 'detail', project: p })}
                                    >
                                      <ArrowUpRight size={17} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="empty-state">
                        <Search size={30} />
                        <h3>
                          {projects.length
                            ? 'Nenhuma missão por aqui.'
                            : 'O próximo grande feito pode ser seu.'}
                        </h3>
                        <p>
                          {projects.length
                            ? 'Tente outro nome ou ajuste os filtros para ampliar seu radar.'
                            : admin
                              ? 'Crie o primeiro projeto e dê um propósito aos seus superpoderes.'
                              : 'Quando uma missão for atribuída a você, ela aparecerá aqui.'}
                        </p>
                        {projects.length ? (
                          <button
                            className="button button-secondary"
                            onClick={() => {
                              setSearch('');
                              setStatus('');
                              setOwner('');
                            }}
                          >
                            Limpar filtros
                          </button>
                        ) : (
                          admin && (
                            <button
                              className="button button-primary"
                              onClick={() => setDialog({ type: 'create' })}
                            >
                              <Plus size={16} />
                              Criar primeiro projeto
                            </button>
                          )
                        )}
                      </div>
                    )}
                    <div className="results-footer">
                      <span>
                        Exibindo {visible.length} de {filtered.length}{' '}
                        {filtered.length === 1 ? 'projeto' : 'projetos'}
                      </span>
                      {page === 'overview' && filtered.length > 6 && (
                        <button className="text-button" onClick={() => setPage('projects')}>
                          Explorar mais
                          <ArrowRight size={14} />
                        </button>
                      )}
                      <span>
                        <span className="live-dot" />
                        Toda conquista conta.
                      </span>
                    </div>
                  </section>
                  {page === 'overview' && (
                    <aside className="insights-column">
                      <section className="values-panel">
                        <div className="panel-title">
                          <span className="insight-icon">
                            <Crosshair size={19} />
                          </span>
                          <h3>Nosso DNA em ação</h3>
                        </div>
                        <p>
                          Valores que dão superpoderes
                          <br />a cada entrega.
                        </p>
                        <div className="value-bars">
                          {valueStats.map((v, i) => (
                            <div key={v.key}>
                              <div>
                                <span>
                                  <span style={{ color: v.color }}>
                                    <ValueIcon index={i} size={14} />
                                  </span>
                                  {v.label}
                                </span>
                                <b>{v.percent}%</b>
                              </div>
                              <div className="mini-track">
                                <span style={{ width: `${v.percent}%`, background: v.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="panel-link" onClick={() => navigate('values')}>
                          Explore nossos valores
                          <ArrowUpRight size={15} />
                        </button>
                      </section>
                      <section className="team-panel">
                        <div className="panel-title">
                          <h3>
                            {admin ? 'Uma equipe.' : 'Seu impacto.'}
                            <span>{admin ? 'Infinitos poderes.' : 'Um passo de cada vez.'}</span>
                          </h3>
                          <span className="tiny-icon">
                            <Users size={18} />
                          </span>
                        </div>
                        {admin ? (
                          <>
                            <div className="avatar-stack">
                              {users.slice(0, 5).map((u) => (
                                <Avatar user={u} key={u.id} size="sm" />
                              ))}
                            </div>
                            <p>
                              <strong>
                                {users.length} {users.length === 1 ? 'herói' : 'heróis'}
                              </strong>{' '}
                              construindo o próximo
                              <br />
                              capítulo da HeroForce.
                            </p>
                            <button className="panel-link" onClick={() => navigate('heroes')}>
                              Conheça a equipe
                              <ArrowUpRight size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="impact-number">
                              {completeGoals}
                              <span>/{totalGoals}</span>
                            </div>
                            <p>
                              Metas concluídas nas suas missões.
                              <br />
                              Cada entrega move o mundo.
                            </p>
                          </>
                        )}
                      </section>
                      <div className="quote-panel">
                        <span>“</span>
                        <p>O extraordinário não acontece sozinho.</p>
                        <small>ESSE É O NOSSO SUPERPODER.</small>
                        <Sparkles size={25} />
                      </div>
                    </aside>
                  )}
                </div>
              )}
              {page === 'heroes' && admin && (
                <section className="roster-section">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Por trás da capa<span>{users.length}</span>
                      </h2>
                      <p>Talentos únicos. A mesma vontade de transformar.</p>
                    </div>
                    <span className="roster-summary">
                      <Users size={16} />
                      {users.filter((u) => u.role === 'admin').length} administradores
                    </span>
                  </div>
                  <div className="roster-grid">
                    {users
                      .filter((u) =>
                        `${u.name} ${u.character} ${u.email}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((u) => {
                        const missions = projects.filter((p) => p.ownerId === u.id);
                        return (
                          <article className="hero-card" key={u.id}>
                            <div className="hero-card-top">
                              <Emblem character={u.character} />
                              <span className={`role-badge ${u.role}`}>
                                {u.role === 'admin' ? 'Administrador' : 'Herói'}
                              </span>
                            </div>
                            <Avatar user={u} size="lg" />
                            <h3>{u.name}</h3>
                            <strong className="alter-ego">{u.character}</strong>
                            <p className="hero-email">{u.email}</p>
                            <div className="hero-card-stats">
                              <span>
                                <b>{missions.length}</b>Projetos
                              </span>
                              <span>
                                <b>{missions.filter((p) => p.status === 'concluido').length}</b>
                                Concluídos
                              </span>
                              <span>
                                <b>{missions.filter((p) => p.status === 'em_andamento').length}</b>
                                Em ação
                              </span>
                            </div>
                            <div className="hero-card-actions">
                              <button
                                className="text-button"
                                onClick={() => {
                                  setPage('projects');
                                  setOwner(u.id);
                                  setStatus('');
                                  setSearch('');
                                }}
                              >
                                Ver missões
                                <ArrowUpRight size={14} />
                              </button>
                              <button
                                className="text-button"
                                onClick={() => setDialog({ type: 'user', user: u })}
                              >
                                Editar
                              </button>
                              {u.id !== user.id && (
                                <button
                                  className="icon-button danger-icon"
                                  aria-label={`Remover ${u.name}`}
                                  onClick={() => askRemove({ type: 'user', item: u })}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                  </div>
                  {!users.some((u) =>
                    `${u.name} ${u.character} ${u.email}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <Users size={30} />
                      <h3>Nenhum herói encontrado.</h3>
                      <p>Tente outro nome, personagem ou e-mail.</p>
                      <button className="button button-secondary" onClick={() => setSearch('')}>
                        Limpar busca
                      </button>
                    </div>
                  )}
                </section>
              )}
              {page === 'values' && (
                <section className="values-page">
                  <div className="values-intro">
                    <span className="values-intro-icon">
                      <Crosshair size={32} />
                    </span>
                    <div>
                      <h2>
                        Mais que um jeito de trabalhar.
                        <br />
                        Um jeito de transformar.
                      </h2>
                      <p>
                        Nosso progresso é medido por entregas que refletem aquilo em que
                        acreditamos. Cada meta concluída fortalece o nosso DNA.
                      </p>
                    </div>
                    <div className="values-overall">
                      <strong>
                        {totalGoals ? Math.round((completeGoals / totalGoals) * 100) : 0}
                        <span>%</span>
                      </strong>
                      <small>das metas concluídas</small>
                    </div>
                  </div>
                  <div className="value-cards">
                    {valueStats.map((v, i) => (
                      <article key={v.key}>
                        <div className="value-card-head">
                          <span style={{ color: v.color, background: `${v.color}18` }}>
                            <ValueIcon index={i} size={25} />
                          </span>
                          <small>0{i + 1} / NOSSO DNA</small>
                        </div>
                        <h3>{v.label}</h3>
                        <p>{v.text}</p>
                        <div className="value-card-progress">
                          <b>
                            {v.done} de {v.total} metas concluídas
                          </b>
                          <strong>{v.percent}%</strong>
                        </div>
                        <div className="mini-track">
                          <span style={{ width: `${v.percent}%`, background: v.color }} />
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="values-footnote">
                    <ShieldCheck size={20} />
                    <p>
                      Os percentuais refletem as metas dos projetos que você pode visualizar. Cada
                      conclusão é um avanço real.
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
          <footer className="app-footer">
            <span>© {new Date().getFullYear()} HeroForce</span>
            <span>
              Feito de pessoas. Movido por propósito.
              <Zap size={12} />
            </span>
          </footer>
        </main>
      </div>
      {dialog?.type === 'create' && (
        <ProjectForm
          users={users}
          onClose={() => setDialog(null)}
          onSaved={changed}
          onDelete={(p) => askRemove({ type: 'project', item: p })}
        />
      )}
      {dialog?.type === 'edit' && (
        <ProjectForm
          project={dialog.project}
          users={users}
          onClose={() => setDialog(null)}
          onSaved={changed}
          onDelete={(p) => askRemove({ type: 'project', item: p })}
        />
      )}
      {dialog?.type === 'detail' && (
        <ProjectDetail
          project={dialog.project}
          admin={admin}
          onClose={() => setDialog(null)}
          onEdit={() => setDialog({ type: 'edit', project: dialog.project })}
        />
      )}
      {dialog?.type === 'user' && (
        <UserForm
          user={dialog.user}
          me={user}
          onClose={() => setDialog(null)}
          onSaved={userChanged}
        />
      )}
      {dialog?.type === 'help' && (
        <Modal
          title="Seu guia para grandes feitos."
          eyebrow="BEM-VINDO À CENTRAL"
          onClose={() => setDialog(null)}
        >
          <div className="guide-content">
            <p>
              A HeroForce transforma projetos em missões com responsáveis, prazos e metas claras.
            </p>
            <div>
              <FolderKanban />
              <span>
                <b>Organize as missões</b>Use a busca e os filtros por status e herói. Alterne entre
                cartões e lista para encontrar o que precisa.
              </span>
            </div>
            <div>
              <Target />
              <span>
                <b>Acompanhe o progresso</b>O percentual é calculado pelas metas concluídas. Todas
                as metas completas tornam a missão concluída.
              </span>
            </div>
            <div>
              <ShieldCheck />
              <span>
                <b>Cada perfil tem seu poder</b>Administradores gerenciam a equipe e os projetos.
                Heróis acompanham apenas as missões atribuídas a eles.
              </span>
            </div>
            <div>
              <Crosshair />
              <span>
                <b>Nosso DNA é nosso norte</b>Agilidade, encantamento, eficiência, excelência,
                transparência e ambição orientam cada entrega.
              </span>
            </div>
            {IS_DEMO && (
              <p className="guide-demo">
                Você está na demonstração. Para testar outro perfil, saia da conta e use os acessos
                disponíveis na tela de login. Os dados ficam apenas neste navegador.
              </p>
            )}
            <button className="button button-primary" onClick={() => setDialog(null)}>
              Pronto para fazer acontecer
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {remove && (
        <Modal
          title={remove.type === 'project' ? 'Excluir esta missão?' : 'Remover este herói?'}
          eyebrow="CONFIRMAÇÃO"
          onClose={() => !deleting && setRemove(null)}
        >
          <div className="confirm-content">
            <p>
              {remove.type === 'project' ? (
                <>
                  O projeto <strong>{remove.item.name}</strong> e suas metas serão excluídos. Esta
                  ação não pode ser desfeita.
                </>
              ) : (
                <>
                  O acesso de <strong>{remove.item.name}</strong> será removido. Antes, os projetos
                  dessa pessoa precisam ser reatribuídos ou excluídos.
                </>
              )}
            </p>
            {deleteError && (
              <div role="alert" className="form-error">
                {deleteError}
              </div>
            )}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                disabled={deleting}
                onClick={() => setRemove(null)}
              >
                Cancelar
              </button>
              <button className="button button-danger" disabled={deleting} onClick={confirmRemove}>
                <Trash2 size={16} />
                {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {feedback && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {feedback}
          <button onClick={() => setFeedback('')} aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
