export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Same-origin check could be enforced by Vercel routes or CORS headers, 
  // but since we only allow requests from same origin by default via lack of CORS headers,
  // we just return the health check.
  
  res.status(200).json({
    status: "ok",
    mode: "PUBLIC_PASSIVE"
  });
}
