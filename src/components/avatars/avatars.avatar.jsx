export const stringToColor = (string = "") => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
};

export const stringAvatar = (name = "", width, height) => {
    // Split and remove empty parts (handles "undefined undefined" or single names)
    const parts = name.trim().split(/\s+/).filter(Boolean);
    
    const initials =
        parts.length >= 2
            ? `${parts[0][0]}${parts[1][0]}`   // First + Last initial
            : parts[0]?.[0] ?? "?";             // Just first initial, or fallback

    return {
        sx: {
            bgcolor: stringToColor(name),
            width,
            height,
        },
        children: initials.toUpperCase(),
    };
};