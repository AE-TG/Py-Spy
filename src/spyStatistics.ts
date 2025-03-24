import * as spyFS from './spyFS';
import * as spyUI from './spyUI';
import * as vscode from 'vscode';
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
            console.log("PySpy: spyStatistics generating radon cache for " + file);
            const outputName = "radon" + spyFS.cleanPathChars(file);

            term.sendText('./radon cc -s ' + file + " -O " + outputName + "cc");
            term.sendText('./radon hal -f ' + file + " -O " + outputName + "hal");
        });
    }
}

export function deleteRadonCache(files: Set<string> | string[]) {
    if (radonWhere) {
        const opt = {} as vscode.TerminalOptions;
        opt.location = vscode.TerminalLocation.Panel;
        opt.hideFromUser = true;
        opt.isTransient = true;
        const term = vscode.window.createTerminal(opt);
        term.sendText('cd ' + radonWhere, true);

        files.forEach(file => {
            const outputName = "radon" + spyFS.cleanPathChars(file);
            let [path, fileName] = spyFS.getFileFromPath(radonWhere + "/" + outputName);
            let fullNameCC = path + "/" + fileName + "cc";
            let fullNameHal = path + "/" + fileName + "hal";
            
            console.log("PySpy: removing radon cache for " + fullNameCC);
            term.sendText('Remove-Item ' + fullNameCC, true); // Powershell
            term.sendText('rm ' + fullNameCC, true); // *nix
            term.sendText('del /q ' + spyFS.windowsify(fullNameCC), true); // Windows
            console.log("PySpy: removing radon cache for " + fullNameHal);
            term.sendText('Remove-Item ' + fullNameHal, true); // Powershell
            term.sendText('rm ' + fullNameHal, true); // *nix
            term.sendText('del /q ' + spyFS.windowsify(fullNameHal), true); // Windows
        });
    }
}

export async function getComplexity(highlight: spyUI.spyDeco, cancel: vscode.CancellationToken) {
    if (radonWhere) {
        const outputName = "radon" + spyFS.cleanPathChars(highlight[0].fileName);
        const outputPath = radonWhere + "/" + outputName;

        // If there is no Radon data for this file, make it.
        if (!fs.existsSync(outputPath+"cc") || !fs.existsSync(outputPath+"hal")) {
            generateRadonCache([highlight[0].fileName]);
        }
    
        const cacheResult = loadRadonResults(outputPath, highlight[2] + 1); // the highlight is for the @spy decorator, increment by 1 to get the function
        return new vscode.Hover(cacheResult, highlight[1]);
    }
    else {
        cancel.isCancellationRequested = true;
        return new vscode.Hover("**PySpy** Radon integration not found.", highlight[1]);
    }   
}

function loadRadonResults(cacheFilePath: string, lineNumber: number) : string {
    const [ccScore, halDScore] = loadRadonCacheFiles(cacheFilePath, lineNumber);
    return ("*Complexity Score:* " + ccScore + " | *Halstead Difficulty:* " + halDScore);
}

function loadRadonCacheFiles(cacheFilePath: string, lineNumber: number) : [string, string] {
    const rawRadonCC = fileAsString(cacheFilePath+"cc");
    const rawRadonHal = fileAsString(cacheFilePath+"hal");
    let processedRadonCC: string[] = [];

    let cc: string = "N/A";
    let halD: string = "N/A";
   
    if (rawRadonCC) {
        let lines = rawRadonCC.split('\n');
        processedRadonCC = radonOutputFilter(lines);
        lines = processedRadonCC.filter((fn) => radonCCLineFilter(fn, lineNumber));
        cc = lines[0].replace('\r',"");
    }
    if (rawRadonHal && rawRadonCC) {
        // extracting the Halstead Difficulty from Radon output requires knowing the function name,
        // which can be extracted from the CC output.
        const fName = cc.split(" ").at(3);
        // In case the function is overloaded, identify which instance specifically is hovered.
        const fWhich = radonCCLineCount(processedRadonCC, lineNumber, fName);

        let lines: any = rawRadonHal.split('\n');
        lines = radonOutputFilter(lines).join('\n');
        lines = radonHalFunctionFilter(lines, fName, fWhich);

        // `lines` here is the entire Halstead metric block.
        halD = lines[9].replace('\r',""); // just the difficulty score
    }

    // Extract score number from lines
    const ccScore = cc?.split(" ").at(-2)?.slice(1, -1) ?? "N/A";
    const halDScore = halD?.split(" ").at(-1) ?? "N/A"
    return [ccScore, halDScore];
}

function fileAsString(fileName: string) : string|undefined {
    const rawRadon: string = fs.readFileSync(fileName).toString();
    if (rawRadon.length <= 0) {
        return;
    }
    return rawRadon;
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

function radonCCLineFilter(ccLine: string, lineNumber: number) : boolean {
    if (ccLine.includes(" F " + lineNumber + ":") || ccLine.includes(" M " + lineNumber + ":")) {
        // radon filter matches the expected line number
        return true;
    }
    return false;
}

function radonCCLineCount(lines: string[], lineNumber: number, fName: string|undefined) : number {
    if (lines && fName) {
        const instanceString = " " + fName + " -";
        lines = lines.filter((line) => line.includes(instanceString));

        // Radon cc provides no guarantee of overloaded functions appearing in order. sigh.
        let instances: number[] = extractLineNumbers(lines.join('\n'));
        instances.sort((a, b) => a - b);
        return (instances.indexOf(lineNumber));
    }
    return 0;
}

function extractLineNumbers(lines: string) {
    const regex = new RegExp('([0-9]+):[0-9]+', 'gm');
    const matches = lines.matchAll(regex);
    // matchAll returns a custom, incomplete iterator over an REEA-type, which is
    // the most unusable return type known to mankind. change it into something useful
    return [...matches].flatMap((reea) => reea[1]).map((m) => Number(m)) ?? [];
}

function radonHalFunctionFilter(lines: string, fName: string|undefined, fWhich: number) : string[] {
    if (fName) {
        const regex = new RegExp('('+fName+':\\s+h1:.*\\s+h2:.*\\s+N1:.*\\s+N2:.*\\s+vocabulary:.*\\s+length:.*\\s+calculated_length:.*\\s+volume:.*\\s+difficulty:.*\\s+effort:.*\\s+time:.*\\s+bugs:.*)', 'gm');
        const matches = lines.matchAll(regex);
        // matchAll returns a custom, incomplete iterator over an REEA-type, which is
        // the most unusable return type known to mankind. change it into something useful
        return [...matches][fWhich][1].split('\n');
    }
    return [];
}
