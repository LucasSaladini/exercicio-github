# 📦 Changelog

## [v0.2.0] - 2025-11-01
### 🚀 Novidades
- Adicionada a funcionalidade de **avaliação de pedidos**, permitindo que o cliente avalie seu pedido após a entrega.
- Inclusão de **formulário de avaliação (`ReviewForm`)** integrado ao Supabase.
- Exibição de **lista de avaliações da loja (`ReviewList`)** com informações agregadas.
- Atualizações em tempo real com o Supabase via **Postgres Changes**.

### 🧩 Infraestrutura e Banco de Dados
- Criada a tabela `orders_reviews` e a view `reviews_with_order_info`.
- Implementadas políticas **RLS (Row Level Security)**.
- Adicionados índices e constraints para evitar avaliações duplicadas.

### 💅 Interface e Experiência
- Página de acompanhamento de pedido agora exibe:
  - Status animado e atualizado em tempo real.
  - Itens e detalhes do pedido.
  - Seção para envio e visualização de avaliações.
- Feedbacks visuais com **toasts de sucesso e erro**.

### 🧪 Testes
- Testes manuais cobrindo fluxo completo:
  - Acompanhamento → Avaliação → Persistência → Exibição global.
- Validação de regras RLS.

---
