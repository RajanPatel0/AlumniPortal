import { prisma } from './prisma';

interface ResolvedLocationResult {
  locationId: string | null;
  city?: string | null;
  state?: string | null;
  countryCode?: string | null;
  country?: string | null;
}

export async function resolveLocation(
  country: string,
  pincode: string,
  state?: string,
  city?: string
): Promise<ResolvedLocationResult> {
  const normalizedCountry = country.trim();
  let normalizedPincode = (pincode || '').trim();

  // If pincode is missing but city is present, generate a virtual pincode key
  if (!normalizedPincode && city?.trim()) {
    normalizedPincode = `CITY:${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  const emptyResult = { locationId: null, city: null, state: null, countryCode: null, country: null };

  if (!normalizedCountry || !normalizedPincode) return emptyResult;

  // Check existing cache
  const existing = await prisma.pincodeLocation.findUnique({
    where: {
      country_pincode: {
        country: normalizedCountry,
        pincode: normalizedPincode,
      },
    },
  });

  if (existing) {
    if (existing.status === 'NOT_FOUND') {
      // Check if the record is older than 24 hours before retrying geocoding
      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
      const age = Date.now() - new Date(existing.updatedAt).getTime();
      if (age > staleThreshold) {
        await prisma.pincodeLocation.delete({
          where: { id: existing.id },
        });
      } else {
        return emptyResult;
      }
    } else {
      return {
        locationId: existing.id,
        city: existing.city,
        state: existing.state,
        countryCode: existing.countryCode,
        country: existing.country,
      };
    }
  }

  // Call Nominatim
  try {
    const queryParts: string[] = [];
    if (!normalizedPincode.startsWith('CITY:')) {
      queryParts.push(normalizedPincode);
    }
    if (city?.trim()) queryParts.push(city.trim());
    if (state?.trim()) queryParts.push(state.trim());
    queryParts.push(normalizedCountry);
    
    const query = encodeURIComponent(queryParts.join(', '));
    // Request addressdetails=1 to extract city/state/countryCode details
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${query}&limit=1`;

    let response = await fetch(url, {
      headers: {
        'User-Agent': 'PTU-Alumni-Portal/1.0 (alumni-map-service@ptu.ac.in)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.statusText}`);
    }

    let results = await response.json();

    // Fallback: If detailed search fails, query using only pincode and country (or city and country if no pincode)
    if (!results || results.length === 0) {
      const fallbackQueryParts: string[] = [];
      if (!normalizedPincode.startsWith('CITY:')) {
        fallbackQueryParts.push(normalizedPincode);
      } else if (city?.trim()) {
        fallbackQueryParts.push(city.trim());
      }
      fallbackQueryParts.push(normalizedCountry);
      
      const fallbackQuery = encodeURIComponent(fallbackQueryParts.join(', '));
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${fallbackQuery}&limit=1`;
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'PTU-Alumni-Portal/1.0 (alumni-map-service@ptu.ac.in)',
        },
      });

      if (fallbackResponse.ok) {
        results = await fallbackResponse.json();
      }
    }

    if (results && results.length > 0) {
      const match = results[0];
      const lat = parseFloat(match.lat);
      const lon = parseFloat(match.lon);
      const displayName = match.display_name;

      // Extract details from address details response
      const addr = match.address || {};
      const resolvedCity = addr.city || addr.town || addr.village || addr.suburb || addr.county || city || null;
      const resolvedState = addr.state || state || null;
      const resolvedCountryCode = addr.country_code ? addr.country_code.toUpperCase() : null;

      // Save successful geocode
      const created = await prisma.pincodeLocation.create({
        data: {
          country: normalizedCountry,
          pincode: normalizedPincode,
          city: resolvedCity,
          state: resolvedState,
          countryCode: resolvedCountryCode,
          displayName,
          latitude: lat,
          longitude: lon,
          status: 'FOUND',
          lastVerifiedAt: new Date(),
        },
      });

      return {
        locationId: created.id,
        city: created.city,
        state: created.state,
        countryCode: created.countryCode,
        country: created.country,
      };
    } else {
      // Cache as not found
      await prisma.pincodeLocation.create({
        data: {
          country: normalizedCountry,
          pincode: normalizedPincode,
          city: city || null,
          state: state || null,
          latitude: null,
          longitude: null,
          status: 'NOT_FOUND',
          lastVerifiedAt: new Date(),
        },
      });
      return emptyResult;
    }
  } catch (error) {
    console.error('[GEOCODING_ERROR]', error);
    return emptyResult;
  }
}
