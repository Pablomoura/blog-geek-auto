// src/utils/inserirAnunciosNoTexto.ts

export function inserirAnunciosNoTexto(texto: string): string {
    const blocoAdsenseInArticle = `
      <div class="my-8">
        <ins class="adsbygoogle"
             style="display:block; text-align:center;"
             data-ad-layout="in-article"
             data-ad-format="fluid"
             data-ad-client="ca-pub-9111051074987830"
             data-ad-slot="3489300787"></ins>
      </div>
    `;
  
    const paragrafos = texto.split("</p>");
    const paragrafosComAds: string[] = [];
    let anunciosInseridos = 0;
  
    paragrafos.forEach((paragrafo, index) => {
      if (paragrafo.trim()) {
        paragrafosComAds.push(paragrafo);
  
        // A cada 3 parágrafos, até 3 anúncios
        if ((index + 1) % 3 === 0 && anunciosInseridos < 3) {
          paragrafosComAds.push(blocoAdsenseInArticle);
          anunciosInseridos++;
        }
      }
    });
  
    let textoFinal = paragrafosComAds.join("</p>");
  
    // Anúncio após <ul>, se ainda houver espaço
    if (anunciosInseridos < 3 && textoFinal.includes("</ul>")) {
      textoFinal = textoFinal.replace(
        "</ul>",
        `</ul>${blocoAdsenseInArticle}`
      );
      anunciosInseridos++;
    }
  
    return textoFinal;
  }
  