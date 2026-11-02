# HeroForce ⚡

Um portal para transformar projetos em missões: responsáveis claros, metas ligadas aos seis valores da equipe e progresso calculado a partir de entregas reais.

**NestJS 11 · React 19 · TypeScript · TypeORM · PostgreSQL 16 · Docker**

## O que está implementado

- Cadastro de heróis, escolha de personagem, login e logout com JWT em cookie HttpOnly.
- Dois perfis: **herói** acompanha seus projetos; **admin** gerencia projetos e equipe.
- CRUD completo de projetos e usuários na API, com validação de payloads e autorização no servidor.
- Dashboard com indicadores, busca, filtros por status/responsável, ordenação e visualização em cartões ou lista.
- Metas por **agilidade, encantamento, eficiência, excelência, transparência e ambição**.
- Criação, edição, reatribuição, conclusão e exclusão de projetos, com confirmação na interface.
- Gestão da equipe, edição do próprio perfil, prazos e radar de projetos atrasados.
- Layout responsivo, navegação por teclado e modais com Escape e controle de foco.
- Temas claro e escuro, com alternador no cabeçalho e no login e preferência salva no navegador.
- Swagger, migração versionada, seed idempotente, testes e workflow de CI com PostgreSQL.

O administrador demonstrativo usa o **Homem de Ferro**: um personagem que combina construção, iteração e tecnologia para resolver problemas.

## Executar com Docker

Pré-requisito: Docker Engine ou Docker Desktop com Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

No PowerShell, substitua a primeira linha por `Copy-Item .env.example .env`.

| Serviço            | Endereço                         |
| ------------------ | -------------------------------- |
| Aplicação completa | http://localhost:8080            |
| API                | http://localhost:3000/api        |
| Swagger            | http://localhost:8080/api/docs   |
| Health check       | http://localhost:3000/api/health |

O Compose aguarda a saúde do banco, executa a migração na inicialização e popula uma base vazia com dados demonstrativos. Os dados ficam em um volume persistente. O seed não altera uma base que já possui usuários.

### Acessos de desenvolvimento

| Perfil        | E-mail              | Senha      |
| ------------- | ------------------- | ---------- |
| Administrador | admin@heroforce.dev | Hero@12345 |
| Herói         | peter@heroforce.dev | Hero@12345 |
| Heroína       | diana@heroforce.dev | Hero@12345 |

São credenciais públicas para a demonstração local. Cadastros pela tela de registro recebem sempre o papel `hero`.

Para parar, preservando os dados:

```bash
docker compose down
```

Para reiniciar uma demonstração do zero, `docker compose down -v` remove o volume e todos os seus dados.

## Desenvolvimento local

Pré-requisitos: Node.js 22 ou superior, npm e PostgreSQL 16. É possível iniciar apenas o banco com Docker:

```bash
cp .env.example .env
npm ci
docker compose up -d db
```

Em dois terminais, na raiz do projeto:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Abra http://localhost:5173. O Vite encaminha `/api` para o NestJS em `localhost:3000`. A API lê o `.env` da raiz; o frontend usa o proxy por padrão. O modo de desenvolvimento da API compila TypeScript com metadados de decorators e reinicia o processo ao alterar os fontes.

Para um PostgreSQL já instalado, configure `DATABASE_URL` no `.env` e dispense o comando que inicia o serviço `db`.

```bash
npm run build        # compila API e frontend conectado à API real
npm test             # testes de API e frontend
npm run format:check # verifica a formatação
npm run seed         # popula uma base vazia, somente fora de produção
```

### Prévia independente da interface

```bash
npm ci
npm run dev:demo
```

Esse modo usa um adaptador demonstrativo, identificado na interface, e salva os dados somente no navegador. Ele inicia com um perfil de administrador. Saia da conta para testar login, registro ou o perfil de herói.

`npm run dev` também abre essa prévia, por compatibilidade com o ambiente de visualização. Para desenvolver a aplicação completa, use os comandos `dev:api` e `dev:web` acima.

