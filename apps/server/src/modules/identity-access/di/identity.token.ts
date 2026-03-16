export const IDENTITY_KEY = {
  USE_CASE: {
    REGISTER: Symbol("RegisterUseCase"),
    LOGIN: Symbol("LoginUseCase"),
    REFRESH: Symbol("RefreshTokenUseCase"),
    LOGOUT: Symbol("LogoutUseCase"),
    GET_ME: Symbol("GetMeUseCase"),
    UPDATE_EMAIL: Symbol("UpdateEmailUseCase"),
    CHANGE_PASSWORD: Symbol("ChangePasswordUseCase"),
  },
  REPOSITORY: {
    USER: Symbol("UserRepository"),
    REFRESH_TOKEN: Symbol("RefreshTokenRepository"),
  },
  DOMAIN_SERVICE: {
    PASSWORD_HASHER: Symbol("PasswordHasher"),
    DEVICE: Symbol("DeviceService"),
    TOKEN: Symbol("TokenService"),
  },
};
