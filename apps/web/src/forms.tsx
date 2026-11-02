import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { api, IS_DEMO } from './api';
import { ThemeToggle } from './theme';
import {
  CHARACTERS,
  Goal,
  Project,
  ProjectInput,
  Role,
  STATUS,
  Status,
  User,
  UserInput,
  VALUES,
} from './domain';
import {
  Avatar,
  Emblem,
  Logo,
  Modal,
  Progress,
  StatusBadge,
  ValueIcon,
  MissionArt,
} from './components';

export function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [register, setRegister] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', character: CHARACTERS[0] });
  const change = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin(register ? await api.register(form) : await api.login(form.email, form.password));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <ThemeToggle className="standalone-theme-toggle" showLabel />
      <section className="auth-brand">
        <Logo />
        <div>
          <span className="eyebrow">PESSOAS EXTRAORDINÁRIAS. IMPACTO REAL.</span>
          <h1>
            Seu próximo
            <br />
            grande feito
            <br />
            começa aqui<span>.</span>
          </h1>
          <p>
            Junte seus superpoderes aos nossos.
            <br />O mundo precisa de boas ideias em ação.
          </p>
          <MissionArt />
        </div>
        <small>HeroForce © {new Date().getFullYear()} · Feito por heróis, para heróis.</small>
      </section>
      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <span className="mobile-brand">
            <Logo />
          </span>
          <span className="eyebrow">BEM-VINDO À HEROFORCE</span>
          <h2>{register ? 'Vista sua capa.' : 'Bom ter você de volta.'}</h2>
          <p className="muted">
            {register
              ? 'Crie sua conta e escolha quem representa seus poderes.'
              : 'Entre para acompanhar suas missões e fazer acontecer.'}
          </p>
          <div className="auth-tabs">
            <button
              className={!register ? 'selected' : ''}
              onClick={() => {
                setRegister(false);
                setError('');
              }}
            >
              Entrar
            </button>
            <button
              className={register ? 'selected' : ''}
              onClick={() => {
                setRegister(true);
                setError('');
              }}
            >
              Criar conta
            </button>
          </div>
          <form onSubmit={submit}>
            {register && (
              <label>
                Seu nome
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => change('name', e.target.value)}
                  placeholder="Como podemos chamar você?"
                />
              </label>
            )}
            <label>
              E-mail
              <input
                type="email"
                required
                maxLength={180}
                autoComplete="email"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </label>
            <label>
              Senha
              <div className="password-input">
                <input
                  required
                  type={show ? 'text' : 'password'}
                  minLength={register ? 8 : 1}
                  maxLength={72}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(e) => change('password', e.target.value)}
                  placeholder={register ? 'Pelo menos 8 caracteres' : 'Sua senha de acesso'}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {register && (
              <label>
                Seu alter ego
                <select
                  value={form.character}
                  onChange={(e) => change('character', e.target.value)}
                >
                  {CHARACTERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="button button-primary auth-submit" disabled={busy}>
              {busy
                ? 'Preparando sua missão…'
                : register
                  ? 'Criar minha conta'
                  : 'Entrar na central'}
              <ArrowRight size={17} />
            </button>
          </form>
          {IS_DEMO && (
            <div className="auth-demo">
              <strong>Explore a demonstração</strong>
              <p>
                Dados apenas neste navegador. Senha: <b>Hero@12345</b>
              </p>
              <div>
                <button
                  onClick={() => {
                    setRegister(false);
                    setForm({ ...form, email: 'admin@heroforce.dev', password: 'Hero@12345' });
                  }}
                >
                  Preencher admin
                </button>
                <button
                  onClick={() => {
                    setRegister(false);
                    setForm({ ...form, email: 'peter@heroforce.dev', password: 'Hero@12345' });
                  }}
                >
                  Preencher herói
                </button>
              </div>
            </div>
          )}
          <p className="auth-footnote">
            {register
              ? 'Seu cadastro terá acesso de herói. Cada grande equipe começa com uma pessoa.'
              : 'Agilidade para começar. Ambição para ir além.'}
          </p>
        </div>
      </section>
    </div>
  );
}

export function ProjectForm({
  project,
  users,
  onClose,
  onSaved,
  onDelete,
}: {
  project?: Project;
  users: User[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDelete: (project: Project) => void;
}) {
  const [form, setForm] = useState<ProjectInput>({
    name: project?.name ?? '',
    description: project?.description ?? '',
    ownerId: project?.ownerId ?? users.find((u) => u.role === 'hero')?.id ?? users[0]?.id ?? '',
    dueDate: project?.dueDate ?? null,
    goals:
      project?.goals.map((g) => ({ ...g })) ??
      VALUES.map((v) => ({ value: v.key, description: v.goal, completed: false })),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function goal(index: number, update: Partial<Goal>) {
    setForm((f) => ({
      ...f,
      status: undefined,
      goals: f.goals.map((g, i) => (i === index ? { ...g, ...update } : g)),
    }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.saveProject(form, project?.id);
      await onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={project ? 'Gerenciar missão' : 'Uma nova missão começa.'}
      eyebrow={project ? 'CENTRAL DE PROJETOS' : 'TRANSFORME AMBIÇÃO EM IMPACTO'}
      onClose={() => !busy && onClose()}
      wide
    >
      <form onSubmit={submit} className="project-form">
        <label>
          Nome do projeto
          <input
            autoFocus
            required
            minLength={3}
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Dê um nome ao próximo grande feito"
          />
        </label>
        <label>
          Descrição
          <textarea
            required
            minLength={10}
            maxLength={2000}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="O que queremos transformar com esta missão?"
          />
        </label>
        <div className="form-row">
          <label>
            Herói responsável
            <select
              required
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            >
              {users.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name} · {u.character}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prazo de entrega
            <input
              type="date"
              value={form.dueDate ?? ''}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })}
            />
          </label>
        </div>
        <label>
          Status da missão
          <select
            value={form.status ?? 'auto'}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value === 'auto' ? undefined : (e.target.value as Status),
              })
            }
          >
            <option value="auto">Atualizar a partir das metas</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option value={k} key={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <p className="field-help">
          Concluir a missão marca todas as metas. Voltar a pendente desmarca todas. Em andamento
          também permite iniciar uma missão sem metas concluídas.
        </p>
        <div className="section-label">
          <div>
            <h3>Metas com propósito</h3>
            <p>Defina entregas para os nossos seis valores.</p>
          </div>
          <span>
            {form.goals.filter((g) => g.completed).length}/{form.goals.length} concluídas
          </span>
        </div>
        <div className="goal-editor">
          {form.goals.map((g, index) => {
            const v = VALUES.find((v) => v.key === g.value)!;
            return (
              <div className="goal-editor-row" key={index}>
                <label className="goal-check">
                  <input
                    type="checkbox"
                    checked={g.completed}
                    onChange={(e) => goal(index, { completed: e.target.checked })}
                  />
                  <span className="custom-check">{g.completed && <Check size={13} />}</span>
                  <span style={{ color: v.color }}>{v.label}</span>
                </label>
                <input
                  aria-label={`Meta de ${v.label}`}
                  required
                  minLength={3}
                  maxLength={200}
                  value={g.description}
                  onChange={(e) => goal(index, { description: e.target.value })}
                />
              </div>
            );
          })}
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          {project && (
            <button
              className="button button-danger-quiet"
              type="button"
              disabled={busy}
              onClick={() => onDelete(project)}
            >
              <Trash2 size={16} />
              Excluir projeto
            </button>
          )}
          <div className="spacer" />
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="button button-primary" disabled={busy}>
            {project ? <Save size={16} /> : <Plus size={16} />}{' '}
            {busy ? 'Salvando…' : project ? 'Salvar alterações' : 'Criar projeto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ProjectDetail({
  project,
  admin,
  onEdit,
  onClose,
}: {
  project: Project;
  admin: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={project.name} eyebrow="DOSSIÊ DA MISSÃO" onClose={onClose} wide>
      <div className="detail-content">
        <div className="detail-top">
          <Emblem character={project.owner.character} />
          <StatusBadge status={project.status} />
        </div>
        <p className="detail-description">{project.description}</p>
        <div className="detail-owner">
          <Avatar user={project.owner} />
          <span>
            <strong>{project.owner.name}</strong>
            <small>{project.owner.character} · Responsável pela missão</small>
          </span>
        </div>
        <div className="detail-dates">
          <span>
            Prazo{' '}
            <b>
              {project.dueDate
                ? new Date(project.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')
                : 'Não definido'}
            </b>
          </span>
          <span>
            Criado em <b>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</b>
          </span>
        </div>
        <Progress value={project.progress} />
        <h3 className="detail-goals-title">Cada meta, um passo adiante.</h3>
        <div className="detail-goals">
          {project.goals.map((g, i) => {
            const index = VALUES.findIndex((v) => v.key === g.value);
            const v = VALUES[index];
            return (
              <div key={g.id ?? i} className={g.completed ? 'completed' : ''}>
                <span className="detail-goal-icon" style={{ color: v.color }}>
                  <ValueIcon index={index} />
                </span>
                <span>
                  <small>{v.label}</small>
                  <strong>{g.description}</strong>
                </span>
                <span className="goal-state">
                  {g.completed ? <Check size={17} /> : <span className="empty-check" />}
                </span>
              </div>
            );
          })}
        </div>
        <div className="modal-actions">
          <span className="field-help">
            {project.goals.filter((g) => g.completed).length} de {project.goals.length} metas
            concluídas
          </span>
          <div className="spacer" />
          {admin ? (
            <button className="button button-primary" onClick={onEdit}>
              Gerenciar missão
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="button button-secondary" onClick={onClose}>
              Fechar dossiê
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
export function UserForm({
  user,
  me,
  onClose,
  onSaved,
}: {
  user?: User;
  me: User;
  onClose: () => void;
  onSaved: (user: User) => Promise<void>;
}) {
  const own = user?.id === me.id;
  const [form, setForm] = useState<UserInput>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    character: user?.character ?? CHARACTERS[0],
    role: user?.role ?? 'hero',
    ...(!user ? { password: '' } : {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = user ? await api.updateUser(user.id, form, own) : await api.createUser(form);
      await onSaved(saved);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={own ? 'Seu perfil de herói' : user ? 'Editar herói' : 'Reforce a equipe.'}
      eyebrow="IDENTIDADE HEROICA"
      onClose={() => !busy && onClose()}
    >
      <form className="user-form" onSubmit={submit}>
        <label>
          Nome
          <input
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          E-mail
          <input
            required
            type="email"
            maxLength={180}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Alter ego
          <select
            value={form.character}
            onChange={(e) => setForm({ ...form, character: e.target.value })}
          >
            {CHARACTERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {!user && (
          <label>
            Senha inicial
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
        )}
        {!own && (
          <label>
            Nível de acesso
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="hero">Herói — visualiza seus projetos</option>
              <option value="admin">Administrador — gerencia toda a equipe</option>
            </select>
          </label>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button button-primary" disabled={busy}>
            <Save size={16} />
            {busy ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
