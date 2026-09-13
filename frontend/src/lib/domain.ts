export function getCookieDomain(hostname: string | undefined | null) {
  if (!hostname) return undefined;
  
  // Remove port if exists
  const host = hostname.split(':')[0];
  
  if (host === 'localhost' || host.endsWith('.localhost')) {
    // Browsers reject domain=.localhost and domain=localhost
    // We will use host-only cookies and pass session tokens via URL for SSO
    return undefined;
  }
  
  if (host.endsWith('.netlify.app') || host.endsWith('.railway.app') || host.endsWith('.vercel.app')) {
    // These are public suffixes. Browsers will reject cookies set on .netlify.app
    return undefined;
  }

  const parts = host.split('.');
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  
  return host;
}
