/**
 * Verifies the caller's Supabase session (Authorization: Bearer <access_token>)
 * server-side, rather than trusting a client-supplied identity. Writes a 401
 * response and returns null on failure; otherwise returns the Supabase auth
 * user object ({ id, email, ... }).
 */
export async function requireUser(req, res, supabaseAdmin) {
  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return data.user;
}
