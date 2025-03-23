import * as vscode from 'vscode';


export function build(file: string): void {
    const opt = {} as vscode.TerminalOptions;
    opt.location = vscode.TerminalLocation.Panel;
    opt.hideFromUser = true;
    opt.isTransient = true;
    const term = vscode.window.createTerminal(opt);
    console.log("PySpy: attempting to compile " + file);
    term.sendText('python -m py_compile ' + file, true);
}
