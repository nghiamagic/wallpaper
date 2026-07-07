export default async function handler(req, res) {

  try {

    const keyword = req.query.q;

    if (!keyword) {
      return res.status(400).json({
        error: "Missing q parameter"
      });
    }

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing SERPAPI_KEY"
      });
    }

    const serpUrl =
      "https://serpapi.com/search.json?" +
      "engine=google_images" +
      "&q=" + encodeURIComponent(keyword) +
      "&location=Vietnam" +
      "&google_domain=google.com.vn" +
      "&num=10" +
"&ijn=0" +
      "&hl=vi" +
      "&gl=vn" +
      "&api_key=" + apiKey;

    const serp = await fetch(serpUrl);

    if (!serp.ok) {
      return res.status(500).json({
        error: "SerpApi request failed"
      });
    }

    const json = await serp.json();
json.images_results = (json.images_results || []).slice(0, 10);
    if (!json.images_results || json.images_results.length === 0) {
      return res.status(404).json({
        error: "No image found"
      });
    }

    // Lấy tối đa 10 ảnh rồi trộn ngẫu nhiên
const images = [...json.images_results]
  .sort(() => Math.random() - 0.5)
  .slice(0, 5);

function fetchImage(img) {
  return new Promise(async (resolve) => {

    if (!img.original) {
      return resolve(null);
    }

    try {

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 2000);

      const image = await fetch(img.original, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!image.ok) {
        return resolve(null);
      }

      const type = image.headers.get("content-type") || "";

      if (!type.startsWith("image/")) {
        return resolve(null);
      }

      const buffer = Buffer.from(await image.arrayBuffer());

      resolve({
        buffer,
        type
      });

    } catch {

      resolve(null);

    }

  });
}

const result = await Promise.any(
  images.map(img => fetchImage(img).then(r => {
    if (!r) throw new Error();
    return r;
  }))
).catch(() => null);

if (!result) {

  return res.status(404).json({
    error: "No downloadable image found"
  });

}

res.setHeader("Content-Type", result.type);
res.setHeader("Cache-Control", "no-store");

return res.send(result.buffer);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }

}
