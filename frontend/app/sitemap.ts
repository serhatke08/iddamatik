import { MetadataRoute } from 'next'

const baseUrl = 'https://iddamatik.vercel.app'

const staticPages: MetadataRoute.Sitemap = [
  { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${baseUrl}/odds`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
  { url: `${baseUrl}/analysis-robot`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${baseUrl}/stats`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.65 },
  { url: `${baseUrl}/nasil-calisir`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
  { url: `${baseUrl}/hakkimizda`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
  { url: `${baseUrl}/gizlilik-politikasi`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  { url: `${baseUrl}/iletisim`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.55 },
  { url: `${baseUrl}/rehber`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.88 },
  { url: `${baseUrl}/rehber/iddaa-nedir`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${baseUrl}/rehber/oran-nasil-belirlenir`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${baseUrl}/rehber/iddaa-analiz`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.92 },
  { url: `${baseUrl}/rehber/iddaa-oran-analiz`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.92 },
  { url: `${baseUrl}/rehber/iddaa-istatistik`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${baseUrl}/rehber/iddaa-analiz-programi`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${baseUrl}/rehber/iddaa-analiz-sitesi`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${baseUrl}/rehber/iddaa-analiz-nasil-yapilir`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.92 },
  { url: `${baseUrl}/rehber/iddaa-mac-analiz`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPages
}
