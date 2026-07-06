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

    if (!json.images_results || json.images_results.length === 0) {
      return res.status(404).json({
        error: "No image found"
      });
    }

    const maxTry = Math.min(json.images_results.length, 7);

const randomIndex = Math.floor(Math.random() * maxTry);

const order = [];

// Ảnh ngẫu nhiên đầu tiên
order.push(randomIndex);

// Sau đó thử các ảnh còn lại
for (let i = 0; i < maxTry; i++) {
  if (i !== randomIndex) {
    order.push(i);
  }
}

for (const index of order) {

  const img = json.images_results[index];

  if (!img.original) continue;

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

        if (!image.ok) continue;

        const type = image.headers.get("content-type") || "";

        if (!type.startsWith("image/")) continue;

        const buffer = Buffer.from(await image.arrayBuffer());

        res.setHeader("Content-Type", type);
        res.setHeader("Cache-Control", "public,max-age=3600");

        return res.status(200).send(buffer);

      } catch (e) {

        continue;

      }

    }

    return res.status(404).json({
      error: "No downloadable image found"
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: err.message
    });

  }

}
