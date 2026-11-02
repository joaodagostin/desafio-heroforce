import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowUpRight, Check, CheckCircle2, Circle, Shield, X, Zap } from 'lucide-react';
import { dueLabel, initials, isOverdue, Project, STATUS, User, VALUES } from './domain';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Zap size={23} fill="currentColor" strokeWidth={1.3} />
      </span>
      {!compact && (
        <span>
          Hero<span className="logo-light">Force</span>
          <i>®</i>
        </span>
      )}
    </div>
  );
}
export function Avatar({ user, size = 'md' }: { user: User; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const colors: Record<string, string> = {
    'Homem-Aranha': 'rose',
    'Homem de Ferro': 'amber',
    'Mulher-Maravilha': 'blue',
    Batman: 'slate',
    'Pantera Negra': 'violet',
    'Doutor Estranho': 'green',
    'Capitã Marvel': 'amber',
    'Capitão América': 'blue',
  };
  return (
    <span
      className={`avatar avatar-${size} ${colors[user.character] ?? 'green'}`}
      title={`${user.name} · ${user.character}`}
    >
      {initials(user.name)}
    </span>
  );
}
export function Emblem({ character = '', small = false }: { character?: string; small?: boolean }) {
  const type = character.includes('Aranha')
    ? 'spider'
    : character.includes('Maravilha') || character.includes('América')
      ? 'star'
      : character.includes('Batman')
        ? 'bat'
        : character.includes('Pantera')
          ? 'panther'
          : 'bolt';
  return (
    <span className={`emblem emblem-${type} ${small ? 'emblem-small' : ''}`}>
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        {type === 'spider' ? (
          <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <ellipse cx="24" cy="26" rx="4" ry="7" fill="currentColor" />
            <circle cx="24" cy="17" r="3" fill="currentColor" />
            <path d="m20 20-7-6-3-6m18 12 7-6 3-6M20 24l-9-3-4-6m21 9 9-3 4-6M20 28l-9 3-3 8m20-11 9 3 3 8M21 32l-4 5 1 7m9-12 4 5-1 7" />
          </g>
        ) : type === 'star' ? (
          <path d="m24 8 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="currentColor" />
        ) : type === 'bat' ? (
          <path d="m5 12 9 6 6-7 2 8h4l2-8 6 7 9-6-4 16-8 1-7 10-7-10-8-1z" fill="currentColor" />
        ) : type === 'panther' ? (
          <>
            <path d="m9 8 10 6h10L39 8l-4 23-11 9-11-9z" stroke="currentColor" strokeWidth="2.5" />
            <path d="m15 23 7 3m11-3-7 3m-6 6h8" stroke="currentColor" strokeWidth="2.5" />
          </>
        ) : (
          <path d="M27 6 12 27h12l-3 15 16-23H25z" fill="currentColor" />
        )}
      </svg>
    </span>
  );
}
export function StatusBadge({ status }: { status: Project['status'] }) {
  return (
    <span className={`status-badge ${status}`}>
      <span />
      {STATUS[status].label}
    </span>
  );
}
export function Progress({ value, label = true }: { value: number; label?: boolean }) {
  return (
    <div className="project-progress">
      {label && (
        <div>
          <span>Progresso da missão</span>
          <strong>{value}%</strong>
        </div>
      )}
      <div
        className={`progress-track ${value === 100 ? 'is-complete' : ''}`}
        role="progressbar"
        aria-label="Conclusão do projeto"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const nodes = [
          ...ref.current!.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
          ),
        ];
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      prev?.focus();
    };
  }, []);
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="modal-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id={id}>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar janela">
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function MissionArt() {
  return (
    <div className="mission-art" aria-hidden="true">
      <svg viewBox="0 0 400 240">
        <defs>
          <linearGradient id="shield-shade" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#344c3d" />
            <stop offset="1" stopColor="#172e27" />
          </linearGradient>
        </defs>
        <g stroke="#9cae81" fill="none" opacity=".6">
          <ellipse cx="205" cy="124" rx="153" ry="66" transform="rotate(-22 205 124)" />
          <ellipse cx="205" cy="124" rx="155" ry="67" transform="rotate(35 205 124)" />
          <circle cx="205" cy="124" r="93" strokeDasharray="2 8" />
        </g>
        <path
          d="M205 29 273 53v71c0 45-41 74-68 87-27-13-68-42-68-87V53z"
          fill="#91b64d"
          transform="translate(9 4)"
        />
        <path
          d="M205 29 273 53v71c0 45-41 74-68 87-27-13-68-42-68-87V53z"
          fill="url(#shield-shade)"
        />
        <path
          d="m205 44 55 19v59c0 35-28 60-55 74-27-14-55-39-55-74V63z"
          fill="none"
          stroke="#78935a"
        />
        <path d="m214 68-42 61h30l-7 42 44-65h-31z" fill="#d0f28c" />
        <g fill="#f8ffe8" stroke="#a5ba81">
          <rect x="72" y="60" width="48" height="48" rx="15" transform="rotate(-12 72 60)" />
          <rect x="302" y="139" width="44" height="44" rx="14" transform="rotate(12 302 139)" />
        </g>
        <path
          d="m90 79 6 5 10-15m208 92 7-6 5 8 7-12"
          stroke="#49603c"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <g fill="#6b8b48">
          <circle cx="295" cy="64" r="5" />
          <circle cx="103" cy="166" r="4" />
          <circle cx="337" cy="105" r="3" />
          <path d="M128 31h12m-6-6v12M278 202h12m-6-6v12" stroke="#6b8b48" strokeWidth="1.5" />
        </g>
      </svg>
      <span className="art-tag">
        <span className="live-dot" />
        Impacto em movimento
      </span>
    </div>
  );
}
export function ProjectCard({
  project,
  onOpen,
  onEdit,
  admin,
}: {
  project: Project;
  onOpen: () => void;
  onEdit: () => void;
  admin: boolean;
}) {
  const values = VALUES.filter((v) => project.goals.some((g) => g.value === v.key));
  return (
    <article className="project-card">
      <div className="card-top">
        <Emblem character={project.owner.character} />
        <StatusBadge status={project.status} />
      </div>
      <button className="project-title-button" onClick={onOpen}>
        <h3>{project.name}</h3>
        <ArrowUpRight size={18} />
      </button>
      <p className="project-description">{project.description}</p>
      <div className="value-tags">
        {values.slice(0, 2).map((v) => (
          <span key={v.key}>
            <i style={{ background: v.color }} />
            {v.label}
          </span>
        ))}
        {values.length > 2 && (
          <span
            className="more-values"
            title={values
              .slice(2)
              .map((v) => v.label)
              .join(', ')}
          >
            +{values.length - 2}
          </span>
        )}
      </div>
      <Progress value={project.progress} />
      <div className="card-footer">
        <button className="owner-chip" onClick={onOpen}>
          <Avatar user={project.owner} size="sm" />
          <span>
            <b>{project.owner.name}</b>
            <small>{project.owner.character}</small>
          </span>
        </button>
        <span
          className={`due-date ${isOverdue(project) ? 'overdue' : ''}`}
          title={isOverdue(project) ? 'Prazo vencido' : 'Prazo da missão'}
        >
          {project.status === 'concluido' ? <CheckCircle2 size={13} /> : <Circle size={12} />}{' '}
          {dueLabel(project.dueDate)}
        </span>
      </div>
      {admin && (
        <button className="card-edit" onClick={onEdit}>
          Gerenciar missão <ArrowUpRight size={13} />
        </button>
      )}
    </article>
  );
}
export function ValueIcon({ index, size = 18 }: { index: number; size?: number }) {
  return index === 0 ? (
    <Zap size={size} />
  ) : index === 3 ? (
    <Shield size={size} />
  ) : index === 4 ? (
    <Check size={size} />
  ) : (
    <span className="value-glyph" style={{ fontSize: size }}>
      {['', '✧', '◎', '', '', '↗'][index]}
    </span>
  );
}
