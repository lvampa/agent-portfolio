export default {
  fetch(request) {
    const cf = request.cf ?? {};
    const header = (name) => request.headers.get(name);

    const info = {
      ip: header('cf-connecting-ip'),
      country: header('cf-ipcountry'),
      city: cf.city ?? 'Unknown',
      latitude: cf.latitude ?? 'Unknown',
      longitude: cf.longitude ?? 'Unknown',
      asn: cf.asn ?? 'Unknown',
      organization: cf.asOrganization ?? 'Unknown',
      timezone: cf.timezone ?? 'Unknown',
      userAgent: header('user-agent'),
      acceptLanguage: header('accept-language'),
      acceptEncoding: header('accept-encoding'),
      referer: header('referer') ?? 'Direct',
      tlsVersion: cf.tlsVersion ?? 'Unknown',
      tlsCipher: cf.tlsCipher ?? 'Unknown',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(info, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  },
};
