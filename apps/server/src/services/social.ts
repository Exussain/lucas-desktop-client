import axios from "axios";

export class SocialImageService {
  async findImages(keyword: string): Promise<string[]> {
    try {
      const res = await axios.get("https://duckduckgo.com/i.js", {
        params: { q: keyword, o: "json" },
        timeout: 2500
      });
      const results = Array.isArray(res.data?.results) ? res.data.results : [];
      return results.slice(0, 6).map((r: any) => String(r.image)).filter(Boolean);
    } catch {
      return [];
    }
  }
}
