import * as vscode from 'vscode';


let highlight: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({});
export function createDecorations(ctx: vscode.ExtensionContext) {
    // set up pink highlighting for editors SPY decorators
    const renderOptions = {} as vscode.DecorationRenderOptions;
    renderOptions.backgroundColor = "#FF22AA66";
    renderOptions.gutterIconPath = ctx.asAbsolutePath("assets/play_16.png");
    renderOptions.gutterIconSize = "auto";
    renderOptions.isWholeLine = true;
    highlight = vscode.window.createTextEditorDecorationType(renderOptions);
}

let updateTimer: NodeJS.Timeout | undefined = undefined;
export function updateDecorations(ctx: vscode.ExtensionContext, delay: number = 1000) {
    // limit the UI updates to when the user is inactive for 1000ms or longer
    if (updateTimer) {
        clearTimeout(updateTimer);
        updateTimer = undefined;
    }
    updateTimer = setTimeout(applyDecorations, delay, ctx);
}

function applyDecorations(ctx: vscode.ExtensionContext) {
    // get all the open editor windows that are python files with SPY decorators
    vscode.window.visibleTextEditors.forEach(ed => {
        let doc = ed.document;
        if (doc.fileName.endsWith(".py")) {
            console.log("spyUI scanning " + doc.fileName);

            let spyDecoratorRanges: vscode.Range[] = [];
            for(var lineIndex = 1; lineIndex < doc.lineCount; lineIndex++) {
                if (doc.lineAt(lineIndex).text.startsWith("def ")) {
                    if (doc.lineAt(lineIndex - 1).text.startsWith("@spy")) {
                        console.log("spyUI found decorator on line " + lineIndex);
                        spyDecoratorRanges.push(doc.lineAt(lineIndex - 1).range);
                    }
                }
            }
            
            // Remove old decorations before applying new ones.
            ed.setDecorations(highlight, []);
            ed.setDecorations(highlight, spyDecoratorRanges);
        }
    });
}
