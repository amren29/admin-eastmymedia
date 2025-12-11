export interface Billboard {
    id: string;
    code: string;
    name: string;
    location: string;
    region: string;
    latitude: number;
    longitude: number;
    price: number;
    priceMonthly: string;
    traffic: string;
    trafficDaily?: number;
    type: 'Digital' | 'Static' | 'LED' | 'VOOH' | 'LED Screen' | 'Roadside Bunting' | 'Car Wrap';
    size: string;
    width: number;
    height: number;
    unit?: string;
    image: string;
    available: boolean;
    availabilityStatus?: 'available' | 'booked' | 'tbc';
    featured?: boolean;
    // New fields synced with Admin Panel
    trafficProfile?: 'commuter' | 'retail' | 'highway' | 'tourist' | 'residential';
    skuId?: string;
    totalPanel?: number;
    gps?: string;
    landmark?: string;
    targetMarket?: string;
    resolution?: string;
    operatingTime?: string;
    durationPerAd?: string;
    noOfAdvertiser?: string;
    loopPerHr?: string;
    minLoopPerDay?: string;
    fileFormat?: string;
    description?: string;
    rentalRates?: {
        id: string;
        duration: string;
        rentalPrice: number;
        productionCost: number;
        sst: number;
        total: number;
        discount: number;
        rateType: string;
    }[];
}
