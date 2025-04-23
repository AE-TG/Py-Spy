# **spy**
### A tool for immediately testing and checking Python code.

## Features

- Automatically attaches to documents in workspaces with the python language active
- Highlights instances of the `#spy` decorator that occur before a function definition
    - Mousing over the highlight provides code coverage testing for that function as provided by Coverage (https://coverage.readthedocs.io).
        - Functions need to type hint their arguments (if any) and functions/methods are currently limited to only ints, floats, strs, and bools.
        - Collates "interesting" data values for plain-old-data function arguments to use as test inputs.
        - You don't need to write any tests yourself!
        - Mouseover will report potential input validation failures so you can instantaneously proof your code.
    - Mousing over the highlight provides code complexity characteristics for that function as determined by Radon (http://radon.readthedocs.org/).

## Known Issues
- VSCode in Browser is unsupported due to filesystem requirements.
- Coverage testing marks comment lines as missed...which is correct, but unhelpful.
- Coverage testing breaks down on overloaded/shadowed functions.

## Requirements

- **Visual Studio Code**
- **Node.js**
- Extension automatically installs the required **Python-Shell** package from **npm**.
- (Optional) **Radon** integration.
- (Optional) **coverage.py** integration.

## Implementation Details

As **spy** is a learning experiment for writing VSCode extensions, it's worth documenting how it works.
#### 1. Extension Setup
- The extension registers itself with an activation event of "onLanguage:python". Thus when VSCode opens a file and loads the user's language spec for python for the first time in a session, `extension.ts::activate()` is executed.
- `activate()` performs the following things:
    - First time setup (defining some values for later use)
    - Registering UI events (`onDidChangeActiveTextEditor` and `onDidChangeTextDocument`) to run UI updates only when potentially useful
    - Checks for the currently attached version of Python, as several features have version requirements (most stringently is that **coverage.py** requires Python 3.9 or higher).

#### 2. Structure
- `package.json`: Extension manifest and description
- `src/extension.ts`: entrypoint
- `src/spy.ts`: Top-level file for **spy** features. This currently includes the 15-second loop which compiles python files found in the workspace as a basic syntax check.
- `src/spyAnalysis.ts`: TBD pylint
- `src/spyCompile.ts`: TBD
- `src/spyCoverage.ts`: Manages code coverage testing features and tools overseeing Coverage integration.
- `src/spyFS.ts`: Filesystem helpers for determining which files and functions in the workspace other features should care about.
- `src/spyMarshal.ts`: Primary TypeScript-to-Python interactions and **Python-Shell** integration that actually runs extension python code.
- `src/spyStatistics.ts`: Manages code complexity features and tools overseeing Radon integration.
- `src/spyTesting.ts`: TBD
- `src/spyUI.ts`: Manages the creation and application of VSCode UI elements for the extension using a `vscode.TextEditorDecorationType`.
- `src/spyInputs.py`: Manages the creation of "interesting" inputs for input testing.
- `src/spyCoverage.py`: Wrapper for coverage and input testing of workspace python code.

#### 3. UI
- Opt-in: only run on files and functions where the user has opted in by adding a `#spy` comment directly before a function. If you want the features, it's right there.
- Whenever the user opens an editor while the extension is active or completes some typing task, these indicators for open editors are updated. This gives a good balance between responsiveness and performance - no updates are being performed while the user is actively coding in the workspace, but as soon as the user stops the updates will trigger for immediate feedback.
- Featuring:
    - Pink line highlight when `#spy` python comments are found, indicating that **spy** will run on the tagged function. Hovering these tags will result in tooltip popups if enabled.
        - Pink highlights come with three gutter icons to indicate to the user the status of coverage testing - a question mark for tests not yet run, a green play icon for coverage tests that encountered no issues, or a red stop icon for coverage tests that failed for some input subset.
    - Unobtrusive green line highlight to indicate code coverage on `#spy`-tagged functions.
    - Unobtrusive red line highlight to indicate lack of code coverage on `#spy`-tagged functions.
- UI calculations are actually doing a lot of work behind the scenes. A list of all of the `#spy` tags and their locations is maintained and that list is what the rest of the code uses to determine what other tools to run and what or where to attach mouseover tooltips to. This is the `spyDecoList` in `spyUI.ts` and every time a relevant user event triggers `updateDecorations()` this list is rebuilt off of only open text editors to keep processing time low.

#### 4. Analysis
- TBD - pylint

#### 5. Testing
- You do not need to write coverage or boundary condition tests! The biggest advantage that **spy** provides is that it will automatically (attempt to) test your code for failure points. Testing is automatically performed when you open or save a file that includes a function tagged with `#spy`.
- **spy** uses a slightly different test mechanism than traditional VSCode test tools and extensions because **spy** automatically performs interface and coverage testing. It does **NOT** make any guarantee that your code is correct - it does not check output correctness, only output validity.
- TBD
- TBD kwargs unsupported - only positional arguments
- TBD overloading unsupported
- TBD block comments will be marked as uncovered, # comments are okay
- **spy** testing runs alongside other VSCode test tools like the default **pytest** and **unittest**. Those tools still work exactly as they are designed to and **spy** does not interfere with them in any way except for potential code coverage highlighting conflicts. You can disable other test extension coverage highlighting by toggling the `Show Inline Coverage` button (default shortcut: `Ctrl+; Ctrl+Shift+I`) if you prefer **spy**'s automatic testing and highlighting, or you can disable **spy**'s testing and highlighting in the extension settings (details below).
- You may desire to hide test output files from your VSCode workspace. TBD here: https://code.visualstudio.com/docs/configure/settings

#### 6. Extension to Other Languages
**spy**, or specifically this flavour **PySpy**, is intended solely for use with Python source code, and the tooling within reflects that. However, it has been intentionally structured in such a way as to (hopefully easily) work for other programming languages by confining the required changes. It's out of the scope of this exercise, but would be neat to do this as a subfolder of `src/` that registers a separate set of handlers for another programming language - expanding to "*C#Spy*" for instance.

- string constants throughout the extension code would need to be updated for non-python use cases.
- `.py` files used for input generation and testing would need to be replaced with appropriate language-specific versions, in particular to preserve type systems.
- `spyAnalysis.ts`, `spyStatistics.ts`, and `spyTesting.ts` would need to be reworked to connect with your chosen static analysis, code complexity, and code coverage test tools, respectively.
Otherwise, things should work as-is; other extension-related files are more focused on tying those features into the skeleton that is the VSCode API to serve up the outputs of those tools in a reasonable manner.

## Extension Settings

* `spy.RadonInstallLocation`: Path to the Radon executable. Needs to be installed separately (for now) with `pip install radon`. A successful install should list the path; note that Windows expects escaped backslashes.
  * With the extension installed (including in debug sessions built from source), you can set this by going to `> File > Preferences > Settings > User > Extensions > PySpy` and changing it in `settings.json`.
  * This setting is persisted with your VSCode profile.
* `spy.TestingEnabled`: True/False toggle for built-in immediate unit testing. Needs to be installed separately (for now) with `pip install coverage`. While enabled, **spy** will automatically attempt to test functions for signature breaks and code coverage, displaying coverage highlights in the traditional red (uncovered) and green (covered) and warning the user about possible errors.
  * With the extension installed (including in debug sessions built from source), you can set this by going to `> File > Preferences > Settings > User > Extensions > PySpy` and changing it in `settings.json`.
  * This setting is persisted with your VSCode profile.

## Building and Running From Source
1. Open a new Visual Studio Code workspace in the repository directory.
2. Press `F5` to start a new debug session with PySpy running!
3. (Optional) Check the **Extension Settings** section above for details on how to install and connect **Radon** integration.
4. (Optional) Check the **Extension Settings** section above for details on how to install and connect **coverage.py** integration.

**N.B.** If you are trying to modify or extend PySpy, there's an isssue in VSCode's typescript import resolution where it will get stuck complaining in the importing file that the imported file could not be found, even if it does exist and imported functions are recognized and can be called. Restarting VSCode should resolve this.

## Lessons Learned
1. The underlying structure of VSCode (at least, as exposed through it's API) is not IDE-focused but rather view-focused.
    - TBD its just a browser
    - extensions (for python, it's pylance) do all the work
2. Start with a UI-Event based set of triggers for extension work.
    - As I realized during development and encapsulated as #1 above, VSCode is really just a UI view. Understanding what events you can register listeners for and using that to build and shape the functionality of the extension from the get-go would have saved me some time and probably resulted in a smoother experience. That said, the API is very limited in some ways, so some workarounds (especially regarding what an "Active Text Editor" really is) had to be invented.
    - I would love to revisit the concept of workspace changes to avoid having to invalidate some of the UI highlighting that **spy** creates whenever the user starts adding or removing code lines, but that feels a bit like reinventing the wheel of what features an IDE is supposed to provide in the first place.
3. The VSCode Extension Host process
    - TBD
    - There's two completely separate versions of this, one for VSCode desktop and one for VSCode browser, and I have not used VSCode browser enough to have a firm understanding of how it works or what I would need to do to work around the filesystem shenanigans going on here to even get Radon and Coverage to run.
    - VSCode uses URIs for file identifiers (almost?) everywhere under the hood, which is great for VSCode browser support, and very annoying when trying to actually use them as file handles in the extension code itself because the VSCode URI library is microscopic.
4. One feature at a time
    - **spy** was developed (mostly) one feature at a time, with each large addition often resulting in restructuring of previous files to better split responsibilities or account for additional conditions. I think this was the right way to go about it because after the first code push or two it kept me focused on what I need to do and how it needs to work with what I already have...
    - ...but could have (or should have) been taken to the next level with "sub-extension" feature registration of parts to `extension.ts`. In my head, some form of dependency injection there is possible and would make multi-language support and adding additional tool/feature integration even easier.
    - The constant shuffling/renaming/reworking of files slowed as the various building blocks fell into place, so I did eventually converge on a more consistent idea of what should go where.
5. Writing to Filesystem
    - VSCode API does not provide any good automated terminal interaction, even for the terminals you can create. The `TerminalShellIntegration` is the only set of features that even approaches this, and I found it such a pain while setting up Radon that I opted to write **Radon** outputs to a file on disk rather than read outputs from the shell it's run in. On my personal computer this actually resulted in a speedup as well. I carried the approach forward to coverage testing as well, and basically all tool integration. **Coverage** is a bit slower and it can happen that **spy** tries to read a coverage report that the operating system has not yet written.
    - This makes **spy** almost impossible to run in VSCode browser so I didn't attempt that but it also brings up a number of code quality concerns regarding extensions that access the user's filesystem and whether or not, even in the best of scenarios, they can clean up after themselves to avoid polluting things. Unfortunately the answer is no, `extension.ts deactivate()` and `spy.ts deleteCache()` will do their best but this is, overall, an issue with the VSCode API workspace, context, and filesystem design.
    - I would love an in-memory approach that could solve both of these issues, but has flaws of its own (and also feels like reinventing the Operating System) - most notably, keeping all the tool outputs for large projects in memory is potentially a **lot** of RAM dedicated to things you only need to know if one associated file is open.
