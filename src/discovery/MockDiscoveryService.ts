import type { DiscoveryService } from "./DiscoveryService";
import type { TitleAvailability } from "../peacock/types";
import {
  getRecommendationsData,
  getWhereToWatchData,
  searchAcrossServicesData,
} from "../data/catalog";

/**
 * In-memory, provider-neutral discovery backed by the simulated multi-provider
 * catalog fixtures. Holds no account state and never references PeacockService.
 */
export class MockDiscoveryService implements DiscoveryService {
  async searchAcrossServices(query: string): Promise<TitleAvailability[]> {
    return searchAcrossServicesData(query);
  }

  async getWhereToWatch(contentId: string): Promise<TitleAvailability> {
    const t = getWhereToWatchData(contentId);
    if (!t) throw new Error(`Unknown title: ${contentId}`);
    return t;
  }

  async getRecommendations(genre?: string): Promise<TitleAvailability[]> {
    return getRecommendationsData(genre);
  }
}

export const mockDiscoveryService = new MockDiscoveryService();
