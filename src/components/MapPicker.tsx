"use client";

import { useState, useCallback, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X } from 'lucide-react';

interface MapPickerProps {
    initialLatitude?: number;
    initialLongitude?: number;
    onSelect: (lat: number, lng: number) => void;
    onClose: () => void;
}

export default function MapPicker({ initialLatitude, initialLongitude, onSelect, onClose }: MapPickerProps) {
    const [viewState, setViewState] = useState({
        latitude: initialLatitude || 5.9804, // Default to KK
        longitude: initialLongitude || 116.0753,
        zoom: 11
    });
    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
        initialLatitude && initialLongitude ? { lat: initialLatitude, lng: initialLongitude } : null
    );

    const handleMapClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
        const { lng, lat } = event.lngLat;
        setMarker({ lat, lng });
    }, []);

    const handleConfirm = () => {
        if (marker) {
            onSelect(marker.lat, marker.lng);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
                        <p className="text-sm text-gray-500">Click on the map to place a marker</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative">
                    {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                            <div className="text-center p-6 max-w-md">
                                <p className="text-red-600 font-medium mb-2">Mapbox Token Missing</p>
                                <p className="text-sm text-gray-500">Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file to use the map picker.</p>
                            </div>
                        </div>
                    ) : (
                        <Map
                            {...viewState}
                            onMove={evt => setViewState(evt.viewState)}
                            style={{ width: '100%', height: '100%' }}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                            onClick={handleMapClick}
                            cursor="crosshair"
                        >
                            <NavigationControl position="top-right" />
                            {marker && (
                                <Marker
                                    latitude={marker.lat}
                                    longitude={marker.lng}
                                    anchor="bottom"
                                    color="#0f766e" // teal-700
                                />
                            )}
                        </Map>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!marker}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
}
