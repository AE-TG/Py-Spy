import * as vscode from 'vscode';
import * as spyFS from './spyFS';
import { PythonShell } from 'python-shell'


export function build() {
    vscode.window.showInformationMessage('PySpy: compiling in background.');
    const opt = {} as vscode.TerminalOptions;
    opt.location = vscode.TerminalLocation.Panel;
    opt.hideFromUser = true;
    opt.isTransient = true;
    const term = vscode.window.createTerminal(opt);
    const spySet = spyFS.getSpyFiles();
    spySet.forEach(file => {
        console.log("PySpy: attempting to compile " + file);
        term.sendText('python -m py_compile ' + file, true);
    });

    //TODO AST here?
}

export async function functionAnalysis(ctx: vscode.ExtensionContext) {
    let fList: string[] = []
    const pyVersion = "312"; // TODO configurable version (read it from terminal?)

    const spySet = spyFS.getSpyFiles();
    spySet.forEach(async file => {
        
        // TODO is there a better way to do this?
        // VSCode inherently operates in URI, pythonshell needs a path string, and the Uri module offers NO WAY to go between in a platform-agnostic manner
        file = file.replaceAll("\\", "/");
        const pathRoot = file.substring(0, file.lastIndexOf("/"));
        const fileName = file.substring(file.lastIndexOf("/"), file.lastIndexOf(".py"));
        const pycFile = pathRoot + "/__pycache__" + fileName + ".cpython-" + pyVersion + ".pyc";

        let options = {
            scriptPath: ctx.extensionPath,
            args: ["-f", pycFile]
        };
        await PythonShell.run("src/spyMarshal.py", options).then(messages => {
            console.log("spyMarshal found python function with data:");
            messages.forEach(msg => {
                console.log(msg);
                fList.push(msg);
            });
        });
    });

    fList = fList.filter((fn) => spyFS.getSpyFns().map(decoType => decoType[1]).includes(fn));
    console.log(fList);
    return fList;
}
