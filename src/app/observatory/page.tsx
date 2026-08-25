import type { Metadata } from 'next';
import ObservatoryExperience from '@/components/observatory/ObservatoryExperience';
export const metadata: Metadata = { title: 'CosmicTantra Observatory', description: 'Inspectable astronomical and Lahiri sidereal instrument.' };
export default function ObservatoryPage() { return <ObservatoryExperience />; }
