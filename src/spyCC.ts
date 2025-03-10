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
            
            // Radon's -O option also writes control and escape sequences so avoid that for now.
            term.sendText('./radon cc -s ' + file + " > " + outputName);
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
    
        const cacheResult = loadRadonCacheFile(outputPath, highlight[1]);
        return new vscode.Hover(cacheResult, highlight[1]);
    }
    else {
        cancel.isCancellationRequested = true;
        return new vscode.Hover("**PySpy** Radon integration not found.", highlight[1]);
    }   
}

function loadRadonCacheFile(cacheFilePath: string, range: vscode.Range) : string {
    const rawRadon: string = fs.readFileSync(cacheFilePath).toString();
    if (rawRadon.length <= 0) {
        return "**PySpy** failed to load Radon results for this function.";
    }

    // strip first line
    const r1 = rawRadon.substring(rawRadon.indexOf('\n'));
    // strip spaces
    const r2 = r1.replaceAll(' ',"");
    // TODO only report this function using range manipulation
    // TODO markup and prettify

    return r2;
}
