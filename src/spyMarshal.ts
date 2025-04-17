import * as spyFS from './spyFS';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';
import { PythonShell } from 'python-shell'

let xPath: string;
export function getPyVersion(ctx: vscode.ExtensionContext) {
    xPath = ctx.extensionPath
    const versionInfo = PythonShell.getVersionSync()
    const versionParts = versionInfo.split(" ")[1].trim().split(".");
    return versionParts[0] + versionParts[1];
}

export async function coverageTest(filename: string, lines: number[]) {
    let options = {
        scriptPath: xPath,
        // TODO
        args: ["-f", filename, "-l"]
    };
    lines.forEach(line => {
        options.args.push(String(line))
    });
    await PythonShell.run("src/spyMarshal.py", options).then(messages => {
        messages.forEach(msg => {
            messageHandler(msg);
        });
    });
}

function messageHandler(msg: string) {
    if (msg.startsWith("[E} ")) {
        console.error(msg)
    }
    if (msg.startsWith("[W} ")) {
        console.warn(msg)
    } 
}


