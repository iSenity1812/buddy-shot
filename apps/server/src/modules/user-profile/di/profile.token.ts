export const PROFILE_KEY = {
  USE_CASE: {
    GET_PROFILE: Symbol("GetProfileUseCase"),
    UPDATE_PROFILE: Symbol("UpdateProfileUseCase"),
    CHANGE_AVATAR: Symbol("ChangeAvatarUseCase"),
    GENERATE_QR_CODE: Symbol("GenerateProfileQrCodeUseCase"),
    GENERATE_AVATAR_UPLOAD_URL: Symbol("GenerateAvatarUploadUrlUseCase"),
  },
  REPOSITORY: Symbol("ProfileRepository"),
  PORT: {
    STORAGE: Symbol("StoragePort"),
    QR_CODE: Symbol("QrCodePort"),
  },
};
