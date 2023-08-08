import { ObjectId } from "mongoose";
import OrganizationCache from "./OrganizationCache";

export async function findOrganizationsInCache(ids:string[]) {
    const keys:string[] = ids.map(id=>{
        return `organization:${id}`
    })

    const organizationFoundInCache = await OrganizationCache.mget(keys);    

    
    return organizationFoundInCache.map(org => {
        return JSON.parse(org!);
    })
}