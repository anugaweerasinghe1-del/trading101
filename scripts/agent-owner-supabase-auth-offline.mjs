/**
 * Server-only, OFFLINE TEST seam for the existing Supabase Auth + admin key architecture.
 * Never import into browser bundles; never persist or print bearer tokens/admin keys.
 * A real deployment needs a protected edge endpoint and registered owner auth.user.id.
 * No network request or provider configuration is made by this module.
 */
import assert from "node:assert/strict";
export function createOfflineSupabaseOwnerVerifier({getUser,authorizeExistingAdmin,registeredOwnerId}) {
  assert.ok(typeof getUser==="function" && typeof authorizeExistingAdmin==="function"
    && typeof registeredOwnerId==="string" && registeredOwnerId.length>0,
    "Missing verified session, independent admin authorization or registered owner ID");
  return async function verifyOwner({accessToken,adminCredential}) {
    assert.ok(typeof accessToken==="string" && accessToken.length>=12 && accessToken.length<=8192
      && typeof adminCredential==="string" && adminCredential.length>0 && adminCredential.length<=8192,
      "Both bearer session and private administrator credential are required");
    // getUser MUST use server-side supabase.auth.getUser(accessToken). Reading
    // localStorage, parsing the JWT, getSession(), client claims or profile text
    // does not independently prove identity. The caller must verify this wiring.
    const result=await getUser(accessToken);
    assert.ok(result && !result.error && result.data?.user?.id===registeredOwnerId
      && result.data.user.aud==="authenticated" && result.data.user.is_anonymous!==true,
      "Session does not resolve to registered owner");
    // Separate existing server-side ADMIN_MASTER_KEY verification. Mere presence of
    // a credential, a UI flag, or a self-asserted role is never enough.
    const allowed=await authorizeExistingAdmin(adminCredential,registeredOwnerId);
    assert.equal(allowed,true,"Existing administrator authorization was not verified");
    return Object.freeze({authenticated:true,testOnly:true,id:registeredOwnerId,
      identitySource:"injected-supabase-getUser-and-admin-check"});
  };
}
