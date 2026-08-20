const CLOUD_NAME = "qozrp4th";
const UPLOAD_PRESET = "nebula";

/**
 * Sube un archivo de imagen a Cloudinary y retorna su URL pública.
 * "file" es el objeto File que viene del <input type="file">
 */
export const uploadImage = async (file) => {
  // FormData es el formato estándar para enviar archivos por HTTP,
  // como si fuera un formulario HTML normal con un input type="file"
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Error al subir la imagen a Cloudinary");
  }

  const data = await response.json();
  return data.secure_url; // la URL pública y segura (https) de la imagen
};