import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getCommercialInvitationByToken } from "../db";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Check if DEMO_MODE is enabled
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  if (isDemoMode) {
    // In demo mode, create a demo user automatically
    const demoOpenId = 'demo-user-railway';
    user = await getUserById(1); // Try to get existing demo user
    
    if (!user) {
      // Create demo user if it doesn't exist
      const { upsertUser } = await import('../db');
      await upsertUser({
        openId: demoOpenId,
        name: 'Demo User',
        email: 'demo@railway.app',
        loginMethod: 'demo',
        lastSignedIn: new Date(),
      });
      user = await getUserById(1);
    }
  }

  if (!user) {
    try {
      // First, try OAuth authentication
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // If OAuth fails, check for commercial token
      const commercialToken = opts.req.headers["x-commercial-token"] as string | undefined;
      
      if (commercialToken) {
        try {
          const link = await getCommercialInvitationByToken(commercialToken);
          
          if (link && !link.revoked) {
            // Get the owner's user account
            const owner = await getUserById(link.createdBy);
            
            if (owner) {
              // Create a virtual user based on the owner
              // This allows the commercial to access the owner's presentations
              user = owner;
            }
          }
        } catch (err) {
          // Commercial token authentication failed
          user = null;
        }
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