| Modo                                              | Persistência                        | Autenticação                                |
| ------------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| Aplicação completa (`dev:web` / Docker / `build`) | PostgreSQL via API NestJS           | JWT validado no servidor                    |
| Demonstração (`dev:demo` / `build:demo`)          | localStorage, isolado por navegador | Simulação local, sem garantias de segurança |

A demonstração não é um deploy do backend. A aplicação completa nunca passa automaticamente para dados locais em caso de falha de rede.

## Regras de negócio

1. **Visibilidade:** administradores consultam todos os projetos; heróis consultam exclusivamente os seus, tanto na lista quanto no detalhe. Filtros não ampliam esse acesso.
2. **Progresso:** `round(metas concluídas / total de metas × 100)`. Uma missão com todas as metas concluídas recebe status `concluido`; com parte delas concluídas, `em_andamento`.
3. **Status manual:** concluir marca todas as metas; retornar a pendente desmarca todas; iniciar uma missão permite `em_andamento` mesmo com 0%. Ao editar metas, o status é recalculado.
4. **Responsável:** deve existir. Reatribuir um projeto muda imediatamente quais heróis conseguem visualizá-lo.
5. **Integridade:** excluir um projeto exclui suas metas. Um usuário com projetos não pode ser excluído até que eles sejam reatribuídos ou removidos.
6. **Administração:** um admin não pode excluir a própria conta nem alterar o próprio nível de acesso. Usuários públicos não podem escolher privilégios no cadastro.
7. **Metas:** a interface sugere uma meta para cada valor; a API aceita de 1 a 24 metas categorizadas nos seis valores.

## Arquitetura

| Caminho                       | Responsabilidade                                           |
| ----------------------------- | ---------------------------------------------------------- |
| `apps/api/src/auth`           | Login, cadastro, sessão JWT e guards globais               |
| `apps/api/src/users`          | Usuários, perfis e proteção de vínculos                    |
| `apps/api/src/projects`       | Projetos, metas e cálculo de progresso                     |
| `apps/api/src/database`       | Configuração, migração, seed e criação de admin            |
| `apps/api/src/common`         | Regras do domínio, validação global e Swagger              |
| `apps/web/src/App.tsx`        | Sessão, navegação, dashboard e estados da aplicação        |
| `apps/web/src/forms.tsx`      | Login, registro, perfil, formulários e detalhe de projetos |
| `apps/web/src/components.tsx` | Componentes visuais e modal acessível                      |
| `apps/web/src/api.ts`         | Cliente HTTP com cookies e tratamento de sessão expirada   |
| `apps/web/src/demo.ts`        | Adaptador isolado para demonstração                        |
| `apps/web/src/domain.ts`      | Tipos, valores, filtros e funções puras                    |
| `.github/workflows/ci.yml`    | Build e testes contra PostgreSQL 16                        |

Os módulos NestJS separam controllers, DTOs, serviços e entidades. A autorização é aplicada pelos guards e reforçada nas regras de acesso aos projetos. O banco usa migrações, com `synchronize: false`.

## API

Documentação interativa em `/api/docs`; OpenAPI JSON em `/api/docs-json`. No Swagger, execute `POST /api/auth/login` antes das rotas protegidas: o navegador enviará o cookie da sessão.

| Método                | Endpoint                               | Acesso                        |
| --------------------- | -------------------------------------- | ----------------------------- |
| POST                  | `/api/auth/register`                   | Público; cria herói           |
| POST                  | `/api/auth/login`                      | Público                       |
| POST                  | `/api/auth/logout`                     | Público; limpa cookie         |
| GET                   | `/api/auth/me`                         | Autenticado                   |
| PATCH                 | `/api/users/me`                        | Próprio perfil                |
| GET / POST            | `/api/users`                           | Admin                         |
| GET / PATCH / DELETE  | `/api/users/:id`                       | Admin                         |
| GET                   | `/api/projects`                        | Admin: todos; herói: próprios |
| GET                   | `/api/projects/:id`                    | Admin ou responsável          |
| POST / PATCH / DELETE | `/api/projects` ou `/api/projects/:id` | Admin                         |
| GET                   | `/api/health`                          | Público; verifica o banco     |

Filtros de listagem: `?status=em_andamento&ownerId=<uuid>&search=protocolo`.

