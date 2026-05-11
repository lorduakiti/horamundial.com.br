# Globe 3D — Visualização WebGL do Globo Terrestre

Animação interativa do globo terrestre em WebGL com texturas reais da NASA, ciclo dia/noite ancorado ao tempo UTC, achatamento polar WGS84 e relógio de fuso horário em tempo real.

## Versão atual

[`index8.html`](index8.html) — globo elipsoidal com textura diurna (NASA Blue Marble) e noturna (NASA Black Marble), mistura suave dia/noite com terminator crepuscular, posição do sol calculada a partir do tempo UTC real.

## Histórico de versões

| Arquivo | Tipo | Descrição |
|---|---|---|
| [`index1.html`](index1.html) | Canvas 2D | Mapa plano equirretangular, scroll horizontal, linhas de fuso horário e relógio HUD |
| [`index2.html`](index2.html) | Canvas 2D | Globo com projeção ortográfica, clipping de hemisfério, campo de estrelas e atmosfera |
| [`index.html`](index.html) | WebGL | Globo procedural com biomas codificados no canal alpha, ciclo sazonal de vegetação |
| [`index3.html`](index3.html) | WebGL | Cópia byte-idêntica de `index.html` |
| [`index4.html`](index4.html) | WebGL | Substitui textura procedural por NASA Blue Marble base64 inline (single-file ~430 KB) |
| [`index5.html`](index5.html) | WebGL | Imagem alternativa 1080×1080 (redimensionada para 2048×1024 antes do embed) |
| [`index6.html`](index6.html) | WebGL | Imagem 2000×1000 NPOT embed; correção de espelhamento horizontal (X/Z + winding) |
| [`index7.html`](index7.html) | WebGL | Combina geometria corrigida de v6 com a imagem POT de v4 (base64) |
| **[`index8.html`](index8.html)** | **WebGL** | **Versão atual: textura externa, achatamento polar, mipmap + anisotropia, dia/noite UTC com Black Marble** |

Cada versão preserva as funcionalidades da anterior e adiciona refinamentos. Versões 1–7 ficam como histórico evolutivo.

## Tecnologias

- HTML5, CSS3, JavaScript (ES6+, IIFE, strict mode)
- WebGL 1.0 + GLSL (sem Three.js ou qualquer biblioteca externa)
- Canvas 2D (apenas para o fundo de estrelas)

## Funcionalidades de `index8.html`

- **Textura diurna**: NASA Blue Marble Next Generation 2048×1024 carregada de `earth.jpg`
- **Textura noturna**: NASA Black Marble (Earth at Night 2012) 2048×1024 carregada de `earth_night.jpg` — luzes urbanas visíveis no lado escuro
- **Mistura dia/noite ancorada ao UTC**: `Date.now()` calcula `subSolarLon = -((utcHours - 12) × 15)°`; o terminator fica anchorado à posição geográfica real do sol enquanto o globo gira visualmente
- **Terminator crepuscular**: transição suave de ±17° com tinta laranja-avermelhada (`vec3(1.0, 0.45, 0.18)`) na borda
- **Geometria elipsoidal**: achatamento polar WGS84 (`f = 1/298.257223563`) aplicado tanto à posição quanto à normal (gradiente do elipsoide), seguindo a Terra real
- **Esfera UV-mapeada**: 96 segmentos longitudinais × 48 latitudinais; convenção padrão Three.js/WebGL Earth (Greenwich em +Z, leste em +X)
- **Filtragem de textura otimizada**: mipmap completo + filtro trilinear `LINEAR_MIPMAP_LINEAR` + anisotropia até 8× via `EXT_texture_filter_anisotropic`
- **Iluminação composta**: difusa (lado dia) + Black Marble realçado (lado noite) + halo Fresnel atmosférico
- **Banda de fuso horário**: sobreposição âmbar pulsante sobre o meridiano local
- **Ciclo sazonal**: 1 minuto real = 1 ano simulado; calotas polares pulsam entre 55° (inverno local) e 65° (verão local)
- **Campo de estrelas**: 320 estrelas com translação horizontal direita→esquerda em ciclo de 5 minutos
- **Relógio HUD**: hora, data e fuso em português, atualizado a cada segundo
- **Câmera responsiva**: distância calculada dinamicamente para manter a esfera inteira visível em qualquer proporção de tela

## Como executar

Por causa de restrições de CORS para texturas externas, o HTML precisa ser servido por um servidor HTTP local — abrir via `file://` (duplo-clique) deixará o globo apenas com o placeholder porque o navegador bloqueia o load de imagens.

Opções:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# VS Code
extensão "Live Server"
```

Depois acessar `http://localhost:8000/index8.html`.

Versões 1–3 (puramente procedurais ou Canvas 2D) podem ser abertas via `file://` sem servidor.

## Configurações principais (index8.html)

| Constante | Valor | Descrição |
|---|---|---|
| `ROT_SPEED` | 0.000065625 rad/ms | Velocidade de rotação visual (~96 s/turno) |
| `AXIAL_TILT` | 0 | Inclinação do eixo Z aplicada ao model-view |
| `EARTH_FLATTENING` | 1/298.257223563 | Achatamento polar WGS84 (~0.335%) |
| `FOV_V` | 35° | Campo de visão vertical |
| `FIT_MARGIN` | 1.15 | Padding para a esfera nunca sair da tela |
| `STAR_COUNT` | 320 | Estrelas no campo de fundo |
| `STAR_PERIOD_MS` | 300 000 ms | Ciclo de translação das estrelas (5 min) |
| `YEAR_PERIOD_MS` | 60 000 ms | Duração de 1 ano simulado |

## Assets externos (index8.html)

| Arquivo | Tamanho | Origem |
|---|---|---|
| [`earth.jpg`](earth.jpg) | ~305 KB | NASA Blue Marble Next Generation 2048×1024, JPEG q=80 |
| [`earth_night.jpg`](earth_night.jpg) | ~146 KB | NASA Earth at Night 2012 (`dnb_land_ocean_ice.2012.3600x1800.jpg`) redimensionada para 2048×1024 |

Ambas em domínio público (NASA Visible Earth).
