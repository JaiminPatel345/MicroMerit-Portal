let notifyHandler = null;

export const setNotification = (message, type = "info") => {
  if (notifyHandler) notifyHandler(message, type);
};

export const registerNotificationHandler = (fn) => {
  notifyHandler = fn;
};
