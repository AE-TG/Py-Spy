import * as vscode from 'vscode';

export function scan() {
// TODO look for @spy\ndef
// TODO actually do ui

     

    // set up pink highlighting for editors SPY decorators
    const renderOptions = {} as vscode.DecorationRenderOptions;
    renderOptions.backgroundColor = "#FF22AA66";
    //TODO - gutter button icon
    // renderOptions.gutterIconPath
    renderOptions.gutterIconSize = "auto";
    const decoType = vscode.window.createTextEditorDecorationType(renderOptions);

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
            
            //TODO - this increases the deco brightness over time due to transparency overwrites, as if decotype is not matched.
            ed.setDecorations(decoType, spyDecoratorRanges);
        }
    });

}