Status aceitos: `pendente`, `em_andamento`, `concluido`.

Exemplo de criação autenticada:

```json
{
  "name": "Protocolo Vingadores",
  "description": "Unificar a comunicação da equipe e reduzir o tempo de resposta.",
  "ownerId": "UUID_DE_UM_USUARIO_EXISTENTE",
  "dueDate": "2026-12-20",
  "goals": [
    {
      "value": "agilidade",
      "description": "Entregar a primeira versão no prazo",
      "completed": false
    }
  ]
}
```

Erros relevantes: `400` dados inválidos, `401` sessão ausente/expirada, `403` sem privilégio, `404` recurso inexistente ou inacessível, `409` e-mail duplicado ou vínculo impeditivo, `429` limite de requisições.

## Testes

```bash
npm test
```

Sem configuração extra, a suíte HTTP da API utiliza **pg-mem com TypeORM**, além de JWT real, bcrypt, ValidationPipe e guards. Isso acelera a execução local, mas não substitui PostgreSQL nativo.

Para executar a mesma suíte contra um PostgreSQL descartável:

```bash
TEST_DATABASE_URL=postgresql://usuario:senha@localhost:5432/heroforce_test npm test -w @heroforce/api
```

**O banco de teste deve terminar em `_test` e será recriado.** Nunca informe uma base com dados que você precisa preservar. A suíte executa a migração real nessa modalidade. O workflow de CI já provisiona PostgreSQL 16 para isso.

Os testes cobrem autenticação, cookies, bloqueio de promoção de privilégios, validação de metas, isolamento entre heróis, filtros, reatribuição, progresso, limpeza de metas, exclusões e atualização de perfil. O frontend testa busca e filtros combinados, cálculo de progresso e as permissões do adaptador demonstrativo.

## Deploy e configuração

A stack Docker pode ser hospedada em um servidor com Compose e proxy HTTPS. Frontend e API devem preferencialmente compartilhar o mesmo domínio, encaminhando `/api` para o backend, como no Nginx incluído.

Para produção:

- Gere um `JWT_SECRET` aleatório com pelo menos 32 caracteres; use credenciais próprias no banco.
- Configure `NODE_ENV=production`, `SEED_DEMO=false`, `COOKIE_SECURE=true` e `FRONTEND_URL` com a origem HTTPS exata.
- Use `DB_SSL=true` quando seu PostgreSQL exigir TLS com certificado válido. No Compose local, a conexão interna ao banco é sem TLS.
- Não use as senhas demonstrativas. Provisione o primeiro administrador explicitamente.

A API recusa iniciar com segredo JWT ausente/curto. O seed demonstrativo recusa execução em produção. As senhas são armazenadas com bcrypt; hashes não são selecionados nas consultas de usuários. Sessões duram 8 horas; não há refresh token ou recuperação de senha neste escopo. Login e cadastro possuem limite de tentativas.

Para criar um admin fora do seed, defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mínimo 12 caracteres), e opcionalmente `ADMIN_NAME` e `ADMIN_CHARACTER` no ambiente ou no `.env` local e execute:

```bash
npm run admin:create
```

Em uma imagem já compilada, execute `node apps/api/dist/database/create-admin.js` com essas mesmas variáveis de ambiente. O comando também aplica migrações pendentes e não imprime a senha.

Para hospedar apenas a interface contra uma API externa, defina `VITE_API_URL` **antes do build**. Variáveis `VITE_*` são públicas; nunca coloque segredos nelas. Configurações de CORS e cookies devem corresponder à origem escolhida.

### Prévia online

[HeroForce — prévia da interface](https://heroforce-mission-control-rosso.joaopvmn.chatgpt.site)

A prévia online usa dados demonstrativos e acesso privado do proprietário. O backend NestJS/PostgreSQL é executado pelas instruções acima; a prévia não deve ser apresentada como deploy público da aplicação completa.

## Referências

- [Autenticação no NestJS](https://docs.nestjs.com/security/authentication)
- [TypeORM](https://typeorm.io/)
- [React](https://react.dev/)
- [Variáveis de ambiente no Vite](https://vite.dev/guide/env-and-mode)
