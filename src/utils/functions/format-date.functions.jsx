export const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("fr-FR", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};
export const formatOnlyDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }); // Formats the date to: "07 oct. 2024"
}
