# **spy** README

This is the README for your extension "spy". After writing up a brief description, we recommend including the following sections.

## Features

- Automatically attaches to documents in workspaces with the python language active
- Highlights instances of the `@spy` decorator
    - Does NOT yet provide a definition for the decorator
    - Mousing over the highlight provides code complexity characteristics as determined by Radon (http://radon.readthedocs.org/).
- Collates "interesting" data values for plain-old-data function arguments to use as test inputs

## Requirements

- **Visual Studio Code**
- **Node.js**
- Extension should automatically install the required **Python-Shell** package from **npm**.
- Radon integration optional

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
- TBD
4. Analysis
- TBD
5. Testing
- TBD

## Extension Settings

* `spy.RadonInstallLocation`: Path to the Radon executable. Needs to be installed separately (for now) with `pip install radon`. A successful install should list the path; note that Windows expects escaped backslashes.






## Building and Running From Source
1. Open a new Visual Studio Code workspace in the repository directory.
2. Press `F5` to start a new debug session with PySpy running!

**N.B.** If you are trying to modify or extend PySpy, there's an isssue in VSCode's typescript import resolution where it will get stuck complaining in the importing file that the imported file could not be found, even if it does exist and imported functions are recognized and can be called. Restarting VSCode should resolve this.


## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

