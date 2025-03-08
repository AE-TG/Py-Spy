import * as vscode from 'vscode';


// set up decoration types for SPY callouts in editor
let pinkHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let greenFaintHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
let redFaintHighlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
export function createDecorations(ctx: vscode.ExtensionContext) {
    const pinkRenderOptions = {} as vscode.DecorationRenderOptions;
    pinkRenderOptions.backgroundColor = "#FF22AA77";
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
    if (updateTimer) {
        clearTimeout(updateTimer);
        updateTimer = undefined;
    }
    updateTimer = setTimeout(applyDecorations, delay);
}

export type spyDeco = [file: vscode.TextDocument, range: vscode.Range];
let spyDecoList: spyDeco[] = []
export function getSpyDecos() {
    return spyDecoList;
}

function applyDecorations() {
    // get only the open editor windows that are python files with SPY decorators
    vscode.window.visibleTextEditors.forEach(ed => {
        spyDecoList = [];
        let doc = ed.document;
        if (doc.fileName.endsWith(".py")) {
            console.log("spyUI scanning " + doc.fileName);

            let spyDecoratorRanges: vscode.Range[] = [];
            for(var lineIndex = 1; lineIndex < doc.lineCount; lineIndex++) {
                if (doc.lineAt(lineIndex).text.startsWith("def ")) {
                    if (doc.lineAt(lineIndex - 1).text.startsWith("@spy")) {
                        console.log("spyUI found decorator on line " + lineIndex);
                        spyDecoratorRanges.push(doc.lineAt(lineIndex - 1).range);
                        spyDecoList.push([doc, doc.lineAt(lineIndex - 1).range]);
                    }
                }
            }

            // Remove old decorations before applying new ones.
            ed.setDecorations(pinkHighlight, []);
            ed.setDecorations(pinkHighlight, spyDecoratorRanges);
        }
    });
}
