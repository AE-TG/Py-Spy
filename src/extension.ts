import * as vscode from 'vscode'; // VS Code extension API
import * as spy from './spy'; // spy only exports top-level functionality

// This method is called when your extension is activated (the first time any registered command is executed)
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('extension "spy" is active');

	// Set up UI addons
	spy.setupUI(context);
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
	
	vscode.languages.registerHoverProvider('python', {
		provideHover(document, position, token) {
			return spy.provideHover(document, position, token);
		}
	});

	spy.run(context, true);
}
