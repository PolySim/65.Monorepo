"use server";

import { config } from "@/config/config";
import { Image } from "@/model/image.model";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

const calculateFileHash = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  let hash = 0;
  const sampleSize = Math.min(1024, uint8Array.length);

  for (let i = 0; i < sampleSize; i++) {
    hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff;
  }

  const fileInfo = `${file.name}_${file.size}_${file.lastModified}`;
  for (let i = 0; i < fileInfo.length; i++) {
    hash = ((hash << 5) - hash + fileInfo.charCodeAt(i)) & 0xffffffff;
  }

  return Math.abs(hash).toString(16);
};

export const createImage = async ({
  hikeId,
  formData,
}: {
  hikeId: string;
  formData: FormData;
}) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for creating image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/hike/${hikeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      console.error("Error in creating image", res.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);

    return { success: true };
  } catch (error) {
    console.error("Error in creating image", error);
    return { success: false };
  }
};

export const deleteImage = async (imageId: string, hikeId: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for deleting image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error in deleting image", res.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);

    return { success: true };
  } catch (error) {
    console.error("Error in deleting image", error);
    return { success: false };
  }
};

export const rotateImage = async (imageId: string, hikeId: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for rotating image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/rotate/${imageId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error in rotating image", res.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);
    revalidateTag("hikes");

    return { success: true };
  } catch (error) {
    console.error("Error in rotating image", error);
    return { success: false };
  }
};

export const reorderImage = async (hikeId: string, imageIds: string[]) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for reordering image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/reorder/${hikeId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageIds }),
    });

    if (!res.ok) {
      console.error("Error in reordering image", res.statusText);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in reordering image", error);
    return { success: false };
  }
};

// Actions pour l'upload par chunks
export const initiateChunkUpload = async ({
  hikeId,
  fileName,
  fileSize,
  fileHash,
}: {
  hikeId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
}) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for initiating chunk upload");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/chunk/initiate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hikeId,
        fileName,
        fileSize,
        fileHash,
      }),
    });

    if (!res.ok) {
      console.error("Error in initiating chunk upload", res.statusText);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error in initiating chunk upload", error);
    return { success: false };
  }
};

export const uploadChunk = async ({
  chunk,
  chunkIndex,
  totalChunks,
  fileHash,
  fileName,
  hikeId,
  fileSize,
}: {
  chunk: Blob;
  chunkIndex: number;
  totalChunks: number;
  fileHash: string;
  fileName: string;
  hikeId: string;
  fileSize: number;
}) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for uploading chunk");
      return { success: false };
    }

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkIndex", chunkIndex.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("fileHash", fileHash);
    formData.append("fileName", fileName);
    formData.append("hikeId", hikeId);
    formData.append("fileSize", fileSize.toString());

    const res = await fetch(`${config.API_URL}/images/chunk/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      console.error("Error in uploading chunk", res.statusText);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error in uploading chunk", error);
    return { success: false };
  }
};

export const getChunkStatus = async (fileHash: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for getting chunk status");
      return { success: false };
    }

    const res = await fetch(
      `${config.API_URL}/images/chunk/status/${fileHash}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Error in getting chunk status", res.statusText);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error in getting chunk status", error);
    return { success: false };
  }
};

export const completeChunkUpload = async ({
  fileHash,
  hikeId,
}: {
  fileHash: string;
  hikeId: string;
}) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for completing chunk upload");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/chunk/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileHash,
        hikeId,
      }),
    });

    if (!res.ok) {
      console.error("Error in completing chunk upload", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as Image;
    revalidateTag(`hike-${hikeId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error in completing chunk upload", error);
    return { success: false };
  }
};

export const cancelChunkUpload = async (fileHash: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for cancelling chunk upload");
      return { success: false };
    }

    const res = await fetch(
      `${config.API_URL}/images/chunk/cancel/${fileHash}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Error in cancelling chunk upload", res.statusText);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in cancelling chunk upload", error);
    return { success: false };
  }
};

export const createImageByChunks = async ({
  hikeId,
  file,
}: {
  hikeId: string;
  file: File;
}) => {
  try {
    const CHUNK_SIZE = 512 * 1024; // 512KB
    const fileHash = await calculateFileHash(file);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Étape 1: Initier l'upload
    const initiateResult = await initiateChunkUpload({
      hikeId,
      fileName: file.name,
      fileSize: file.size,
      fileHash,
    });

    if (!initiateResult.success) {
      console.error("Échec initiation:", initiateResult);
      return { success: false, error: "Échec de l'initiation de l'upload" };
    }

    // Étape 2: Uploader chaque chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const uploadResult = await uploadChunk({
        chunk,
        chunkIndex: i,
        totalChunks,
        fileHash,
        fileName: file.name,
        hikeId,
        fileSize: file.size,
      });

      if (!uploadResult.success) {
        console.error(`Échec upload chunk ${i}:`, uploadResult);
        await cancelChunkUpload(fileHash);
        return { success: false, error: `Échec de l'upload du chunk ${i}` };
      }
    }

    // Étape 3: Finaliser l'upload
    const completeResult = await completeChunkUpload({
      fileHash,
      hikeId,
    });

    if (!completeResult.success) {
      console.error("Échec finalisation");
      return { success: false, error: "Échec de la finalisation de l'upload" };
    }

    return { success: true, data: completeResult.data };
  } catch (error) {
    console.error("Error in createImageByChunks - Exception non gérée:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");

    // Essayer d'annuler si on a le fileHash
    try {
      const fileHash = await calculateFileHash(file);
      await cancelChunkUpload(fileHash);
    } catch (cancelError) {
      console.error("Erreur lors de l'annulation:", cancelError);
    }

    return { success: false, error: "Erreur inattendue lors de l'upload" };
  }
};
