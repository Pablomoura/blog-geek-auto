// src/utils/otimizarImagensHtml.ts
export function otimizarImagensHtml(html: string): string {
    return html.replace(/<img(?![^>]*loading=["']?lazy["']?)([^>]*)>/g, `<img loading="lazy"$1>`);
  }
  