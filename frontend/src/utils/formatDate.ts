export const formatDate = (isoString: string, locale: string = "en-US") => {
  const date = new Date(isoString);
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
