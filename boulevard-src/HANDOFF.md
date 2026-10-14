# Boulevard em 3D — passagem de projeto

Guia 3D **não oficial**, feito por morador, do condomínio Scire Boulevard (Pedra Branca, Palhoça/SC), para o grupo de moradores.

## Onde está
- Site: https://aue.productions/boulevard/ (Vercel, deploy automático a cada push na `main` do repo `BrunoMullerBrazil/Portfolio`)
- Link para o grupo: `aue.productions/boulevard/?v=2` (o `?v=` força prévia nova no WhatsApp)
- Página do apê decorado: `aue.productions/boulevard/b112/`
- Prévia de trabalho: artifact "Boulevard em 3D" no claude.ai

## Arquivos (neste repo)
- `boulevard-src/template.html`: página inteira (HTML+CSS+JS, three.js r128 via jsDelivr). Marcadores `__PLANS__` e `__FIT__`.
- `boulevard-src/plans.json`: 4 tipologias vetorizadas do book (paredes, contorno, rótulos, mobília).
- `boulevard-src/fit.json`: encaixe de cada planta (finais 01–12) na planta do pavimento.
- `boulevard-src/build.py`: gera `public/boulevard/index.html`. Rodar e dar push.
- `boulevard-src/og.jpg`: imagem de prévia (cópia em `public/boulevard/og.jpg`; versão referenciada `og.jpg?v=5`).
- `boulevard-src/b112-source.html`: modelo realista do apto B112 (base de `public/boulevard/b112/index.html`).

## Fatos confirmados
- 2 blocos, 288 aptos. Por bloco: 1º pav. lojas, 2º pav. área comum, aptos do 3º ao 14º pav., numerados 101 a 1212 (andar 1 = 3º pav.).
- **Bloco A** = lado das lojas; **Bloco B** = lado da piscina (confirmado pelo Bruno). Os blocos são espelhados.
- **Finais 02–07 = frente, avenida, sol da tarde (oeste)**, varandas grandes no centro (finais 04/05).
- **Finais 08–12 e 01 = fundos, lazer e morro, sol da manhã (leste)**. Bruno confirmou que o 1112 pega sol da manhã.
- A planta do book vem espelhada em relação à implantação. O código usa `FY=-1` em `pw()`. Base: render da pág. 8 do book, confirmado pela moradora do 1008.
- Tipologias: laranja 2 demi-suítes 53,19 m² (01/02); verde 1 suíte+1 dorm 53,76 m² (04/05); vermelho 1 suíte+1 dorm 57,71 m² (07/08); azul 2 dorms 47,75–48,55 m² (03,06,09–12).
- Obra: 76,16% (medição Caixa 06/10/2026). Cronograma Caixa: 100% em 27/12/2027. Contrato: jan/2027 + 180 dias. Contagem regressiva até 01/05/2027 (não oficial).

## O que existe na página
- Abertura cinematográfica: BOULEVARD grande, câmera orbitando no fim de tarde, frase curta, um botão e contagem regressiva.
- Busca por apê (ex.: B112), link direto `#B112`, botão de compartilhar.
- Painel do apê com planta em traço fino, área, sol, fachada e vista. A unidade abre em 3D por dentro (casa de bonecas).
- "Ver o andar por dentro" (corte) com barra flutuante ↑↓.
- Janelas com interior (shader), luz de dia/noite pela régua de horário, verão/inverno, nuvens, pássaros, trânsito.
- Entorno: avenida em curva, rotatória, mata, prédio vizinho, bairro no morro, morro de pedra.
- Abas: Obra (contagem, gráfico, previsões), Apartamentos, Lazer, Arredores, Sobre.
- Modo leve automático no celular (`?leve` / `?completo` para testar).
- Avisos de "não oficial · feito por morador · sem vínculo com a construtora" na página e na prévia.

## Pendências e ideias
- Interiores realistas no corte do andar inteiro (hoje: mobília genérica).
- À noite o interior do apê aberto fica escuro. Em alguns aptos com sacada, o guarda-corpo tapa parte da vista.
- Mata do morro ainda em "bolas". Ideia: textura de copa no próprio terreno.
- Atualizar a % da obra a cada nova medição da Caixa (array `SCHED` no template).
- Ideias: "Sol no meu apê", comparador de dois aptos, "Monte sua sala".
- Não fazer: reivindicar apê ou foto de morador (risco de segurança/LGPD).

## Preferências do Bruno
- Português, direto. Fonte sem serifa (não gostou da serifada). Hierarquia tipográfica clara.
- Visual cinematográfico, realista, elegante (referência: landing "Aurora Residence").
- Testar no celular, porque a maioria abre pelo WhatsApp.
