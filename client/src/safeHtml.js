const allowedTags = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CAPTION', 'CODE', 'DIV', 'EM', 'FONT', 'H1', 'H2',
    'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG',
    'SUB', 'SUP', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL'
]);
const droppedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SVG', 'MATH']);
const allowedStyleProperties = new Set([
    'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'font-family',
    'text-align', 'text-decoration', 'margin', 'margin-left', 'margin-right', 'padding',
    'border', 'border-color', 'border-width', 'border-style', 'width', 'max-width'
]);

function safeUrl(value) {
    const trimmed = value.trim();
    if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
    return null;
}

function cleanNode(node, outputDocument) {
    if (node.nodeType === Node.TEXT_NODE) return outputDocument.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return outputDocument.createDocumentFragment();
    if (droppedTags.has(node.tagName)) return outputDocument.createDocumentFragment();
    if (!allowedTags.has(node.tagName)) {
        const fragment = outputDocument.createDocumentFragment();
        for (const child of node.childNodes) fragment.append(cleanNode(child, outputDocument));
        return fragment;
    }

    const clean = outputDocument.createElement(node.tagName.toLowerCase());
    for (const attribute of node.attributes) {
        const name = attribute.name.toLowerCase();
        if (name === 'href' && node.tagName === 'A') {
            const url = safeUrl(attribute.value);
            if (url) clean.setAttribute('href', url);
        } else if (name === 'style') {
            const declarations = attribute.value.split(';').flatMap((part) => {
                const separator = part.indexOf(':');
                if (separator < 0) return [];
                const property = part.slice(0, separator).trim().toLowerCase();
                const value = part.slice(separator + 1).trim();
                if (!allowedStyleProperties.has(property) || /url\s*\(|expression|[<>]/i.test(value)) return [];
                return [`${property}: ${value}`];
            });
            if (declarations.length) clean.setAttribute('style', declarations.join('; '));
        } else if (['title', 'alt', 'colspan', 'rowspan', 'width', 'height'].includes(name)) {
            clean.setAttribute(name, attribute.value);
        }
    }
    if (clean.tagName === 'A' && clean.hasAttribute('href')) clean.setAttribute('rel', 'noopener noreferrer');
    for (const child of node.childNodes) clean.append(cleanNode(child, outputDocument));
    return clean;
}

export function sanitizeHtml(value = '') {
    const parsed = new DOMParser().parseFromString(String(value), 'text/html');
    const cleanDocument = document.implementation.createHTMLDocument('');
    const container = cleanDocument.createElement('div');
    for (const child of parsed.body.childNodes) container.append(cleanNode(child, cleanDocument));
    return container.innerHTML;
}
