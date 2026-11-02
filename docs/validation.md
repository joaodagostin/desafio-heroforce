# Validação da entrega

Verificações realizadas nesta implementação:

| Verificação                                                      | Resultado              |
| ---------------------------------------------------------------- | ---------------------- |
| Compilação TypeScript da API NestJS                              | Aprovada               |
| Build de produção do React                                       | Aprovado               |
| Testes HTTP da API com TypeORM/pg-mem                            | 17 aprovados           |
| Mesma suíte HTTP com migrações em PostgreSQL via PGlite          | 17 aprovados           |
| Testes do domínio e adaptador demonstrativo no frontend          | 5 aprovados            |
| Interface em desktop                                             | Revisada no navegador  |
| Interface e formulário em viewport de 390 px                     | Revisados no navegador |
| Criar projeto, marcar meta, concluir e excluir na interface demo | Revisados no navegador |

PGlite executou o motor PostgreSQL 18.6 em WebAssembly por conexão PostgreSQL, incluindo `pgcrypto`, migração e regras de integridade. Isso complementa os testes rápidos com pg-mem, mas não valida o ambiente nativo PostgreSQL 16 definido no Compose.

Limites desta execução:

- Docker/Compose e PostgreSQL nativo 16 não estavam disponíveis para execução. O workflow de CI provisiona PostgreSQL 16 e aplica a migração real ao executar a suíte.
- A conexão do frontend com um servidor NestJS separado não pôde ser exercitada no navegador de prévia devido ao isolamento de rede entre os processos. A API foi testada por HTTP de ponta a ponta, e seus contratos são os utilizados pelo cliente React.
- A prévia publicada é exclusivamente o modo demonstrativo do frontend. O backend completo é entregue no código e no ambiente Docker.
- O workflow de GitHub Actions só será executado depois que o repositório for publicado no GitHub.
