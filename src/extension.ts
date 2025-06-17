import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Converts a Windows path to a WSL path.
 * Example: C:\Users\user\file.txt -> /mnt/c/Users/user/file.txt
 * Handles both file and folder paths.
 * @param windowsPath The original Windows path.
 * @returns The converted WSL path.
 */
function convertWindowsPathToWslPath(windowsPath: string): string {
	// Normalize path separators from backslashes to forward slashes
	let normalizedPath = windowsPath.replace(/\\/g, '/');

	// Check if the path starts with a Windows drive letter (e.g., C:/)
	const driveMatch = normalizedPath.match(/^([A-Za-z]):\/(.*)$/);

	if (driveMatch) {
		const driveLetter = driveMatch[1].toLowerCase(); // Get lowercase drive letter
		const restOfPath = driveMatch[2]; // Get the rest of the path after the drive
		return `/mnt/${driveLetter}/${restOfPath}`;
	} else {
		// If it doesn't start with a drive letter, it might be a UNC path (e.g., //server/share)
		// or a relative path. For this specific requirement (C:\... to /mnt/c/...),
		// we primarily focus on absolute Windows paths with drive letters.
		// For other cases, this function might need more sophisticated handling if required.
		return normalizedPath;
	}
}

/**
 * This method is called when your extension is activated.
 * The extension is activated the very first time the command is executed.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, "copy-as-wsl" is now active!');

	// Register the command 'copy-as-wsl.helloWorld' (now "Copy as WSL")
	let disposableCopyPath = vscode.commands.registerCommand(
		'copy-as-wsl.helloWorld', // This command ID corresponds to "Copy as WSL"
		async (uri: vscode.Uri) => {
			if (uri && uri.fsPath) {
				const fullWindowsPath = uri.fsPath;
				const wslPath = convertWindowsPathToWslPath(fullWindowsPath);
				try {
					await vscode.env.clipboard.writeText(wslPath);
					vscode.window.showInformationMessage(`Copied to clipboard (WSL Path): ${wslPath}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to copy path: ${error}`);
				}
			} else {
				vscode.window.showInformationMessage('Please right-click a file or folder to copy its WSL path.');
			}
		}
	);

	// Register the new command 'copy-as-wsl.copyWslFolder'
	let disposableCopyFolderPath = vscode.commands.registerCommand(
		'copy-as-wsl.copyWslFolder', // New command ID for "Copy as WSL Folder"
		async (uri: vscode.Uri) => {
			if (uri && uri.fsPath) {
				let folderWindowsPath = path.dirname(uri.fsPath);

				// If the original URI was a directory, we should use its fspath directly.
				// This ensures that if a folder is selected, its own path is copied, not its parent.
				const fsStat = await vscode.workspace.fs.stat(uri);
				if (fsStat.type === vscode.FileType.Directory) {
					folderWindowsPath = uri.fsPath;
				}

				const wslFolderPath = convertWindowsPathToWslPath(folderWindowsPath);
				try {
					await vscode.env.clipboard.writeText(wslFolderPath);
					vscode.window.showInformationMessage(`Copied to clipboard (WSL Folder Path): ${wslFolderPath}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to copy folder path: ${error}`);
				}
			} else {
				vscode.window.showInformationMessage('Please right-click a file or folder to copy its WSL folder path.');
			}
		}
	);

	// Add both disposables to the context's subscriptions.
	context.subscriptions.push(disposableCopyPath, disposableCopyFolderPath);
}

/**
 * This method is called when your extension is deactivated.
 * Use this to clean up resources or unsubscribe from events.
 */
export function deactivate() {
	console.log('"copy-as-wsl" has been deactivated.');
}
