import {
  API_BASE_URL,
  getAuthAccessToken,
  httpClient,
} from "@/src/services/http/axios.config";
import { CAMERA_ENDPOINTS } from "../keys/camera.keys";

interface FriendDto {
  userId: string;
  username: string;
  avatarUrl: string | null;
  avatarKey: string | null;
}

interface UploadPhotoResponse {
  imageKey: string;
  imageUrl: string;
}

interface SendPhotoPayload {
  imageKey: string;
  caption?: string;
  recipientIds: string[];
}

interface SentRecipient {
  recipientId: string;
  deliveryId: string;
}

interface SendPhotoResponse {
  photoId: string;
  senderId: string;
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  recipients: SentRecipient[];
  createdAt: string;
}

export interface CameraFriendOption {
  id: string;
  name: string;
  avatar: string;
}

const cdnBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_URL_BASE?.replace(
  /\/+$/,
  "",
);

function resolveAvatarUrl(avatarUrl: string | null, username: string): string {
  if (!avatarUrl) {
    return `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(username)}`;
  }

  if (/^https?:/i.test(avatarUrl)) {
    return avatarUrl;
  }

  if (cdnBaseUrl) {
    const normalizedKey = avatarUrl.replace(/^\/+/, "");
    return `${cdnBaseUrl}/${normalizedKey}`;
  }

  return `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(username)}`;
}

function inferMimeTypeFromUri(uri: string): string {
  const normalized = uri.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function inferFileNameFromUri(uri: string): string {
  const lastSegment = uri.split("?")[0].split("/").pop();
  if (lastSegment && lastSegment.includes(".")) {
    return lastSegment;
  }

  const mime = inferMimeTypeFromUri(uri);
  const extension =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return `photo-${Date.now()}.${extension}`;
}

async function uploadPhotoDirect(
  imageUri: string,
): Promise<UploadPhotoResponse> {
  const token = getAuthAccessToken();
  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    name: inferFileNameFromUri(imageUri),
    type: inferMimeTypeFromUri(imageUri),
  } as unknown as Blob);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${CAMERA_ENDPOINTS.uploadPhotoDirect}`,
    {
      method: "POST",
      headers,
      body: formData,
    },
  );

  const raw = await response.text();
  let payload:
    | {
        success: boolean;
        data?: UploadPhotoResponse;
        error?: { message?: string };
      }
    | undefined;

  if (raw) {
    try {
      payload = JSON.parse(raw) as {
        success: boolean;
        data?: UploadPhotoResponse;
        error?: { message?: string };
      };
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.error?.message ?? "Photo upload failed.");
  }

  return payload.data;
}

export const cameraApi = {
  async listFriends(): Promise<CameraFriendOption[]> {
    const items = await httpClient.get<FriendDto[]>(
      CAMERA_ENDPOINTS.listFriends,
    );

    return items.map((item) => ({
      id: item.userId,
      name: item.username,
      avatar: resolveAvatarUrl(item.avatarUrl, item.username),
    }));
  },

  uploadPhotoDirect,

  sendPhoto(payload: SendPhotoPayload): Promise<SendPhotoResponse> {
    return httpClient.post<SendPhotoResponse, SendPhotoPayload>(
      CAMERA_ENDPOINTS.sendPhoto,
      payload,
    );
  },
};
