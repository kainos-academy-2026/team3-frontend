export function getFileExtension(fileName: string): string {
	const lowerFileName = fileName.toLowerCase();
	const extensionStartIndex = lowerFileName.lastIndexOf(".");

	return extensionStartIndex >= 0
		? lowerFileName.slice(extensionStartIndex)
		: "";
}