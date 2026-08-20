export const parseHttpUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl : null;
  } catch {
    return null;
  }
};

export const getYoutubeId = (url) => {
  const parsedUrl = parseHttpUrl(url);
  if (!parsedUrl) return null;

  const hostname = parsedUrl.hostname.replace(/^www\./, "");
  if (hostname === "youtu.be") {
    const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
  }

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    const videoId = parsedUrl.searchParams.get("v");
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
  }

  return null;
};

export const getVimeoId = (url) => {
  const parsedUrl = parseHttpUrl(url);
  if (!parsedUrl) return null;

  const hostname = parsedUrl.hostname.replace(/^www\./, "");
  if (hostname !== "vimeo.com") return null;

  const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
  return /^\d+$/.test(videoId || "") ? videoId : null;
};
