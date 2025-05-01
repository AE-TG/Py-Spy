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

export async function coverageTest(filename: string, lines: number[], danger: boolean) {
    let options = {
        scriptPath: xPath,
        args: ["-w", spyFS.getFileFromPath(filename)[0], "-f", filename, "-l"]
    };
    if (danger) {
        options.args.splice(4, 0, "-d");
    }
    lines.forEach(line => {
        options.args.push(String(line))
    });
    spyTesting.clearTestReportHovers(filename);
    await PythonShell.run("src/spyCoverage.py", options).then(messages => {
        messages.forEach(msg => {
            testMessageHandler(filename, msg);
        });
    });
}

function testMessageHandler(filename: string, msg: string) {
    if (msg.startsWith("[E} ")) {
        console.error(msg)
        try {
            const report = msg.split(" ")
            const lineno = parseInt(report[1]);
            const info = report.slice(2).join(" ")
            spyTesting.addTestReportHover(filename, lineno, info);
        }
        catch {
            // serious error not attached to a line number - alert user
            vscode.window.showErrorMessage(msg.substring(4));
        }
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
    if (msg.startsWith("[I} ")) {
        console.log(msg)
    }
}
