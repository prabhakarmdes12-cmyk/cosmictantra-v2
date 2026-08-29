import { test, expect } from '@playwright/test';
import { resolveBirthPlace } from '../src/lib/location';
import { searchCities } from '../src/lib/cities';

test.describe('Real-World Location Resolution Audit Suite', () => {

  const testCases = [
    { label: 'Indian Metro', query: 'Mumbai' },
    { label: 'Small Jharkhand Town', query: 'Jhumri Telaiya' },
    { label: 'Small Jharkhand Town (Suburb)', query: 'Govindpur' },
    { label: 'Obscure Indian Village', query: 'McCluskieganj' },
    { label: 'Obscure Village (Dumka)', query: 'Maluti' },
    { label: 'Duplicate Locality Name (UP vs Bihar)', query: 'Rampur' },
    { label: 'Duplicate Locality Name (MH vs Bihar)', query: 'Aurangabad' },
    { label: 'Varanasi', query: 'Varanasi' },
    { label: 'Kathmandu', query: 'Kathmandu' },
    { label: 'London', query: 'London' },
    { label: 'New York', query: 'New York' },
    { label: 'Sydney', query: 'Sydney' }
  ];

  for (const tc of testCases) {
    test(`Location Query: ${tc.label} ("${tc.query}")`, () => {
      const resolved = resolveBirthPlace(tc.query);
      const searchMatches = searchCities(tc.query);
      
      console.log(`[Location Audit] Query: "${tc.query}" -> Resolved: "${resolved.displayName}" | Lat: ${resolved.latitude}°N, Lng: ${resolved.longitude}°E | TZ: ${resolved.timezoneAtBirth} (${resolved.timezoneId}) | Source: ${resolved.source} | DB Matches: ${searchMatches.length}`);
      
      expect(resolved).toBeDefined();
      expect(resolved.latitude).toBeDefined();
      expect(resolved.longitude).toBeDefined();
      expect(typeof resolved.timezoneAtBirth).toBe('number');
    });
  }

});
