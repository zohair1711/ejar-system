import { supabase } from './supabase';
import { EjarClient } from './ejar';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'property_registration' | 'unit_registration' | 'contract_registration';

export class SyncEngine {
  /**
   * Process a single sync job
   */
  static async processJob(jobId: string) {
    const { data: job, error: fetchError } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error('Job not found:', jobId);
      return;
    }

    if (job.status === 'completed') return;

    try {
      // 1. Mark as processing
      await this.updateJobStatus(jobId, 'processing');

      // 2. Execute logic based on job type
      switch (job.job_type) {
        case 'property_registration':
          await this.handlePropertyRegistration(job);
          break;
        case 'unit_registration':
          await this.handleUnitRegistration(job);
          break;
        case 'contract_registration':
          await this.handleContractRegistration(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // 3. Mark as completed
      await this.updateJobStatus(jobId, 'completed');
    } catch (error: any) {
      console.error(`Job ${jobId} failed:`, error);
      await this.updateJobStatus(jobId, 'failed', error.message);
    }
  }

  private static async updateJobStatus(jobId: string, status: JobStatus, error?: string) {
    await supabase
      .from('sync_jobs')
      .update({
        status,
        last_error: error || null,
        updated_at: new Date().toISOString(),
        attempts: status === 'failed' ? { increment: 1 } : undefined // Hypothetical increment
      })
      .eq('id', jobId);
  }

  private static async handlePropertyRegistration(job: any) {
    const propertyId = job.entity_id;
    // 1. Fetch property data from DB
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (!property) throw new Error('Property not found in database');

    // 2. Call Ejar API (Placeholder for actual API call)
    // const ejarClient = new EjarClient({...});
    // const result = await ejarClient.createProperty(property);
    
    // 3. Update property with ejar_property_id
    // await supabase.from('properties').update({ ejar_property_id: result.id }).eq('id', propertyId);
    
    console.log('Simulating Ejar Property Registration for:', propertyId);
  }

  private static async handleUnitRegistration(job: any) {
    console.log('Simulating Ejar Unit Registration for job:', job.id);
  }

  private static async handleContractRegistration(job: any) {
    console.log('Simulating Ejar Contract Registration for job:', job.id);
  }
}
