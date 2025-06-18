// src/utils/otimizarImagensHtml.ts
export function otimizarImagensHtml(html: string): string {
  return html.replace(
    /<img(?![^>]*\bloading=)([^>]*)>/g,
    '<img loading="lazy"$1>'
  );
}
  