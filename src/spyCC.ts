import * as vscode from 'vscode';
import * as spyFS from './spyFS';
import * as spyUI from './spyUI';
import fs from 'fs';

export async function getComplexity(highlight: spyUI.spyDeco, cancel: vscode.CancellationToken) {
    let cfg = vscode.workspace.getConfiguration("spy");
    let radon = cfg.get("RadonInstallLocation", false);

    if (radon) {
        // Radon found, assume the user wants this feature.
        const outputName = "radon" + spyFS.cleanPathChars(highlight[0].fileName);
        const outputPath = radon + "/" + outputName;

        // If there is recent (<10sec old) Radon data for this file, use it.
        if (fs.existsSync(outputPath)) {
            if (Date.now() - fs.statSync(outputPath).mtimeMs < 10000) {
                // TODO: change this to be a vscode ws ondocumentsaved event to delete and remake the cache file.
                // Otherwise there's annoying behaviour where you have you mouse something twice to get feedback
                // whenever the timer rolls because VSCode destroys the hover request very quickly.
                const cacheResult = loadRadonCacheFile(outputPath, highlight[1]);
                return new vscode.Hover(cacheResult, highlight[1]);
            }
            else {
                // cache outdated, delete it
                fs.rmSync(outputPath, { } );
            }
        }

        console.log("PySpy: spyCC generating radon cache for " + highlight[0].fileName);
        // No (recent) Radon data - run Radon to generate it
        const opt = {} as vscode.TerminalOptions;
        opt.location = vscode.TerminalLocation.Panel;
        opt.hideFromUser = true;
        opt.isTransient = true;
        const term = vscode.window.createTerminal(opt);
        term.sendText('cd ' + radon, true);
        term.sendText('./radon cc -s ' + highlight[0].fileName + " > " + outputName);
        
        const radonOutput = loadRadonCacheFile(outputPath, highlight[1]);
        return new vscode.Hover(radonOutput, highlight[1]);
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
