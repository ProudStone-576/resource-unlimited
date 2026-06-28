export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Resources Unlimited',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  tagline: 'Premium Printing & Packaging Design.',
  description:
    'Resources Unlimited delivers premium printing and packaging design — from custom branded boxes and labels to business stationery, flyers, and large-format signage.',
  contactEmail: 'info@resourcesunlimited.in',
  contactPhone: '+91 98765 43210',
  address: {
    line1: 'SCO 123, Sector 17',
    city: 'Chandigarh',
    province: 'Punjab',
    postalCode: '160017',
    country: 'India',
  },
  socials: {
    linkedin: 'https://www.linkedin.com/',
  },
  nav: [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
} as const;
