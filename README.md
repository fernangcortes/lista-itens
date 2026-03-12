# 🎬 Gerenciador de Pedidos de Produção

Um aplicativo web completo para criar, gerenciar e exportar listas de pedidos de produção audiovisual. Desenvolvido com React, Tailwind CSS e integrado com a Inteligência Artificial do Google Gemini.

## ✨ Funcionalidades

- **Múltiplas Listas:** Crie e gerencie diferentes listas de pedidos simultaneamente.
- **Histórico Inteligente:** Autocomplete baseado nos itens que você já cadastrou anteriormente.
- **Inteligência Artificial (Gemini):**
  - Geração automática de descrições técnicas e justificativas de compra (com controle de tamanho).
  - Geração de imagens ilustrativas para os produtos usando IA.
- **Busca Integrada:** Link direto para buscar imagens reais dos produtos no Google Imagens.
- **Upload de Imagens:** Adicione fotos reais dos produtos diretamente do seu dispositivo.
- **Personalização Visual (Temas):**
  - 5 presets de cores profissionais.
  - Customização total de cores (fundo, texto, destaque).
  - Escolha de tipografia (fontes e tamanhos) para títulos e descrições.
- **Exportação Perfeita:** Layout otimizado para impressão e exportação em PDF, mantendo as cores e fontes escolhidas.
- **Persistência Local:** Todos os dados são salvos automaticamente no seu navegador (LocalStorage).

## 🚀 Tecnologias Utilizadas

- [React 18](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai)

## 📱 Compartilhamento (WhatsApp e Redes Sociais)

O projeto já está configurado com as **Meta Tags (Open Graph)** no arquivo `index.html`. 
Quando você compartilhar o link do seu site no WhatsApp, Facebook ou Twitter, ele exibirá automaticamente:
- Um título formatado ("Pedido de Produção | Gerenciador").
- Uma descrição clara do aplicativo.
- Uma imagem de capa profissional (claquete de cinema).

*(Nota: Para que o preview do WhatsApp funcione, o site precisa estar publicado/hospedado em uma URL pública).*

---

## 🌐 Como fazer o Deploy no GitHub Pages

Sim, você consegue fazer o deploy deste projeto no GitHub Pages! Como este é um aplicativo SPA (Single Page Application) feito com Vite, o processo é bem simples.

### Passo 1: Exportar o Código
1. No Google AI Studio, clique no ícone de engrenagem (Configurações) ou no menu do projeto.
2. Escolha a opção **"Export to GitHub"** (se disponível) ou **"Download ZIP"**.
3. Se baixou o ZIP, extraia os arquivos no seu computador.

### Passo 2: Preparar o Repositório
1. Crie uma conta no [GitHub](https://github.com/) (se não tiver).
2. Crie um novo repositório público (ex: `pedido-de-producao`).
3. Envie os arquivos do projeto para este repositório.

### Passo 3: Configurar o Deploy Automático (GitHub Actions)
O Vite tem uma integração perfeita com o GitHub Pages.

1. No seu repositório do GitHub, vá na aba **Settings** > **Pages**.
2. Em **Source**, mude de "Deploy from a branch" para **"GitHub Actions"**.
3. O GitHub vai sugerir alguns fluxos de trabalho. Se ele não sugerir o do Vite, você pode criar um arquivo no seu projeto chamado `.github/workflows/deploy.yml` com o seguinte conteúdo:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### ⚠️ AVISO IMPORTANTE SOBRE A INTELIGÊNCIA ARTIFICIAL (API KEY)

**Do jeito que o código está agora**, a geração de IA (textos e imagens) depende do ambiente interno do Google AI Studio (`window.aistudio.openSelectKey()`). 

Se você hospedar no GitHub Pages, **o aplicativo vai abrir e funcionar perfeitamente** (criar listas, mudar cores, imprimir, fazer upload de fotos, buscar no Google), **MAS os botões de IA darão erro**, pois o site não saberá de onde puxar a chave da API fora do AI Studio.

**Como resolver isso para o GitHub Pages?**
Se quiser que a IA funcione no seu site público, você precisará editar o arquivo `src/App.tsx` para pedir a chave da API diretamente para o usuário através de um `prompt()` ou um campo de texto, e passar essa chave para o `GoogleGenAI({ apiKey: SUA_CHAVE })`. 

*Nunca coloque sua chave de API diretamente no código fonte do GitHub, pois outras pessoas poderão usá-la!*
