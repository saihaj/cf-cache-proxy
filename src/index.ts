export default {
  async fetch(request, env, ctx) {
    // If there are any exceptions in this code, don't block traffic send it to origin
    ctx.passThroughOnException();

    const cacheUrl = new URL(request.url);

    // Construct the cache key from the cache URL
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    // Check whether the value is already available in the cache
    // if not, you will need to fetch it from origin, and store it in the cache
    let response = await cache.match(cacheKey);

    if (!response) {
      console.log(
        `Response for request url: ${request.url} not present in cache. Fetching and caching request.`,
      );

      // If not in cache, get it from origin
      response = await fetch(request);

      // Must use Response constructor to inherit all of response's fields
      response = new Response(response.body, response);

      // We store in the browser cache for 1 day and in the CDN cache for 12 hours
      response.headers.append(
        'Cache-Control',
        'public, max-age=86400, s-maxage=43200',
      );

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    } else {
      console.log(`Cache hit for: ${request.url}.`);
    }


    return response;
  },
} satisfies ExportedHandler<Env>;
