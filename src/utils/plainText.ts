// Texto plano para copiar: sin símbolos de markdown (#, **, *, `, |, ---).
export function markdownToPlainText(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !/^\s*\|?\s*:?-{3,}/.test(line))
    .map((line) => line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^\|\s*|\s*\|$/g, '')
      .replace(/\s*\|\s*/g, '  ·  ')
      .replace(/^- /, '• ')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*\s][^*]*)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}
