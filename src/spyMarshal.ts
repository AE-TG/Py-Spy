import * as spyFS from './spyFS';
import * as spyTesting from './spyTesting';
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
        args: ["-w", spyFS.getFileFromPath(filename)[0],"-f", filename, "-l"]
    };
    lines.forEach(line => {
        options.args.push(String(line))
    });
    await PythonShell.run("src/spyCoverage.py", options).then(messages => {
        messages.forEach(msg => {
            messageHandler(filename, msg);
        });
    });
}

function messageHandler(filename: string, msg: string) {
    if (msg.startsWith("[E} ")) {
        console.error(msg)
        // TODO - if we get a serious error, consider finding a way to addTestReportHover tag for each function in the file
    }
    if (msg.startsWith("[W} ")) {
        console.warn(msg)
        try {
            const report = msg.split("Testing function at line ")[1].split(" ")
            const lineno = parseInt(report[0]);
            const info = report.slice(1).join(" ")
            spyTesting.addTestReportHover(filename, lineno, info);
        }
        catch {
            // message from python was not a test report.
        }
    } 
}


