import * as vscode from 'vscode'; // VS Code extension API
import * as spy from './spy'; // spy only exports top-level functionality

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('extension "spy" is active');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable1 = vscode.commands.registerCommand('spy.startautocompile', () => {
		spy.run(true);
	});
	const disposable2 = vscode.commands.registerCommand('spy.stopautocompile', () => {
		spy.run(false);
	});

	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {
	spy.run(false);
}
