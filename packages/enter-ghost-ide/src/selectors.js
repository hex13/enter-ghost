export const getPath = (obj) => {
    if (obj.path)
        return obj.path;
    if (obj.file) 
        return obj.file.path;
    return '';
} 