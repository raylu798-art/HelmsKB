// Display text only. Never apply to user content, API payloads or executable source.
export function brandProse(input, brand, { attribution = true } = {}) {
  if (typeof input !== 'string') return input;
  const protectedParts = [];
  const keep = value => `\uE000${protectedParts.push(value) - 1}\uE001`;
  let text = input.replace(/https?:\/\/[^\s<>"'`]+|`+[^`\n]*`+/g, keep);
  if (attribution && /Tencent|腾讯|copyright|版权所有/i.test(text)) return input;
  for (const name of brand.protectedNames) text = text.split(name).join(keep(name));
  text = text.replace(/(?<![A-Za-z0-9_-])WeKnora(?![A-Za-z0-9_-])/g, brand.name);
  return text.replace(/\uE000(\d+)\uE001/g, (_, i) => protectedParts[Number(i)]);
}

export function brandMessages(messages, brand) {
  if (typeof messages === 'string') return brandProse(messages, brand);
  if (Array.isArray(messages)) return messages.map(value => brandMessages(value, brand));
  if (messages && typeof messages === 'object') return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [key, brandMessages(value, brand)]),
  );
  return messages;
}
