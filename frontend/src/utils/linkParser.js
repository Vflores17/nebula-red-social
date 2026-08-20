// Extrae el ID de un video de YouTube desde distintas variantes de URL
export const getYoutubeId = (url) => {
  if (!url) return null;

  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;

  const match = url.match(regex);
  return match ? match[1] : null;
};

// Extrae el ID de un video de Vimeo
export const getVimeoId = (url) => {
  if (!url) return null;

  const regex = /vimeo\.com\/(?:video\/)?(\d+)/;

  const match = url.match(regex);
  return match ? match[1] : null;
};

// Valida y normaliza una URL http/https genérica (para links que no son de video)
export const parseHttpUrl = (url) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
};
