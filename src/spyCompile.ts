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

export const python: { version: string } = { version: "undefined" };
export async function removeBuildFile(file: string) {
    const [path, fileName] = spyFS.getFileFromPath(file);
    const fullName = path + '/__pycache__/' + fileName.split(".py").at(0) + ".cpython-" + python.version + ".pyc";

    console.log("PySpy: attempting to delete " + fullName);
    vscode.workspace.fs.delete(vscode.Uri.file(fullName));
}
