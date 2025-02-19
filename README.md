# **spy** README

This is the README for your extension "spy". After writing up a brief description, we recommend including the following sections.

## Features

- Automatically attaches to documents in workspaces with the python language active
- Highlights instances of the `@spy` decorator
    - Does NOT yet provide a definition for the decorator
- Collates "interesting" data values for plain-old-data function arguments to use as test inputs

## Requirements

Extension should automatically install the required **Python-Shell** package from **npm**.

## Implementation Details

As **spy** is a learning experiment for writing VSCode extensions, it's worth documenting how it works.
1. Extension Setup
- The extension registers itself with an activation event of "onLanguage:python". Thus when VSCode opens a file and loads the user's language spec for python for the first time in a session, `extension.ts::activate()` is executed.
- `activate()` performs the following things:
    - First time setup (defining some values for later use)
    - Registering UI events (`onDidChangeActiveTextEditor` and `onDidChangeTextDocument`) to run UI updates only when potentially useful
    - Starting a thread to run the rest of the **spy** functionality every 15 seconds
2. Structure
- `package.json`: Extension manifest and description
- `src/extension.ts`: entrypoint
- `src/spy.ts`: Top-level file for **spy** features. This currently includes the 15-second loop which compiles python files found in the workspace as a basic syntax check.
- `src/spyInputs.ts`: Manages the creation of "interesting" inputs for input checking functions.
- `src/spyUI.ts`: Manages the creation and application of VSCode UI elements for the extension using a `vscode.TextEditorDecorationType`.
- `src/spyMarshal.py`: Python script for the marshaling of python bytecode, used to inspect functions as part of the testing features.
3. UI
- 
4. Analysis
- TBD
5. Testing
- TBD

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.



## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
