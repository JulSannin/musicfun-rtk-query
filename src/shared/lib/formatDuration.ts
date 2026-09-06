// сервер отдаёт длительность числом секунд: и у трека, и у плейлиста целиком
// час показываем, только если он есть — у трека его почти никогда нет
export const formatDuration = (totalSeconds: number): string => {
    // у пустого плейлиста приходит 0, у битых данных может прийти мусор
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;

    const pad = (value: number) => String(value).padStart(2, '0');

    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(rest)}`
        : `${minutes}:${pad(rest)}`;
};
