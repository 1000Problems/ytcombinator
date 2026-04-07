/**
 * YouTube numeric category ID → YTCombinator category mapping.
 *
 * YouTube categories: https://developers.google.com/youtube/v3/docs/videoCategories/list
 * Our categories match the `category` column in the `category_cpm` table.
 */

export const YOUTUBE_TO_YTC_CATEGORY: Record<number, string> = {
  1: "adventure",       // Film & Animation
  2: "adventure",       // Autos & Vehicles
  10: "compilation",    // Music
  15: "animals",        // Pets & Animals
  17: "adventure",      // Sports
  22: "moral",          // People & Blogs
  24: "adventure",      // Entertainment
  25: "educational",    // News & Politics
  26: "educational",    // Howto & Style
  27: "educational",    // Education
  28: "educational",    // Science & Technology
};

export const DEFAULT_CATEGORY = "educational";
