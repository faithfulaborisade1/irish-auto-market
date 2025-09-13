import type { Metadata } from 'next';

// Irish counties mapping
const COUNTY_MAPPING: Record<string, string> = {
  'dublin': 'Dublin',
  'cork': 'Cork',
  'galway': 'Galway',
  'mayo': 'Mayo',
  'donegal': 'Donegal',
  'kerry': 'Kerry',
  'tipperary': 'Tipperary',
  'clare': 'Clare',
  'tyrone': 'Tyrone',
  'antrim': 'Antrim',
  'limerick': 'Limerick',
  'roscommon': 'Roscommon',
  'down': 'Down',
  'wexford': 'Wexford',
  'meath': 'Meath',
  'londonderry': 'Londonderry',
  'kilkenny': 'Kilkenny',
  'wicklow': 'Wicklow',
  'offaly': 'Offaly',
  'cavan': 'Cavan',
  'waterford': 'Waterford',
  'westmeath': 'Westmeath',
  'sligo': 'Sligo',
  'laois': 'Laois',
  'kildare': 'Kildare',
  'fermanagh': 'Fermanagh',
  'leitrim': 'Leitrim',
  'armagh': 'Armagh',
  'monaghan': 'Monaghan',
  'longford': 'Longford',
  'carlow': 'Carlow',
  'louth': 'Louth'
};

interface Props {
  params: { county: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const county = params.county.toLowerCase();
  const countyFormatted = COUNTY_MAPPING[county] || county;

  if (!COUNTY_MAPPING[county]) {
    return {
      title: 'County Not Found | Irish Auto Market',
      description: 'The requested county was not found. Browse all cars available on Irish Auto Market.',
    };
  }

  const title = `Cars for Sale in ${countyFormatted} - Used Cars ${countyFormatted} | Irish Auto Market`;
  const description = `Find quality used cars for sale in ${countyFormatted}, Ireland. Browse hundreds of listings from trusted dealers and private sellers. Best prices guaranteed.`;

  return {
    title,
    description,
    keywords: [
      `cars for sale ${countyFormatted}`,
      `used cars ${countyFormatted}`,
      `${countyFormatted} cars`,
      `car dealers ${countyFormatted}`,
      `automobiles ${countyFormatted}`,
      `second hand cars ${countyFormatted}`,
      `${countyFormatted} car sales`,
      'Ireland used cars',
      'Irish car market'
    ],
    openGraph: {
      title,
      description,
      url: `${process.env.APP_URL || 'https://irishautomarket.ie'}/location/${county}`,
      siteName: 'Irish Auto Market',
      locale: 'en_IE',
      type: 'website',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Cars for Sale in ${countyFormatted} - Irish Auto Market`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
    alternates: {
      canonical: `${process.env.APP_URL || 'https://irishautomarket.ie'}/location/${county}`
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'geo.region': 'IE',
      'geo.placename': `${countyFormatted}, Ireland`,
      'ICBM': getCountyCoordinates(county),
    }
  };
}

// Helper function to get approximate county coordinates for geo meta tags
function getCountyCoordinates(county: string): string {
  const coordinates: Record<string, string> = {
    'dublin': '53.3498,-6.2603',
    'cork': '51.8985,-8.4756',
    'galway': '53.2707,-9.0568',
    'mayo': '53.8541,-9.2966',
    'donegal': '54.6559,-8.1109',
    'kerry': '52.1663,-9.7014',
    'tipperary': '52.4736,-7.9815',
    'clare': '52.8454,-8.9868',
    'limerick': '52.6638,-8.6267',
    'waterford': '52.2593,-7.1101',
    'wicklow': '52.9808,-6.0433',
    'meath': '53.6558,-6.6511',
    'kildare': '53.1639,-6.9111',
    'wexford': '52.3369,-6.4633',
    'kilkenny': '52.6541,-7.2448',
    'offaly': '53.2356,-7.4912',
    'laois': '53.0344,-7.2996',
    'carlow': '52.8408,-6.9326',
    'longford': '53.7237,-7.7956',
    'westmeath': '53.5392,-7.3428',
    'louth': '53.8370,-6.4034',
    'monaghan': '54.2494,-6.9683',
    'cavan': '53.9909,-7.3609',
    'roscommon': '53.6279,-8.1951',
    'sligo': '54.2766,-8.4761',
    'leitrim': '54.0236,-7.8902',
    // Northern Ireland counties
    'antrim': '54.7639,-6.0344',
    'armagh': '54.3499,-6.6546',
    'down': '54.3294,-5.8380',
    'fermanagh': '54.4571,-7.6328',
    'londonderry': '54.9966,-7.3086',
    'tyrone': '54.6059,-7.3086'
  };

  return coordinates[county] || '53.1424,-7.6921'; // Center of Ireland as fallback
}

export default function CountyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}