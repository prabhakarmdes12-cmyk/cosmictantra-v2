/**
 * Smart Upaya Recommendation Engine
 * Suggests remedies based on the seeker's chart + question
 */

export interface UpayaRecommendation {
  type: 'Gemstone' | 'Rudraksha' | 'Pooja' | 'Mantra';
  name: string;
  reason: string;
  priceRange: string;
  priority: 'High' | 'Medium' | 'Low';
}

export function getSmartUpayaRecommendations(
  lagna: string,
  moonNakshatra: string,
  currentDasha: string,
  question: string
): UpayaRecommendation[] {
  
  const recommendations: UpayaRecommendation[] = [];
  const q = question.toLowerCase();

  // Career / Business
  if (q.includes('business') || q.includes('career') || q.includes('job')) {
    recommendations.push({
      type: 'Gemstone',
      name: 'Blue Sapphire (Neelam) 4-5 carat',
      reason: 'Strengthens Saturn for career stability and delayed success',
      priceRange: '₹15,000 – ₹28,000',
      priority: 'High'
    });
    recommendations.push({
      type: 'Rudraksha',
      name: '14 Mukhi Rudraksha',
      reason: 'Removes obstacles and brings clarity in decision making',
      priceRange: '₹4,500 – ₹8,000',
      priority: 'High'
    });
  }

  // Marriage / Relationship
  if (q.includes('marriage') || q.includes('relationship') || q.includes('wife') || q.includes('husband')) {
    recommendations.push({
      type: 'Gemstone',
      name: 'Diamond (Heera) or White Sapphire',
      reason: 'Strengthens Venus for harmony in relationships',
      priceRange: '₹12,000 – ₹35,000',
      priority: 'High'
    });
    recommendations.push({
      type: 'Pooja',
      name: 'Mangal Shanti / Vivah Muhurat Pooja',
      reason: 'Reduces Mangal Dosha and improves marital timing',
      priceRange: '₹6,000 – ₹15,000',
      priority: 'Medium'
    });
  }

  // Health / Mental Peace
  if (q.includes('health') || q.includes('stress') || q.includes('anxiety') || q.includes('peace')) {
    recommendations.push({
      type: 'Rudraksha',
      name: '5 Mukhi Rudraksha',
      reason: 'Brings mental peace and reduces anxiety',
      priceRange: '₹800 – ₹2,500',
      priority: 'High'
    });
    recommendations.push({
      type: 'Pooja',
      name: 'Mahamrityunjaya Anusthan',
      reason: 'Protects health and brings longevity',
      priceRange: '₹5,000 – ₹12,000',
      priority: 'Medium'
    });
  }

  // Default / General
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'Gemstone',
      name: 'Yellow Sapphire (Pukhraj)',
      reason: 'Strengthens Jupiter for wisdom and growth',
      priceRange: '₹8,000 – ₹22,000',
      priority: 'Medium'
    });
  }

  return recommendations.slice(0, 3); // Return top 3
}
