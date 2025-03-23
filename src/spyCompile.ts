import * as spyFS from './spyFS';
import * as vscode from 'vscode';


export function build(file?: vscode.TextDocument): void {
    const opt = {} as vscode.TerminalOptions;
    opt.location = vscode.TerminalLocation.Panel;
    opt.hideFromUser = true;
    opt.isTransient = true;
    const term = vscode.window.createTerminal(opt);
    if (file)
    {
        console.log("PySpy: attempting to compile " + file.fileName);
        term.sendText('python -m py_compile ' + file.fileName, true);
    }
    else {
        const spySet = spyFS.getSpyFiles();
        spySet.forEach(file => {
            console.log("PySpy: attempting to compile " + file);
            term.sendText('python -m py_compile ' + file, true);
        });
    }
}
