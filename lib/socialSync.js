// Pulls recent Instagram media using a user-supplied Graph API access token.
//
// This is a real call to graph.instagram.com — it will work if the token is
// valid. It does NOT handle getting that token for you: the person needs to
// generate a long-lived Instagram access token themselves, which requires a
// Meta developer app (or Meta's Graph API Explorer for personal/testing use)
// with the appropriate media-read permission. Meta's exact app-review and
// permission requirements change over time — check developers.facebook.com
// for the current process.
//
// We deliberately never persist the token anywhere: it's used for one fetch
// in the dashboard, and only the resulting (public) media URLs are saved to
// the block. TikTok has no equivalent "paste a token" path (their Display
// API requires a full registered OAuth app + login flow), so grid sync there
// is manual-entry only for now.

export async function fetchInstagramMedia(accessToken, limit = 12) {
  if (!accessToken) throw new Error('Missing access token');

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink';
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error?.message || 'Instagram API request failed. Check that your token is valid and unexpired.');
  }

  return (json.data || [])
    .filter((item) => item.media_type !== 'CAROUSEL_ALBUM' || item.thumbnail_url)
    .map((item) => ({
      thumbnail_url: item.media_type === 'VIDEO' ? (item.thumbnail_url || item.media_url) : item.media_url,
      link_url: item.permalink,
    }));
}
