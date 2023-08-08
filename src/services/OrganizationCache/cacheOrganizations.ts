import { InterfaceOrganization } from "../../models";
import OrganizationCache from "./OrganizationCache";

// Function to store organizations in the cache using pipelining
export async function cacheOrganizations(organizations:InterfaceOrganization[]) {
    const pipeline = OrganizationCache.pipeline();
    
    organizations.forEach(org => {
      const key = `organization:${org._id}`;
      pipeline.set(key,  JSON.stringify(org));
      // SET the time to live for each of the organization in the cache to 300s.
      pipeline.expire(key, 300)
    });
  
    // Execute the pipeline
    await pipeline.exec();
    

    console.log('Organizations cached successfully.');
  }