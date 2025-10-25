import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook to handle commercial access
 * Returns the effective user ID (either authenticated user or commercial owner)
 */
export function useCommercialAccess() {
  const { user, isAuthenticated } = useAuth();
  
  const commercialInfo = useMemo(() => {
    const token = sessionStorage.getItem("commercialToken");
    const name = sessionStorage.getItem("commercialName");
    const ownerId = sessionStorage.getItem("commercialOwnerId");
    
    if (token && name && ownerId) {
      return {
        isCommercial: true,
        token,
        name,
        ownerId: parseInt(ownerId),
      };
    }
    
    return {
      isCommercial: false,
      token: null,
      name: null,
      ownerId: null,
    };
  }, []);
  
  return {
    // If commercial, use owner's ID, otherwise use authenticated user's ID
    effectiveUserId: commercialInfo.isCommercial ? commercialInfo.ownerId : user?.id,
    isCommercial: commercialInfo.isCommercial,
    commercialName: commercialInfo.name,
    // Commercial is considered "authenticated" for UI purposes
    isEffectivelyAuthenticated: isAuthenticated || commercialInfo.isCommercial,
    // Original auth info
    user,
    isAuthenticated,
  };
}

