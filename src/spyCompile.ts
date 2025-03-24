import * as spyFS from './spyFS';
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

export function removeBuildFile(file: string): void {
    const opt = {} as vscode.TerminalOptions;
    opt.location = vscode.TerminalLocation.Panel;
    opt.hideFromUser = true;
    opt.isTransient = true;
    const term = vscode.window.createTerminal(opt);

    let [path, fileName] = spyFS.getFileFromPath(file);
    let fullName = path + '/__pycache__/' + fileName.split(".py").at(0) + ".cpython-312.pyc";

    console.log("PySpy: attempting to delete " + fullName);
    term.sendText('Remove-Item ' + fullName, true); // Powershell
    term.sendText('rm ' + fullName, true); // *nix
    term.sendText('del /q ' + spyFS.windowsify(fullName), true); // Windows
}
