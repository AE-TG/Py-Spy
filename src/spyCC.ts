import * as vscode from 'vscode';
import * as spyFS from './spyFS';
import * as spyUI from './spyUI';
import fs from 'fs';

let radonWhere: string | boolean = false;
export function generateRadonCache(files: Set<string> | string[]) {
    let cfg = vscode.workspace.getConfiguration("spy");
    radonWhere = cfg.get("RadonInstallLocation", false);

    if (radonWhere) {
        // Radon found, assume the user wants this feature.
        const opt = {} as vscode.TerminalOptions;
        opt.location = vscode.TerminalLocation.Panel;
        opt.hideFromUser = true;
        opt.isTransient = true;
        const term = vscode.window.createTerminal(opt);
        term.sendText('cd ' + radonWhere, true);

        files.forEach(file => {
            console.log("PySpy: spyCC generating radon cache for " + file);
            const outputName = "radon" + spyFS.cleanPathChars(file);

            term.sendText('./radon cc -s ' + file + " -O " + outputName);
        });
    }
}

export async function getComplexity(highlight: spyUI.spyDeco, cancel: vscode.CancellationToken) {
    if (radonWhere) {
        const outputName = "radon" + spyFS.cleanPathChars(highlight[0].fileName);
        const outputPath = radonWhere + "/" + outputName;

        // If there is no Radon data for this file, make it.
        if (!fs.existsSync(outputPath)) {
            generateRadonCache([highlight[0].fileName]);
        }
    
        const cacheResult = loadRadonCacheFile(outputPath, highlight[2] + 1); // the highlight is for the @spy decorator, increment by 1 to get the function
        return new vscode.Hover(cacheResult, highlight[1]);
    }
    else {
        cancel.isCancellationRequested = true;
        return new vscode.Hover("**PySpy** Radon integration not found.", highlight[1]);
    }   
}

function loadRadonCacheFile(cacheFilePath: string, lineNumber: number) : string {
    const rawRadon: string = fs.readFileSync(cacheFilePath).toString();
    if (rawRadon.length <= 0) {
        return "**PySpy** failed to load Radon results for this function.";
    }

    let lines = rawRadon.split('\n');
    lines = radonOutputFilter(lines);
    lines = lines.filter((fn) => radonCCFilter(fn, lineNumber));
    if (lines.length > 1) {
        console.log("PySpy: Radon cache file had multiple entries for the same function!");
        lines.forEach(line => {
            console.log("        > " + line);
        });
        console.log("Using first...");
    }

    // Extract CC number from line
    const complexityScore = lines[0].split(" ").at(-2)?.slice(1, -1);
    return "Cyclomatic Complexity: " + complexityScore;
}

function radonOutputFilter(rawLines: string[]) : string[] {
    // Radon's -O option also writes control and escape sequences; remove them.
    let rv: string[] = [];
    const rawRadon = new RegExp('(\\u001b\[[0-9]+m)', 'gm');
    const extraWhitespace = new RegExp('\\s{2,}', 'gm');
    rawLines.forEach(line => {
        const filt0 = line.replace(rawRadon, " ");
        const filt1 = filt0.replace(extraWhitespace, " ");
        rv.push(filt1);
    });
    return rv;
}

function radonCCFilter(ccLine: string, lineNumber: number) : boolean {
    if (ccLine.includes(" F " + lineNumber + ":") || ccLine.includes(" M " + lineNumber + ":")) {
        // radon filter matches the expected line number
        return true;
    }
    return false;
}
