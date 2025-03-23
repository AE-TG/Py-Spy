# **spy**
### A tool for immediately testing and checking Python code.

## Features

- Automatically attaches to documents in workspaces with the python language active
- Highlights instances of the `@spy` decorator
    - Does NOT yet provide a definition for the decorator
    - Mousing over the highlight provides code complexity characteristics as determined by Radon (http://radon.readthedocs.org/).
- Collates "interesting" data values for plain-old-data function arguments to use as test inputs

## Requirements

- **Visual Studio Code**
- **Node.js**
- Extension automatically installs the required **Python-Shell** package from **npm**.
- (Optional) **Radon** integration.

## Implementation Details

As **spy** is a learning experiment for writing VSCode extensions, it's worth documenting how it works.
#### 1. Extension Setup
- The extension registers itself with an activation event of "onLanguage:python". Thus when VSCode opens a file and loads the user's language spec for python for the first time in a session, `extension.ts::activate()` is executed.
- `activate()` performs the following things:
    - First time setup (defining some values for later use)
    - Registering UI events (`onDidChangeActiveTextEditor` and `onDidChangeTextDocument`) to run UI updates only when potentially useful
    - Starting a thread to run the rest of the **spy** functionality every 15 seconds (TBD: will be deprecated as features are fleshed out)
#### 2. Structure
- `package.json`: Extension manifest and description
- `src/extension.ts`: entrypoint
- `src/spy.ts`: Top-level file for **spy** features. This currently includes the 15-second loop which compiles python files found in the workspace as a basic syntax check.
- `src/spyCompile.ts`: TBD
- `src/spyCC.ts`: Manages code complexity and (TBD: code coverage) features and tools.
- `src/spyFS.ts`: Filesystem helpers for determining which files and functions in the workspace other features should care about.
- `src/spyInputs.ts`: Manages the creation of "interesting" inputs for input checking functions.
- `src/spyUI.ts`: Manages the creation and application of VSCode UI elements for the extension using a `vscode.TextEditorDecorationType`.
- `src/spyMarshal.py`: Python script for the marshaling of python bytecode, used to inspect functions as part of the testing features.
#### 3. UI
- Opt-in: only run on files and functions where the user has opted in with the `@spy` decorator. If you want the features, it's right there.
  - **NOTICE:** You currently need to provide your own definition. Recommend `def spy(fn): pass` at the top of files in which you want to use it until the extension automatically inserts this in TBD future update.
- Whenever the user opens an editor while the extension is active or completes some typing task, these decorators for open editors are updated. This gives a good balance between responsiveness and performance - no updates are being performed while the user is actively coding in the workspace, but as soon as the user stops the updates will trigger for immediate feedback.
- Featuring:
  - Pink line highlight when `@spy` python decorators are found, indicating that **spy** will run on the decorated function. Hovering these decorations will result in a tooltip popup with Radon code statistics if enabled.
  - Unobtrusive green line highlight (TBD: coming soon) to indicate code coverage on `@spy`-decorated functions.
  - Unobtrusive red line highlight (TBD: coming soon) to indicate lack of code coverage on `@spy`-decorated functions.
#### 4. Analysis
- TBD
#### 5. Testing
- You do not need to write tests! The biggest advantage that **spy** provides is that it will automatically (attempt to) test your code for failure points. Testing is automatically performed when you save a file that includes a function decorated with `@spy`.
- **spy** uses a slightly different test mechanism than traditional VSCode test tools and extensions because **spy** automatically performs interface and coverage testing. It does **NOT** make any guarantee that your code is correct - it does not check output correctness, only output validity.
- TBD
- **spy** testing runs alongside other VSCode test tools like the default **pytest** and **unittest**. Those tools still work exactly as they are designed to and **spy** does not interfere with them in any way except for potential code coverage highlighting conflicts. You can disable other test extension coverage highlighting by toggling the `Show Inline Coverage` button (default shortcut: `Ctrl+; Ctrl+Shift+I`) if you prefer **spy**'s automatic testing and highlighting, or you can disable **spy**'s testing and highlighting in the extension settings (details below).

## Extension Settings

* `spy.RadonInstallLocation`: Path to the Radon executable. Needs to be installed separately (for now) with `pip install radon`. A successful install should list the path; note that Windows expects escaped backslashes.
  * With the extension installed (including in debug sessions built from source), you can set this by going to `> File > Preferences > Settings > User > Extensions > PySpy` and changing it in `settings.json`.
  * This setting is persisted with your VSCode profile.
* `spy.TestingEnabled`: True/False toggle for built-in immediate unit testing. While enabled, **spy** will automatically attempt to test functions for signature breaks and code coverage, displaying coverage highlights in the traditional red (uncovered) and green (covered) and warning the user about possible errors.
  * With the extension installed (including in debug sessions built from source), you can set this by going to `> File > Preferences > Settings > User > Extensions > PySpy` and changing it in `settings.json`.
  * This setting is persisted with your VSCode profile.

## Building and Running From Source
1. Open a new Visual Studio Code workspace in the repository directory.
2. Press `F5` to start a new debug session with PySpy running!
3. (Optional) Check the **Extension Settings** section above for details on how to install and connect **Radon** integration.

**N.B.** If you are trying to modify or extend PySpy, there's an isssue in VSCode's typescript import resolution where it will get stuck complaining in the importing file that the imported file could not be found, even if it does exist and imported functions are recognized and can be called. Restarting VSCode should resolve this.


## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

