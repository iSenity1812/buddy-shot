export const PHOTO_SHARING_KEY = {
  USE_CASE: {
    SEND_PHOTO: Symbol("SendPhotoUseCase"),
    GET_FEED: Symbol("GetPhotoFeedUseCase"),
    GET_ALL_PHOTOS: Symbol("GetAllPhotosUseCase"),
    GET_MY_PHOTOS: Symbol("GetMyPhotosUseCase"),
    UPDATE_MY_PHOTO_CAPTION: Symbol("UpdateMyPhotoCaptionUseCase"),
    DELETE_MY_PHOTO: Symbol("DeleteMyPhotoUseCase"),
    REACT_TO_PHOTO: Symbol("ReactToPhotoUseCase"),
    REMOVE_REACTION: Symbol("RemoveReactionUseCase"),
  },
  REPOSITORY: Symbol("PhotoSharingRepository"),
  PORT: {
    REALTIME: Symbol("PhotoRealtimePort"),
    MEDIA_STORAGE: Symbol("MediaStoragePort"),
    EVENT_DISPATCHER: Symbol("PhotoDomainEventDispatcherPort"),
  },
};
