import * as vscode from 'vscode';


// set up decoration types for SPY callouts in editor
let pinkHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let greenFaintHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let redFaintHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
export function createDecorations(ctx: vscode.ExtensionContext) {
    const pinkRenderOptions = {} as vscode.DecorationRenderOptions;
    pinkRenderOptions.backgroundColor = "#FF339977";
    pinkRenderOptions.gutterIconPath = ctx.asAbsolutePath("assets/play_16.png");
    pinkRenderOptions.gutterIconSize = "auto";
    pinkRenderOptions.isWholeLine = true;
    pinkHighlight = vscode.window.createTextEditorDecorationType(pinkRenderOptions);

    const greenFaintRenderOptions = {} as vscode.DecorationRenderOptions;
    greenFaintRenderOptions.backgroundColor = "#00AA0022";
    greenFaintRenderOptions.isWholeLine = true;
    greenFaintHighlight = vscode.window.createTextEditorDecorationType(greenFaintRenderOptions);

    const redFaintRenderOptions = {} as vscode.DecorationRenderOptions;
    redFaintRenderOptions.backgroundColor = "#BB000022";
    redFaintRenderOptions.isWholeLine = true;
    redFaintHighlight = vscode.window.createTextEditorDecorationType(redFaintRenderOptions);
}

let updateTimer: NodeJS.Timeout | undefined = undefined;
export function updateDecorations(ctx: vscode.ExtensionContext, delay: number = 1000) {
    // limit the UI updates to when the user is inactive for 1000ms or longer
    resetCoverageDecoLists(); // it would be great to adjust these up and down as edits are made rather than delete entirely, but that is a whole barrel of context issues.
    if (updateTimer) {
        clearTimeout(updateTimer);
        updateTimer = undefined;
    }
    updateTimer = setTimeout(applyDecorations, delay);
}

// Let other spy functionality discover where to focus
export type spyDeco = [file: vscode.TextDocument, range: vscode.Range, line: number];
let spyDecoList: spyDeco[] = []
export function getSpyDecos(file?: vscode.TextDocument) {
    if (file) {
        return spyDecoList.filter((deco) => (deco[0] == file));
    }
    return spyDecoList;
}

// Manage code coverage highlights
let spyCoveragePassList: spyDeco[] = []
let spyCoverageFailList: spyDeco[] = []
export function resetCoverageDecoLists(file?: vscode.TextDocument) {
    if (file) {
        // remove elements that match the file
        spyCoveragePassList = spyCoveragePassList.filter((element) => (element[0] != file));
        spyCoverageFailList = spyCoverageFailList.filter((element) => (element[0] != file));
    }
    else {
        // remove all decos
        spyCoveragePassList = [];
        spyCoverageFailList = [];
    }
}
export function addCoverageDeco(newDeco: spyDeco, pass: boolean) {
    if (pass) {
        spyCoveragePassList.push(newDeco);
    }
    else {
        spyCoverageFailList.push(newDeco);
    }
}

function applyDecorations() {
    // get only the open editor windows that are python files with SPY decorators
    vscode.window.visibleTextEditors.forEach(ed => {
        spyDecoList = [];
        let doc = ed.document;
        if (doc.fileName.endsWith(".py")) {
            console.log("spyUI scanning " + doc.fileName);

            // #spy tag highlights
            let spyPinkRanges: vscode.Range[] = [];
            for(var lineIndex = 1; lineIndex < doc.lineCount; lineIndex++) {
                if (doc.lineAt(lineIndex).text.startsWith("def ")) {
                    if (doc.lineAt(lineIndex - 1).text.startsWith("#spy")) {
                        console.log("spyUI found tag on line " + lineIndex);
                        spyPinkRanges.push(doc.lineAt(lineIndex - 1).range);
                        const range = getTagFnRange(doc, lineIndex);
                        spyDecoList.push([doc, range, lineIndex]);
                    }
                }
            }

            // code coverage pass/fail highlights
            let spyGreenFaintRanges: vscode.Range[] = [];
            spyCoveragePassList.forEach(deco => {
                if (deco[0] == doc) {
                    spyGreenFaintRanges.push(deco[1]);
                }
            });
            let spyRedFaintRanges: vscode.Range[] = [];
            spyCoverageFailList.forEach(deco => {
                if (deco[0] == doc) {
                    spyRedFaintRanges.push(deco[1]);
                }
            });


            // Remove old decorations before applying new ones.
            ed.setDecorations(pinkHighlight, []);
            ed.setDecorations(pinkHighlight, spyPinkRanges);
            ed.setDecorations(greenFaintHighlight, []);
            ed.setDecorations(greenFaintHighlight, spyGreenFaintRanges);
            ed.setDecorations(redFaintHighlight, []);
            ed.setDecorations(redFaintHighlight, spyRedFaintRanges);
        }
    });
}

function getTagFnRange(doc: vscode.TextDocument, line: number) {
    // Take advantage of python indentation requirements.
    const remaindertext = doc.getText(new vscode.Range(line, 0, doc.lineCount, 0)).split('\n');
    const indent = getIndent(remaindertext[0])
    for (let i = 1; i < remaindertext.length; i++) {
        if (getIndent(remaindertext[i]) <= indent) {
            return new vscode.Range(line + 2, 0, line + i, 0);
        }
    }
    console.warn("No end range found, assuming EOF...");
    return new vscode.Range(line + 2, 0, line + doc.lineCount, 0);
}

function getIndent(text: string) : number {
    return text.indexOf(text.trimStart())
}

export function removeDecorations() {
    vscode.window.visibleTextEditors.forEach(ed => {
        ed.setDecorations(pinkHighlight, []);
        ed.setDecorations(greenFaintHighlight, []);
        ed.setDecorations(redFaintHighlight, []);
    });
}
