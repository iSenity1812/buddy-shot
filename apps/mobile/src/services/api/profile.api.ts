import { httpClient } from "@/src/services/http/axios.config";

export interface ProfileMe {
  userId: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  updatedAt: string;
}

interface UpdateProfilePayload {
  username?: string;
  bio?: string | null;
}

interface AvatarUploadUrlPayload {
  fileExt?: string;
  contentType?: string;
}

interface AvatarUploadUrlResponse {
  avatarKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
}

const PROFILE_ENDPOINTS = {
  me: "/profiles/me",
  avatar: "/profiles/me/avatar",
  avatarUploadUrl: "/profiles/me/avatar/upload-url",
} as const;

function resolveImageExtension(uri: string): string {
  const fileName = uri.split("?")[0] ?? "";
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "jpeg") {
    return "jpg";
  }

  if (ext === "png" || ext === "webp" || ext === "jpg") {
    return ext;
  }

  return "jpg";
}

export const profileApi = {
  getMe(): Promise<ProfileMe> {
    return httpClient.get<ProfileMe>(PROFILE_ENDPOINTS.me);
  },

  updateMe(payload: UpdateProfilePayload): Promise<ProfileMe> {
    return httpClient.patch<ProfileMe, UpdateProfilePayload>(
      PROFILE_ENDPOINTS.me,
      payload,
    );
  },

  requestAvatarUploadUrl(
    payload: AvatarUploadUrlPayload,
  ): Promise<AvatarUploadUrlResponse> {
    return httpClient.post<AvatarUploadUrlResponse, AvatarUploadUrlPayload>(
      PROFILE_ENDPOINTS.avatarUploadUrl,
      payload,
    );
  },

  updateAvatar(avatarKey: string | null): Promise<ProfileMe> {
    return httpClient.patch<ProfileMe, { avatarKey: string | null }>(
      PROFILE_ENDPOINTS.avatar,
      { avatarKey },
    );
  },

  async uploadAvatarFromLocalUri(uri: string): Promise<ProfileMe> {
    const fileExt = resolveImageExtension(uri);
    const upload = await this.requestAvatarUploadUrl({ fileExt });

    const imageResponse = await fetch(uri);
    const imageBlob = await imageResponse.blob();

    const uploadResponse = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": imageBlob.type || `image/${fileExt}`,
      },
      body: imageBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error("Avatar upload failed");
    }

    return this.updateAvatar(upload.avatarKey);
  },
};
