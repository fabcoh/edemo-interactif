import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getCommercialInvitationByToken, getUserById } from "../db";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { COOKIE_NAME } from "@shared/const";
import cookie from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // First, try OAuth authentication
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // If OAuth fails, check for JWT cookie (email/password auth)
    const cookies = cookie.parse(opts.req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.jwtSecret) as { userId: number; email: string };
        user = await getUserById(decoded.userId);
      } catch (err) {
        // JWT verification failed, try commercial token
        user = null;
      }
    }
    
    // If still no user, check for commercial token
    if (!user) {
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
