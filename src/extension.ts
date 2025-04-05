import * as spy from './spy'; // spy only exports top-level functionality for events
import * as vscode from 'vscode'; // VS Code extension API


// This method is called when your extension is activated (the first time any registered command is executed)
export function activate(context: vscode.ExtensionContext) {
	// Set up addons
	spy.setInfo(context);
	spy.setupUI(context);

	// Run updates once
	spy.scanUI(context);
	spy.scanCC();

	// Register events
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			spy.scanUI(context);
			spy.scanCC();
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidOpenTextDocument(event => {
		if (event.fileName) {
			spy.scanUI(context);
			spy.scanCC(context, event);
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document) {
			spy.scanUI(context);
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidSaveTextDocument(event => {
		if (event.fileName) {
			spy.scanCC(context, event);
		}
	}, null, context.subscriptions);

	
	context.subscriptions.push(vscode.commands.registerCommand('spy.PurgeCachedFiles', () => {
		spy.deleteCache();
		vscode.window.showInformationMessage('PySpy: Deleting cached files.');
	}));

	context.subscriptions.push(vscode.languages.registerHoverProvider('python', {
		provideHover(document, position, token) {
			return spy.provideHover(document, position, token);
		}
	}));

}

export async function deactivate(): Promise<any> {
	/*
	https://github.com/microsoft/vscode/issues/144118

	VSCode made questionable design decisions to tie practically all processes to the renderer,
	which is killed almost immediately on exit. This means the majority of the API calls
	have no thread to service them despite the 5-second guarantee on `async deactivate()`.
	This github issue is the *only* mention of this affecting the API.

	Awaiting cleanup on exit will fail because every file cleanup attempt's promise will be cancelled,
	causing the extension host process to complain after 1 second of an unhandled cancellation.
	VSCode, YOU ARE DOING THE CANCELLATION. HANDLE IT YOURSELF.
	
	The user can manually trigger a cache cleanup with the command "PySpy: Clean File Cache" in the
	command palette menu (`Ctrl+Shift+P`).

	We still make an attempt to clean up after ourselves regardless in case the user
	removes/uninstalls this extension in an instance that remains running.
	*/
	spy.removeUI();
	return spy.deleteCache();
}
