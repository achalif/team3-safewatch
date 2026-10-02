import { getDistance } from "geolib";

/**
 * Interface that defines the shape of the returned boundary box
 */
interface BoundingBox {
    minLat: number, // Southern box boundary
    minLng: number, // Western box boundary
    maxLat: number, // Northern box boundary
    maxLng: number, // Eastern box boundary
}

/**
 * Helper: Converts a user's GPS position and mile radius into 4 bounding box coordinates.
 * 
 */
export function calculateBoundingBox(lat: number, lng: number, radiusMiles: number): BoundingBox {
    // 1. Calculate degrees of latitude (69 miles per degree everywhere on Earth)
    const latDelta : number = radiusMiles / 69.0;
    
    // 2. Convert latitude from degrees to radians for Math.cos()
    const latInRadians : number = (lat * Math.PI) / 180.0;
    
    // 3. Calculate degrees of longitude (adjusting for Earth's curvature in NY)
    const lngDelta : number = radiusMiles / (69.0 * Math.cos(latInRadians));

    // 4. Return the 4 outer search box boundaries (uses BoundingBox interface) 
    return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
    }
}