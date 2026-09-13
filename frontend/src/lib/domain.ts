export function getCookieDomain(hostname: string | undefined | null) {
  if (!hostname) return undefined;
  
  // Remove port if exists
  const host = hostname.split(':')[0];
  
  if (host === 'localhost' || host.endsWith('.localhost')) {
    // Browsers reject domain=.localhost and domain=localhost
    // We will use host-only cookies and pass session tokens via URL for SSO
    return undefined;
  }
  
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  
  // If a root domain is configured and the current host belongs to it,
  // we can safely set the cookie on the root domain (e.g. .kitapay.com)
  if (rootDomain && host.endsWith(rootDomain)) {
    return `.${rootDomain}`;
  }
  
  // For all other cases (Vercel, Netlify, Railway, or no root domain configured),
  // return undefined to use host-only cookies. This prevents issues with public suffixes.
  return undefined;
  
  return host;
}
