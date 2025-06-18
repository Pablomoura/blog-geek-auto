"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otimizarImagensHtml = otimizarImagensHtml;
// src/utils/otimizarImagensHtml.ts
function otimizarImagensHtml(html) {
    return html.replace(/<img(?![^>]*\bloading=)([^>]*)>/g, "<img loading=\"lazy\"$1>");
}
