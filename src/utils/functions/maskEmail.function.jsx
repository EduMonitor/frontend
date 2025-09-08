export const maskEmailCustom=(email) => {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');

  // Get domain extension (like .com, .org, .net)
  const extMatch = domain.match(/(\.[a-zA-Z]{2,})$/);
  const domainExt = extMatch ? extMatch[1] : '';

  // Mask local part: first letter + stars
  const maskedLocal = localPart[0] + '*'.repeat(Math.max(localPart.length - 1, 1));

  // Mask domain except extension with dots
  const domainMaskLength = Math.max(domain.length - domainExt.length, 1);
  const maskedDomain = '.'.repeat(domainMaskLength) + domainExt;

  return `${maskedLocal}@${maskedDomain}`;
}
