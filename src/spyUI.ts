import * as spyTesting from './spyTesting';
import * as vscode from 'vscode';


// set up decoration types for SPY callouts in editor
let pinkUnknownHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let pinkPassHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let pinkFailHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let greenFaintHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let redFaintHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
export function createDecorations(ctx: vscode.ExtensionContext) {
    const pinkUnknownRenderOptions = {} as vscode.DecorationRenderOptions;
    pinkUnknownRenderOptions.backgroundColor = "#FF339977";
    pinkUnknownRenderOptions.gutterIconPath = ctx.asAbsolutePath("assets/question_16.png");
    pinkUnknownRenderOptions.gutterIconSize = "auto";
    pinkUnknownRenderOptions.isWholeLine = true;
    pinkUnknownHighlight = vscode.window.createTextEditorDecorationType(pinkUnknownRenderOptions);

    const pinkPassRenderOptions = {} as vscode.DecorationRenderOptions;
    pinkPassRenderOptions.backgroundColor = "#FF339977";
    pinkPassRenderOptions.gutterIconPath = ctx.asAbsolutePath("assets/play_16.png");
    pinkPassRenderOptions.gutterIconSize = "auto";
    pinkPassRenderOptions.isWholeLine = true;
    pinkPassHighlight = vscode.window.createTextEditorDecorationType(pinkPassRenderOptions);

    const pinkFailRenderOptions = {} as vscode.DecorationRenderOptions;
    pinkFailRenderOptions.backgroundColor = "#FF339977";
    pinkFailRenderOptions.gutterIconPath = ctx.asAbsolutePath("assets/stop_16.png");
    pinkFailRenderOptions.gutterIconSize = "auto";
    pinkFailRenderOptions.isWholeLine = true;
    pinkFailHighlight = vscode.window.createTextEditorDecorationType(pinkFailRenderOptions);

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
export function updateDecorations(delay: number = 1000) {
    // limit the UI updates to when the user is inactive for 1000ms or longer
    if (updateTimer) {
        clearTimeout(updateTimer);
        updateTimer = undefined;
    }
    updateTimer = setTimeout(applyDecorations, delay, true);
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

let coverageTimer: NodeJS.Timeout | undefined = undefined;
export function addCoverageDeco(newDeco: spyDeco, pass: boolean) {
    if (pass) {
        spyCoveragePassList.push(newDeco);
    }
    else {
        spyCoverageFailList.push(newDeco);
    }
    // Let the coverage test report parser make changes for up to 150ms before showing them.
    if (coverageTimer) {
        clearTimeout(coverageTimer);
        coverageTimer = undefined;
    }
    coverageTimer = setTimeout(applyDecorations, 150);
}

function applyDecorations(checkTests?:boolean) {
    // get only the open editor windows that are python files with SPY decorators
    vscode.window.visibleTextEditors.forEach(ed => {
        spyDecoList = [];
        let doc = ed.document;
        if (doc.fileName.endsWith(".py")) {
            console.log("spyUI scanning " + doc.fileName);

            // #spy tag highlights
            for(var lineIndex = 1; lineIndex < doc.lineCount; lineIndex++) {
                if (doc.lineAt(lineIndex).text.trim().startsWith("def ")) {
                    if (doc.lineAt(lineIndex - 1).text.trim().startsWith("#spy")) {
                        console.log("spyUI found tag on line " + (lineIndex - 1));
                        const range = getTagFnRange(doc, lineIndex);
                        spyDecoList.push([doc, range, lineIndex]);
                    }
                }
            }

            // If there's a code coverage report lying around, parse it
            if (checkTests) {
                spyTesting.parseCovReport(doc.fileName, spyDecoList);
            }

            // If code coverage pass/fail highlights are ready to show, apply them
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

            // Convert pink tag highlights to pass/fail markers
            let spyPinkUnknownRanges: vscode.Range[] = [];
            let spyPinkPassRanges: vscode.Range[] = [];
            let spyPinkFailRanges: vscode.Range[] = [];
            spyDecoList.forEach(deco => {
                if(spyTesting.getTestReportHovers(deco[0].fileName, deco[2])) {
                    // There is a failing test report for this tagged function
                    spyPinkFailRanges.push(doc.lineAt(deco[2] - 1).range)
                }
                else {
                    // If there are green highlights waiting to be applied, we know this was tested
                    // This isn't strictly true - it may be preferable to default to fail/unknown rather than pass
                    if (spyGreenFaintRanges.length > 0)
                    {
                        spyPinkPassRanges.push(doc.lineAt(deco[2] - 1).range)
                    }
                    // otherwise tests not yet run
                    else 
                    {
                        spyPinkUnknownRanges.push(doc.lineAt(deco[2] - 1).range)
                    }
                }
            });


            // Remove old decorations before applying new ones.
            ed.setDecorations(pinkUnknownHighlight, []);
            ed.setDecorations(pinkUnknownHighlight, spyPinkUnknownRanges);
            ed.setDecorations(pinkPassHighlight, []);
            ed.setDecorations(pinkPassHighlight, spyPinkPassRanges);
            ed.setDecorations(pinkFailHighlight, []);
            ed.setDecorations(pinkFailHighlight, spyPinkFailRanges);
            ed.setDecorations(greenFaintHighlight, []);
            ed.setDecorations(greenFaintHighlight, spyGreenFaintRanges);
            ed.setDecorations(redFaintHighlight, []);
            ed.setDecorations(redFaintHighlight, spyRedFaintRanges);
        }
    });
}

// Convert a #spy tag into a range representing its function
function getTagFnRange(doc: vscode.TextDocument, line: number) {
    // Take advantage of python indentation requirements.
    // coverage.py also uses indents to track exclusion blocks.
    const remaindertext = doc.getText(new vscode.Range(line, 0, doc.lineCount, 0)).split('\n');
    const indent = getIndent(remaindertext[0])
    // TODO There is a possibility of causing incorrect coverage highlights for functions with multiline function definitions.
    for (let i = 1; i < remaindertext.length; i++) {
        if (getIndent(remaindertext[i]) <= indent) {
            return new vscode.Range(line + 2, 0, line + i, 0);
        }
    }
    console.warn("No end range found, assuming EOF...");
    return new vscode.Range(line + 2, 0, line + doc.lineCount, 0);
}

// Convert a range encapsulating a python function to a range representing its #spy tag
export function getFnTagRange(doc: vscode.TextDocument, range: vscode.Range) {
    const startLine = range.start.line;
    // TODO There is a possibility of causing incorrect coverage highlights for functions with multiline function definitions.
    return doc.lineAt(startLine - 3).range;
}

function getIndent(text: string) : number {
    return text.indexOf(text.trimStart())
}

export function removeDecorations() {
    vscode.window.visibleTextEditors.forEach(ed => {
        ed.setDecorations(pinkUnknownHighlight, []);
        ed.setDecorations(pinkPassHighlight, []);
        ed.setDecorations(pinkFailHighlight, []);
        ed.setDecorations(greenFaintHighlight, []);
        ed.setDecorations(redFaintHighlight, []);
    });
}
