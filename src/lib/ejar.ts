/**
 * Ejar ECRS API Client
 * Handles communication with Ejar External Contract Registration Service
 */

const EJAR_API_URL = 'https://integration-gw.housingapps.sa/nhc/prod/v1/ejar/ecrs';

export interface EjarConfig {
  clientId: string;
  clientSecret: string;
  officeId: string; // The ejar_office_id from the offices table
}

export class EjarClient {
  private config: EjarConfig;
  private accessToken: string | null = null;

  constructor(config: EjarConfig) {
    this.config = config;
  }

  /**
   * Get an access token for ECRS API (OAuth2)
   * This should be called before other requests
   */
  async authenticate(): Promise<string> {
    // In production, this would hit the Ejar Auth endpoint
    // and handle token caching/refreshing
    // For now, this is a placeholder for the integration logic
    console.log('Authenticating with Ejar for Client ID:', this.config.clientId);
    
    // Placeholder logic for getting token
    this.accessToken = 'mock-ejar-token';
    return this.accessToken;
  }

  /**
   * Generic request handler with automatic logging to ejar_api_logs
   */
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    body?: any,
    contractId?: string
  ) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const url = `${EJAR_API_URL}/${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      // 1. Log the request attempt (simplified here, in reality would use supabase client)
      console.log(`[Ejar API Request] ${method} ${url}`, body);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json();

      // 2. Log the response to the database (placeholder for actual DB log)
      // This matches the schema in public.ejar_api_logs
      // await supabase.from('ejar_api_logs').insert([...])

      if (!response.ok) {
        throw new Error(`Ejar API Error: ${responseData.error?.message || response.statusText}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('[Ejar API Error]', error);
      throw error;
    }
  }

  /**
   * Property Management
   */
  async createProperty(propertyData: any) {
    return this.request('properties', 'POST', propertyData);
  }

  async getProperties() {
    return this.request('properties', 'GET');
  }

  /**
   * Unit Management
   */
  async createUnit(propertyId: string, unitData: any) {
    return this.request(`properties/${propertyId}/units`, 'POST', unitData);
  }

  /**
   * Contract Management
   */
  async createContract(contractData: any) {
    return this.request('contracts', 'POST', contractData);
  }

  async submitContract(contractId: string) {
    return this.request(`contracts/${contractId}/submit`, 'POST');
  }
}

/**
 * Singleton instance helper for using the client in the app
 */
export const getEjarClient = (config: EjarConfig) => {
  return new EjarClient(config);
};
