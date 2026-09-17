'use strict';

const PAGE_STYLE = `
:root {
  color-scheme: light dark;
  --novon-background: #fbfaf8;
  --novon-text: #292724;
  --novon-muted: #706c66;
  --novon-rule: #e6e2dc;
  --novon-link: #8a3b2f;
  --novon-link-hover: #64271f;
  --novon-code-background: #efede8;
  --novon-code-block: #292724;
  --novon-code-text: #f7f4ee;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.75;
}

@media (prefers-color-scheme: dark) {
  :root {
    --novon-background: #1b1a19;
    --novon-text: #f2eee8;
    --novon-muted: #b4aca2;
    --novon-rule: #45413c;
    --novon-link: #e2a095;
    --novon-link-hover: #f2b9af;
    --novon-code-background: #302e2b;
    --novon-code-block: #302e2b;
    --novon-code-text: #f2eee8;
  }
}

* {
  box-sizing: border-box;
}

html {
  background: var(--novon-background);
}

body {
  min-width: 0;
  margin: 0;
  overflow-x: hidden;
  background: var(--novon-background);
  color: var(--novon-text);
  font-size: 1rem;
}

button,
input,
textarea,
select {
  font: inherit;
}

::selection {
  background: var(--novon-link);
  color: var(--novon-background);
}

:focus-visible {
  outline: 2px solid var(--novon-link);
  outline-offset: 3px;
}

.novon-site {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.novon-header-inner,
.novon-main,
.novon-footer {
  width: calc(100% - 2rem);
  max-width: 44rem;
  margin-inline: auto;
}

.novon-header {
  padding: 1.5rem 0;
}

.novon-header-inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}

.novon-brand {
  flex: 0 0 auto;
  color: var(--novon-text);
  font-weight: 700;
  letter-spacing: -0.015em;
  text-decoration: none;
}

.novon-brand:hover {
  color: var(--novon-link);
}

.novon-nav {
  min-width: 0;
}

.novon-nav-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
}

.novon-nav-list a {
  overflow-wrap: anywhere;
  color: var(--novon-muted);
  text-decoration: none;
}

.novon-nav-list a:hover,
.novon-nav-list a[aria-current='page'] {
  color: var(--novon-link);
}

.novon-main {
  flex: 1 0 auto;
  padding: clamp(2.5rem, 8vw, 5.5rem) 0 clamp(3.5rem, 9vw, 6.5rem);
}

.novon-article {
  min-width: 0;
  overflow-wrap: anywhere;
}

.novon-article > :first-child {
  margin-top: 0;
}

.novon-article > :last-child {
  margin-bottom: 0;
}

.novon-article h1,
.novon-article h2,
.novon-article h3,
.novon-article h4,
.novon-article h5,
.novon-article h6 {
  margin: 2.75em 0 0.8em;
  color: var(--novon-text);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.novon-article h1 {
  font-size: clamp(2.1rem, 6vw, 3rem);
  letter-spacing: -0.035em;
}

.novon-article h2 {
  font-size: clamp(1.6rem, 4vw, 2rem);
}

.novon-article h3 {
  font-size: 1.35rem;
}

.novon-article p {
  margin: 1.25rem 0;
}

.novon-article a {
  color: var(--novon-link);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.16em;
}

.novon-article a:hover {
  color: var(--novon-link-hover);
}

.novon-article ul,
.novon-article ol {
  margin: 1.25rem 0;
  padding-inline-start: 1.5rem;
}

.novon-article li + li {
  margin-top: 0.45rem;
}

.novon-article blockquote {
  margin: 1.75rem 0;
  padding: 0.25rem 0 0.25rem 1.25rem;
  border-inline-start: 0.2rem solid var(--novon-link);
  color: var(--novon-muted);
}

.novon-article blockquote > :first-child {
  margin-top: 0;
}

.novon-article blockquote > :last-child {
  margin-bottom: 0;
}

.novon-article hr {
  margin: 2.75rem 0;
  border: 0;
  border-top: 1px solid var(--novon-rule);
}

.novon-article img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.75rem 0;
}

.novon-article code,
.novon-article pre {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}

.novon-article :not(pre) > code {
  padding: 0.12rem 0.35rem;
  border-radius: 0.25rem;
  background: var(--novon-code-background);
  font-size: 0.9em;
}

.novon-article pre {
  max-width: 100%;
  margin: 1.75rem 0;
  overflow-x: auto;
  padding: 1.1rem 1.2rem;
  border-radius: 0.45rem;
  background: var(--novon-code-block);
  color: var(--novon-code-text);
  line-height: 1.55;
  -webkit-overflow-scrolling: touch;
}

.novon-article pre code {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: 0.9em;
}

.novon-article table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.novon-article th,
.novon-article td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--novon-rule);
  text-align: left;
}

.novon-footer {
  padding-bottom: 1.5rem;
  color: var(--novon-muted);
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .novon-header-inner {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }

  .novon-nav-list {
    justify-content: flex-start;
  }

  .novon-main {
    padding-top: 2.5rem;
  }
}
`;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderThemePage(options = {}) {
  const {
    body = '',
    description = '',
    homeHref = '/',
    lang = 'en',
    navigation = [],
    pageTitle = 'novon',
    siteTitle = 'novon',
  } = options;

  const navigationItems = Array.isArray(navigation) ? navigation : [];
  const links = navigationItems
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const current = item.current ? ' aria-current="page"' : '';
      return `<li><a href="${escapeHtml(item.href ?? '#')}"${current}>${escapeHtml(item.label ?? '')}</a></li>`;
    })
    .join('\n');
  const descriptionTag = description
    ? `\n<meta name="description" content="${escapeHtml(description)}">`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)}</title>${descriptionTag}
<style>${PAGE_STYLE}</style>
</head>
<body>
<div class="novon-site">
<header class="novon-header">
<div class="novon-header-inner">
<a class="novon-brand" href="${escapeHtml(homeHref)}">${escapeHtml(siteTitle)}</a>
<nav class="novon-nav" aria-label="Pages"><ul class="novon-nav-list">${links}</ul></nav>
</div>
</header>
<main class="novon-main"><article class="novon-article">${body}</article></main>
<footer class="novon-footer">novon · ฅ^•ﻌ•^ฅ</footer>
</div>
</body>
</html>
`;
}

module.exports = {
  PAGE_STYLE,
  escapeHtml,
  renderThemePage,
};
