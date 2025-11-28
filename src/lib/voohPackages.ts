export interface VOOHPackage {
    id: string;
    name: string;
    carCount: string;
    coverage: string;
    duration: string;
    estimatedImpressions: string;
    price: string;
    description: string;
    trafficLevel: 'low' | 'moderate' | 'high' | 'very-high';
}

export const VOOH_PACKAGES: VOOHPackage[] = [
    {
        id: 'vooh-1',
        name: 'Starter Package',
        carCount: '5 Cars',
        coverage: 'City Center Routes',
        duration: '1 Month',
        estimatedImpressions: '50,000+',
        price: 'RM 2,500',
        description: 'Perfect for small businesses targeting city center traffic',
        trafficLevel: 'moderate'
    },
    {
        id: 'vooh-2',
        name: 'Business Package',
        carCount: '10 Cars',
        coverage: 'Major Routes',
        duration: '1 Month',
        estimatedImpressions: '120,000+',
        price: 'RM 4,800',
        description: 'Ideal for medium businesses with wider reach requirements',
        trafficLevel: 'high'
    },
    {
        id: 'vooh-3',
        name: 'Premium Package',
        carCount: '20 Cars',
        coverage: 'All High-Traffic Areas',
        duration: '1 Month',
        estimatedImpressions: '280,000+',
        price: 'RM 9,200',
        description: 'Maximum visibility across all major traffic zones',
        trafficLevel: 'very-high'
    },
    {
        id: 'vooh-4',
        name: 'Express Package',
        carCount: '8 Cars',
        coverage: 'Express Routes',
        duration: '2 Weeks',
        estimatedImpressions: '80,000+',
        price: 'RM 3,200',
        description: 'Short-term campaign for events and promotions',
        trafficLevel: 'high'
    },
    {
        id: 'vooh-5',
        name: 'Enterprise Package',
        carCount: '30+ Cars',
        coverage: 'Full City Coverage',
        duration: '3 Months',
        estimatedImpressions: '1,000,000+',
        price: 'RM 25,000',
        description: 'Comprehensive coverage for major brand campaigns',
        trafficLevel: 'very-high'
    }
];

export function getVOOHPackage(id: string): VOOHPackage | undefined {
    return VOOH_PACKAGES.find(pkg => pkg.id === id);
}
