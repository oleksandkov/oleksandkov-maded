export const USER_ERROR_MESSAGES = {
  missingToken: "Please sign in to continue.",
  invalidToken: "Your session has expired. Please sign in again.",
  adminOnly: "You need admin access to do that.",
  forbidden: "You need admin access to do that.",
  database: "Something went wrong on our side. Please try again later.",
  notFound: "We couldn't find what you were looking for.",
  requestInvalid: "We couldn't process that request. Please try again.",
  titleRequired: "Please add a title before saving.",
  eventTitleRequired: "Please add a title before saving.",
  startDateRequired: "Please include a start date and time before saving.",
  invalidStartDate: "We couldn't understand that date. Please pick a new one.",
  noValidFields:
    "We couldn't find anything to update. Please adjust your changes and try again.",
  imageRequired: "Please include an image before uploading.",
  projectImageType:
    "That file type isn't supported. Try a PNG, JPG, JPEG, GIF, or WEBP image.",
  documentFileType:
    "That file type isn't supported. Try a PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF, ZIP, RAR, PPT, or PPTX file.",
  fileRequired: "Please choose a file before uploading.",
  fileUploadFailed:
    "We couldn't upload that file right now. Please try again later.",
  imageUploadFailed:
    "We couldn't upload that image right now. Please try again later.",
  audioRequired: "Please include an audio file before uploading.",
  attachmentRequired: "Please include an attachment before uploading.",
  audioFileType:
    "That audio format isn't supported. Try an MP3, WAV, OGG, M4A, AAC, or FLAC file.",
  emailServiceUnavailable:
    "We're unable to send messages right now. Please try again later.",
  contactSubjectMissing: "Please include a subject before sending.",
  contactMessageMissing: "Please include a message before sending.",
  contactEmailInvalid: "Please enter a valid email address before sending.",
  contactRecipientsMissing:
    "We can't route your message right now. Please try again soon.",
  contactSendFailed:
    "We couldn't deliver your message just yet. Please try again.",
  emailRequired: "Please enter an email address before continuing.",
  emailAndPasswordRequired: "Please enter both email and password.",
  nameSurnameEmailPasswordRequired:
    "Please share your name, surname, email, and password before continuing.",
  userExists: "An account with this email already exists.",
  invalidCredentials: "That email or password didn't match our records.",
  emailNotVerified: "Please verify your email before signing in.",
  verificationUnavailable:
    "We couldn't send a verification email right now. Please try again later.",
  verificationInvalid:
    "We couldn't verify that link. Please request a new one.",
  verificationFailed:
    "We couldn't verify your account right now. Please try again later.",
  verificationExpired:
    "That verification link has expired. Please request a new one.",
  invalidUserId: "We couldn't process that request.",
  userNotFound: "We couldn't find that user.",
  missingEnabledValue:
    "Please tell us whether notifications should be enabled.",
  notificationUpdateFailed:
    "We couldn't update your notification settings. Please try again later.",
  invalidId: "We couldn't process that request.",
  documentNotFound: "We couldn't find that document.",
  eventNotFound: "We couldn't find that event.",
  noEmailAddresses:
    "We couldn't find anyone to send this to. Add at least one email address.",
  eventSendFailed:
    "We couldn't send those invites right now. Please try again later.",
  articleNotFound: "We couldn't find that article.",
  notificationAlreadySentArticle:
    "A notification has already been sent for this article.",
  notificationRecipientsMissing:
    "We don't have anyone to notify yet. Add at least one recipient.",
  podcastNotFound: "We couldn't find that podcast.",
  podcastAudioInvalid:
    "We need a valid audio file before sharing this podcast.",
  notificationAlreadySentPodcast:
    "A notification has already been sent for this podcast.",
  articleNotificationFailed:
    "We couldn't send that article notification right now. Please try again later.",
  podcastNotificationFailed:
    "We couldn't send that podcast notification right now. Please try again later.",
  noteContentRequired: "Please add some content before saving the note.",
  codespaceProjectRequired: "Please include a project name before saving.",
  codespaceRepositoryRequired: "Please include a repository before saving.",
  codespaceRepositoryFormat: "The repository should use the owner/repo format.",
  storageKeyRequired: "We need a file reference before we can continue.",
  mediaStreamFailed:
    "We couldn't stream that file right now. Please try again later.",
};

export function userMessage(key, fallback) {
  if (USER_ERROR_MESSAGES[key]) {
    return USER_ERROR_MESSAGES[key];
  }
  if (fallback) {
    return fallback;
  }
  return USER_ERROR_MESSAGES.database;
}
