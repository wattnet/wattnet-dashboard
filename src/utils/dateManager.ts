export const getTodayUTC = () => {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
};

export const normalizeToUTCDate = (date: Date) => {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
};

export const getInitialTimeIndex = () => {
  const nowUTC = new Date();
  const hours = nowUTC.getUTCHours();
  const minutes = nowUTC.getUTCMinutes();

  const intervalIndex = hours * 4 + Math.floor(minutes / 15);

  return Math.min(intervalIndex, 95);
};
