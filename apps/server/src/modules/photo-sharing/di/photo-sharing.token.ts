export const PHOTO_SHARING_KEY = {
  USE_CASE: {
    SEND_PHOTO: Symbol("SendPhotoUseCase"),
    GET_FEED: Symbol("GetPhotoFeedUseCase"),
  },
  REPOSITORY: Symbol("PhotoSharingRepository"),
  PORT: {
    REALTIME: Symbol("PhotoRealtimePort"),
    MEDIA_STORAGE: Symbol("MediaStoragePort"),
    EVENT_DISPATCHER: Symbol("PhotoDomainEventDispatcherPort"),
  },
};
