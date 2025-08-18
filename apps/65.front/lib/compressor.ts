type Compressor = { file: File; maxSize: number; quality?: number };

export const compressor = ({
  file,
  maxSize,
  quality = 0.9,
}: Compressor): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("Le contexte Canvas n'a pas pu être créé"));
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const compress = (qualityReduce: number) => {
          return new Promise<Blob | null>((resolve2) => {
            canvas.toBlob(
              (blob) => {
                resolve2(blob);
              },
              file.type,
              qualityReduce,
            );
          });
        };

        const reduceSize = async () => {
          let blob = await compress(quality);

          while (blob && blob.size > maxSize && quality > 0.1) {
            quality *= 0.9;
            blob = await compress(quality);
          }

          if (blob && blob.size <= maxSize) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(
              new Error(
                "Impossible de compresser l'image sous la taille limite",
              ),
            );
          }
        };

        void reduceSize();
      };

      img.src = (event.target as any).result as string;
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};
